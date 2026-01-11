/**
 * Authentication Utilities
 * Token generation, verification, and password hashing
 */

import { ADMIN_CONFIG } from '../config/constants.js';

/**
 * Hash a string using SHA-256
 */
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password with the secret
 */
export async function hashPassword(password) {
  return await sha256(password + ADMIN_CONFIG.tokenSecret);
}

/**
 * Generate an authentication token
 */
export async function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + ADMIN_CONFIG.tokenExpiryHours * 60 * 60 * 1000
  };
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = await sha256(payloadStr + ADMIN_CONFIG.tokenSecret);
  return `${payloadStr}.${signature}`;
}

/**
 * Verify and decode an authentication token
 * Returns the payload if valid, null if invalid
 */
export async function verifyToken(token) {
  if (!token) return null;

  try {
    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;

    // Verify signature
    const expectedSig = await sha256(payloadStr + ADMIN_CONFIG.tokenSecret);
    if (signature !== expectedSig) return null;

    // Decode and check expiry
    const payload = JSON.parse(atob(payloadStr));
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
}

/**
 * Middleware to verify authentication
 * Returns user payload if authenticated, null otherwise
 */
export async function requireAuth(request) {
  const token = extractToken(request);
  return await verifyToken(token);
}
