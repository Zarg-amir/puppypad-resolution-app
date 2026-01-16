/**
 * Middleware - CORS and authentication handling
 */

// Environment bindings type
export interface Env {
  ANALYTICS_DB: D1Database;
  PRODUCT_DOCS: R2Bucket;
  EVIDENCE_UPLOADS: R2Bucket;
  JWT_SECRET: string;
  SHOPIFY_STORE_URL: string;
  SHOPIFY_ACCESS_TOKEN: string;
  CLICKUP_API_KEY: string;
  CLICKUP_LIST_ID: string;
  RICHPANEL_API_KEY?: string;
  PARCELPANEL_API_KEY?: string;
}

// Helper to create CORS headers
export function getCorsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// JSON response helper
export function jsonResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
    },
  });
}

// Error response helper
export function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

// Verify JWT token
export async function verifyToken(token: string, secret: string): Promise<{ userId: number; username: string } | null> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const signatureData = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const data = encoder.encode(`${headerB64}.${payloadB64}`);

    const valid = await crypto.subtle.verify('HMAC', key, signatureData, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

// Generate JWT token
export async function generateToken(payload: object, secret: string, expiresIn = '24h'): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + (expiresIn === '24h' ? 86400 : 3600);
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(fullPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
