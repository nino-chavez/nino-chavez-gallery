/**
 * SmugMug API Proxy - Vercel Serverless Function
 *
 * CRITICAL SECURITY: This BFF (Backend-for-Frontend) securely stores SmugMug
 * API credentials and prevents token exposure to the client.
 *
 * All SmugMug API calls MUST go through this proxy.
 *
 * ENHANCEMENTS APPLIED (Audit Issue #9):
 * - Enhanced endpoint validation with regex patterns
 * - Request timeout protection (30s)
 * - Request logging for monitoring
 * - Better error handling with context
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// Server-side configuration (NOT exposed to client)
const config = {
  apiKey: process.env.SMUGMUG_API_KEY!,
  apiSecret: process.env.SMUGMUG_API_SECRET!,
  accessToken: process.env.SMUGMUG_ACCESS_TOKEN!,
  accessTokenSecret: process.env.SMUGMUG_ACCESS_TOKEN_SECRET!,
  baseUrl: 'https://api.smugmug.com/api/v2',
};

// OAuth 1.0a client
const oauth = new OAuth({
  consumer: {
    key: config.apiKey,
    secret: config.apiSecret,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

const token = {
  key: config.accessToken,
  secret: config.accessTokenSecret,
};

/**
 * Enhanced endpoint validation with regex patterns
 *
 * Prevents SSRF attacks and validates query parameters
 */
function validateEndpoint(endpoint: string): { valid: boolean; reason?: string } {
  // Pattern validation: allow specific endpoint formats with optional query params
  const ENDPOINT_PATTERN = /^\/(user\/[\w-]+!albums|album\/[\w-]+!images|image\/[\w-]+!(?:metadata|exif)|!authuser)(\?[\w=&%-]+)?$/;

  if (!ENDPOINT_PATTERN.test(endpoint)) {
    return { valid: false, reason: 'Invalid endpoint pattern' };
  }

  // Prevent path traversal attacks
  if (endpoint.includes('..') || endpoint.includes('//')) {
    return { valid: false, reason: 'Path traversal detected' };
  }

  // Validate query parameters if present
  if (endpoint.includes('?')) {
    const [, queryString] = endpoint.split('?');
    const params = new URLSearchParams(queryString);

    // Whitelist of allowed query parameters
    const allowedParams = [
      '_expand',
      '_filter',
      '_filteruri',
      'count',
      'start',
      '_sort',
      '_sortdirection',
      '_verbosity',
    ];

    for (const key of params.keys()) {
      if (!allowedParams.includes(key)) {
        return { valid: false, reason: `Unauthorized query parameter: ${key}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Make authenticated OAuth request to SmugMug API with timeout
 */
async function makeSmugMugRequest(endpoint: string): Promise<Response> {
  const url = `${config.baseUrl}${endpoint}`;
  const requestData = { url, method: 'GET' };

  // Generate unique timestamp and nonce per request (prevents replay attacks)
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = `${crypto.randomBytes(16).toString('hex')}-${process.hrtime.bigint().toString()}`;

  // Generate OAuth signature
  const auth = oauth.authorize(requestData, token, { timestamp, nonce } as any);
  const authHeader = oauth.toHeader(auth);

  // Request timeout (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Accept': 'application/json',
        'X-Smug-ResponseType': 'JSON',
        'User-Agent': 'NinoGallery/1.0 (+vercel)',
      },
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Log request for monitoring and debugging
 */
function logRequest(
  req: VercelRequest,
  endpoint: string,
  duration: number,
  status: number,
  error?: string
): void {
  const log = {
    timestamp: new Date().toISOString(),
    ip: (req.headers['x-forwarded-for'] as string) || (req.headers['x-real-ip'] as string) || 'unknown',
    endpoint,
    duration,
    status,
    userAgent: req.headers['user-agent'] || 'unknown',
    error: error || undefined,
  };

  // Log to stdout (captured by Vercel)
  console.log('[SmugMug Proxy]', JSON.stringify(log));
}

/**
 * Vercel Serverless Function Handler
 *
 * Routes:
 * - GET /api/smugmug-proxy?endpoint=/user/ninochavez!albums
 * - GET /api/smugmug-proxy?endpoint=/album/{albumKey}!images
 * - GET /api/smugmug-proxy?endpoint=/image/{imageKey}!metadata
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

  // CORS headers for client access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    logRequest(req, '', Date.now() - startTime, 405, 'Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate environment variables
    if (!config.apiKey || !config.apiSecret || !config.accessToken || !config.accessTokenSecret) {
      console.error('[SmugMug Proxy] Missing API credentials in environment variables');
      logRequest(req, '', Date.now() - startTime, 500, 'Missing credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get endpoint from query parameter
    const { endpoint } = req.query;

    if (!endpoint || typeof endpoint !== 'string') {
      logRequest(req, '', Date.now() - startTime, 400, 'Missing endpoint');
      return res.status(400).json({ error: 'Missing endpoint query parameter' });
    }

    // Enhanced endpoint validation
    const validation = validateEndpoint(endpoint);
    if (!validation.valid) {
      logRequest(req, endpoint, Date.now() - startTime, 403, validation.reason);
      return res.status(403).json({
        error: 'Invalid endpoint',
        reason: validation.reason,
      });
    }

    // Make request to SmugMug API
    let response: Response;
    try {
      response = await makeSmugMugRequest(endpoint);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logRequest(req, endpoint, Date.now() - startTime, 504, 'Request timeout');
        return res.status(504).json({ error: 'Request timeout (30s limit exceeded)' });
      }
      throw error;
    }

    // Check rate limits and log warnings
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 100) {
      console.warn(`[SmugMug Proxy] Rate limit warning: ${remaining} requests remaining`);
    }

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SmugMug Proxy] API error: ${response.status} ${response.statusText}`);
      console.error(`[SmugMug Proxy] Endpoint: ${endpoint}`);
      console.error(`[SmugMug Proxy] Response: ${errorText.substring(0, 500)}`);

      logRequest(req, endpoint, duration, response.status, response.statusText);

      return res.status(response.status).json({
        error: `SmugMug API error: ${response.statusText}`,
        details: errorText.substring(0, 200),
      });
    }

    // Return SmugMug response to client
    const data = await response.json();
    logRequest(req, endpoint, duration, 200);

    return res.status(200).json(data.Response);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('[SmugMug Proxy] Unexpected error:', error);
    logRequest(req, req.query.endpoint as string || '', duration, 500, errorMessage);

    return res.status(500).json({
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
