import { SoraBenchmarkSummary, SoraDailyRate, BackendIntegrationConfig } from '../types/sora';
import { INITIAL_MAS_BENCHMARK, DEFAULT_MAS_DAILY_RATES } from '../data/masSoraRates';

// Local storage key for backend config
const BACKEND_CONFIG_KEY = 'mas_sora_backend_config';

export const DEFAULT_BACKEND_CONFIG: BackendIntegrationConfig = {
  backendEndpointUrl: '/api/mas/sora-rates',
  apiKey: '',
  useLiveMasProxy: false,
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
  source: 'MAS_OFFICIAL_DATA' | 'CUSTOM_BACKEND' | 'FALLBACK';
  message: string;
  timestamp: string;
  statusCode?: number;
}

/**
 * Service to fetch SORA benchmark & overnight rates
 * Checks custom backend URL if configured and enabled, otherwise uses built-in MAS dataset
 */
export async function fetchMasSoraRates(
  config: BackendIntegrationConfig = getSavedBackendConfig()
): Promise<FetchRatesResult> {
  const timestamp = new Date().toISOString();

  // If custom backend proxy is enabled and url provided
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

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Expected structure from user's future backend:
      // { summary: SoraBenchmarkSummary, dailyRates?: SoraDailyRate[] }
      if (data && data.summary && typeof data.summary.compounded3M === 'number') {
        return {
          summary: {
            ...data.summary,
            source: 'CUSTOM_BACKEND',
          },
          dailyRates: Array.isArray(data.dailyRates) ? data.dailyRates : DEFAULT_MAS_DAILY_RATES,
          source: 'CUSTOM_BACKEND',
          message: `Connected successfully to ${config.backendEndpointUrl}`,
          timestamp,
          statusCode: response.status,
        };
      } else {
        throw new Error('Backend response did not match expected SORA benchmark schema');
      }
    } catch (err: any) {
      if (config.enableDebugLogs) {
        console.warn('Backend fetch failed, falling back to MAS official dataset:', err);
      }
      return {
        summary: INITIAL_MAS_BENCHMARK,
        dailyRates: DEFAULT_MAS_DAILY_RATES,
        source: 'FALLBACK',
        message: `Backend connection error (${err.message || 'Offline'}). Using bundled MAS official data.`,
        timestamp,
      };
    }
  }

  // Standard official MAS offline/bundled rates (instant, accurate, no CORS or maintenance errors)
  return {
    summary: INITIAL_MAS_BENCHMARK,
    dailyRates: DEFAULT_MAS_DAILY_RATES,
    source: 'MAS_OFFICIAL_DATA',
    message: 'Official MAS benchmark rates loaded (Publication: 9:00 AM SGT)',
    timestamp,
  };
}
