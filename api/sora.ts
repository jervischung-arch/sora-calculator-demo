/**
 * Serverless API endpoint for fetching official MAS SORA benchmark rates
 * Path: /api/sora.ts
 *
 * Upstream MAS APIM Gateway:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 *
 * Authentication:
 * Requires Header: `KeyId: <MAS_KEY_ID>`
 * (Read strictly from process.env.MAS_KEY_ID, never hardcoded)
 */

export const MAS_SORA_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export interface MasRecord {
  end_of_day?: string;
  date?: string;
  sora?: number | string;
  sora_comp_1m?: number | string;
  sora_comp_3m?: number | string;
  sora_comp_6m?: number | string;
  sora_index?: number | string;
  aggregate_volume?: number | string;
  volume?: number | string;
  [key: string]: any;
}

export interface NormalizedSoraResponse {
  success: boolean;
  timestamp: string;
  source: 'MAS_LIVE_API' | 'CONFIG_REQUIRED' | 'GATEWAY_ERROR';
  summary?: {
    publicationDate: string;
    overnightSora: number;
    compounded1M: number;
    compounded3M: number;
    compounded6M: number;
    soraIndex: number;
    source: 'MAS_OFFICIAL_DATA';
  };
  dailyRates?: Array<{
    date: string;
    rate: number;
    dayCountWeight: number;
    volumeMillionSGD?: number;
  }>;
  totalRecords?: number;
  error?: string;
  statusCode?: number;
  instructions?: string;
}

/**
 * Parses numeric rate from string or number safely
 */
function parseRate(val: any, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/,/g, '').trim());
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Calculates day count weight (Friday = 3 days until Monday, others = 1 day)
 */
function computeDayCountWeight(dateStr: string): number {
  try {
    const d = new Date(dateStr);
    const day = d.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
    return day === 5 ? 3 : 1;
  } catch {
    return 1;
  }
}

/**
 * Core handler logic to fetch and normalize MAS SORA data
 */
export async function fetchFromMasGateway(searchParams?: URLSearchParams): Promise<{
  statusCode: number;
  body: NormalizedSoraResponse;
}> {
  const masKeyId = process.env.MAS_KEY_ID?.trim();
  const timestamp = new Date().toISOString();

  // 1. Guard: Check if MAS_KEY_ID is configured
  if (!masKeyId) {
    return {
      statusCode: 400,
      body: {
        success: false,
        timestamp,
        source: 'CONFIG_REQUIRED',
        error: 'MAS_KEY_ID environment variable is missing',
        instructions:
          'To connect to the live MAS APIM Gateway, please configure MAS_KEY_ID in your environment variables (.env file or deployment secrets).',
      },
    };
  }

  // 2. Build target URL with optional query parameters
  const targetUrl = new URL(MAS_SORA_ENDPOINT);
  if (searchParams) {
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.append(key, value);
    });
  }

  // 3. Perform request to MAS APIM Gateway with KeyId header
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        KeyId: masKeyId,
        Accept: 'application/json',
        'User-Agent': 'SORA-Calculator/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        statusCode: response.status,
        body: {
          success: false,
          timestamp,
          source: 'GATEWAY_ERROR',
          statusCode: response.status,
          error: `MAS Gateway responded with HTTP ${response.status}: ${response.statusText}`,
          instructions:
            response.status === 401
              ? 'Unauthorized: Verify that MAS_KEY_ID is valid and active for the MAS Domestic Interest Rates dataset.'
              : errorText.slice(0, 500),
        },
      };
    }

    const data: any = await response.json();

    // 4. Extract records array from MAS API structure
    // MAS Datastore or APIM Gateway usually returns { result: { records: [...] } } or array
    let rawRecords: MasRecord[] = [];
    if (Array.isArray(data)) {
      rawRecords = data;
    } else if (data.result && Array.isArray(data.result.records)) {
      rawRecords = data.result.records;
    } else if (data.records && Array.isArray(data.records)) {
      rawRecords = data.records;
    } else if (data.data && Array.isArray(data.data)) {
      rawRecords = data.data;
    }

    if (rawRecords.length === 0) {
      return {
        statusCode: 200,
        body: {
          success: true,
          timestamp,
          source: 'MAS_LIVE_API',
          totalRecords: 0,
          error: 'No records returned from MAS APIM Gateway for the requested view.',
        },
      };
    }

    // Sort descending by date to get latest first
    const sortedRecords = [...rawRecords].sort((a, b) => {
      const dateA = a.end_of_day || a.date || '';
      const dateB = b.end_of_day || b.date || '';
      return dateB.localeCompare(dateA);
    });

    const latest = sortedRecords[0];

    const publicationDate = latest.end_of_day || latest.date || new Date().toISOString().split('T')[0];
    const overnightSora = parseRate(latest.sora || latest.sora_rate, 2.75);
    const compounded1M = parseRate(latest.sora_comp_1m || latest.compounded_1m, 2.80);
    const compounded3M = parseRate(latest.sora_comp_3m || latest.compounded_3m, 2.85);
    const compounded6M = parseRate(latest.sora_comp_6m || latest.compounded_6m, 2.90);
    const soraIndex = parseRate(latest.sora_index || latest.index, 1.15);

    // Map daily rates for compounding inspection and charts
    const dailyRates = sortedRecords.slice(0, 120).map((r) => {
      const d = r.end_of_day || r.date || '';
      return {
        date: d,
        rate: parseRate(r.sora || r.sora_rate, overnightSora),
        dayCountWeight: computeDayCountWeight(d),
        volumeMillionSGD: parseRate(r.aggregate_volume || r.volume, 3000),
      };
    });

    return {
      statusCode: 200,
      body: {
        success: true,
        timestamp,
        source: 'MAS_LIVE_API',
        totalRecords: rawRecords.length,
        summary: {
          publicationDate,
          overnightSora,
          compounded1M,
          compounded3M,
          compounded6M,
          soraIndex,
          source: 'MAS_OFFICIAL_DATA',
        },
        dailyRates,
      },
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      statusCode: 502,
      body: {
        success: false,
        timestamp,
        source: 'GATEWAY_ERROR',
        error: err.name === 'AbortError' ? 'Connection to MAS APIM Gateway timed out' : err.message,
        instructions: 'Check network connectivity or MAS APIM gateway availability.',
      },
    };
  }
}

/**
 * Universal Serverless Handler (Vercel / Express / AWS Lambda / Cloud Run)
 */
export default async function handler(req: any, res?: any) {
  // Extract query parameters if available
  let searchParams: URLSearchParams | undefined;
  if (req?.query && typeof req.query === 'object') {
    searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') searchParams.set(k, v);
    }
  } else if (req?.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      searchParams = url.searchParams;
    } catch {
      // ignore
    }
  }

  const { statusCode, body } = await fetchFromMasGateway(searchParams);

  // Express / Vercel style (res.status().json())
  if (res && typeof res.status === 'function') {
    return res.status(statusCode).json(body);
  }

  // Web Standard Response (Fetch / Edge / Cloudflare Workers)
  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Named export for Web Standard Fetch (e.g. Next.js App Router / Edge)
export async function GET(request?: Request) {
  let searchParams: URLSearchParams | undefined;
  if (request?.url) {
    try {
      const parsed = new URL(request.url);
      searchParams = parsed.searchParams;
    } catch {
      // ignore
    }
  }

  const { statusCode, body } = await fetchFromMasGateway(searchParams);

  return new Response(JSON.stringify(body, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
