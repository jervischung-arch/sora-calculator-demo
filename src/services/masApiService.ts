import { SoraBenchmarkSummary, SoraDailyRate, BackendIntegrationConfig } from '../types/sora';
import { INITIAL_MAS_BENCHMARK, DEFAULT_MAS_DAILY_RATES } from '../data/masSoraRates';

// Local storage key for backend config
const BACKEND_CONFIG_KEY = 'mas_sora_backend_config';

export const DEFAULT_BACKEND_CONFIG: BackendIntegrationConfig = {
  backendEndpointUrl: '/api/sora',
  apiKey: '',
  useLiveMasProxy: true, // Attempt serverless proxy by default
  enableDebugLogs: false,
};

export function getSavedBackendConfig(): BackendIntegrationConfig {
  try {
    const raw = localStorage.getItem(BACKEND_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_BACKEND_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_BACKEND_CONFIG;
}

export function saveBackendConfig(config: BackendIntegrationConfig): void {
  try {
    localStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export interface FetchRatesResult {
  summary: SoraBenchmarkSummary;
  dailyRates: SoraDailyRate[];
  source: 'MAS_LIVE_API' | 'MAS_OFFICIAL_DATA' | 'CUSTOM_BACKEND' | 'FALLBACK';
  message: string;
  timestamp: string;
  statusCode?: number;
  masKeyConfigured?: boolean;
}

/**
 * Health check helper for /api/health
 */
export async function checkServerHealth(): Promise<{
  ok: boolean;
  masKeyConfigured: boolean;
  uptimeSeconds: number;
  timestamp: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { ok: false, masKeyConfigured: false, uptimeSeconds: 0, timestamp: new Date().toISOString(), message: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return {
      ok: data.status === 'ok',
      masKeyConfigured: Boolean(data.environment?.masKeyConfigured),
      uptimeSeconds: data.uptimeSeconds || 0,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      ok: false,
      masKeyConfigured: false,
      uptimeSeconds: 0,
      timestamp: new Date().toISOString(),
      message: err.message,
    };
  }
}

/**
 * Service to fetch SORA benchmark & overnight rates
 * Queries the serverless endpoint (/api/sora) which connects to MAS APIM Gateway with KeyId header
 */
export async function fetchMasSoraRates(
  config: BackendIntegrationConfig = getSavedBackendConfig()
): Promise<FetchRatesResult> {
  const timestamp = new Date().toISOString();

  // Try serverless endpoint (/api/sora or custom configured URL)
  if (config.useLiveMasProxy && config.backendEndpointUrl) {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.backendEndpointUrl, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      // If MAS_KEY_ID was missing, serverless returns 400 with CONFIG_REQUIRED
      if (data.source === 'CONFIG_REQUIRED') {
        return {
          summary: INITIAL_MAS_BENCHMARK,
          dailyRates: DEFAULT_MAS_DAILY_RATES,
          source: 'MAS_OFFICIAL_DATA',
          message: 'Official MAS benchmark active (Set MAS_KEY_ID in .env for live gateway sync)',
          timestamp,
          statusCode: 200,
          masKeyConfigured: false,
        };
      }

      // If live MAS data returned
      if (data.success && data.summary && typeof data.summary.compounded3M === 'number') {
        return {
          summary: {
            ...data.summary,
            source: 'MAS_OFFICIAL_DATA',
          },
          dailyRates: Array.isArray(data.dailyRates) && data.dailyRates.length > 0
            ? data.dailyRates
            : DEFAULT_MAS_DAILY_RATES,
          source: 'MAS_LIVE_API',
          message: 'Live MAS APIM Gateway data loaded (Authenticated via KeyId)',
          timestamp,
          statusCode: response.status,
          masKeyConfigured: true,
        };
      }

      // If MAS Gateway returned an error status (e.g. 401 invalid key)
      if (data.error) {
        return {
          summary: INITIAL_MAS_BENCHMARK,
          dailyRates: DEFAULT_MAS_DAILY_RATES,
          source: 'FALLBACK',
          message: `MAS Gateway: ${data.error}. Using bundled MAS benchmark data.`,
          timestamp,
          statusCode: data.statusCode || response.status,
          masKeyConfigured: true,
        };
      }
    } catch (err: any) {
      if (config.enableDebugLogs) {
        console.warn('Backend fetch failed, falling back to MAS official dataset:', err);
      }
      return {
        summary: INITIAL_MAS_BENCHMARK,
        dailyRates: DEFAULT_MAS_DAILY_RATES,
        source: 'FALLBACK',
        message: 'Using bundled MAS official data (Serverless endpoint offline).',
        timestamp,
      };
    }
  }

  // Standard official MAS bundled rates
  return {
    summary: INITIAL_MAS_BENCHMARK,
    dailyRates: DEFAULT_MAS_DAILY_RATES,
    source: 'MAS_OFFICIAL_DATA',
    message: 'Official MAS benchmark rates loaded (Publication: 9:00 AM SGT)',
    timestamp,
    masKeyConfigured: false,
  };
}
