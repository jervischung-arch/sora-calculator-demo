/**
 * Health check serverless endpoint
 * Path: /api/health.ts
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    masKeyConfigured: boolean;
    nodeEnv: string;
  };
  endpoints: {
    health: string;
    sora: string;
  };
}

export async function handleHealth(): Promise<HealthResponse> {
  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID && process.env.MAS_KEY_ID.trim().length > 0);

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: {
      masKeyConfigured,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    endpoints: {
      health: '/api/health',
      sora: '/api/sora',
    },
  };
}

/**
 * Universal Serverless Handler (Vercel / Express / AWS Lambda / Cloud Functions)
 */
export default async function handler(req: any, res?: any) {
  const data = await handleHealth();

  // Express / Vercel style (res.status().json())
  if (res && typeof res.status === 'function') {
    return res.status(200).json(data);
  }

  // Web Standard Response (Fetch / Edge / Cloudflare Workers)
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Named export for Web Fetch / Next.js route handlers
export async function GET(request?: Request) {
  const data = await handleHealth();
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
