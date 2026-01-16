/**
 * Authentication Utilities
 * Token generation, verification, and password hashing
 */

import { ADMIN_CONFIG } from '../config/constants.js';

/**
 * Hash a password with the secret using SHA-256
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ADMIN_CONFIG.tokenSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate an authentication token
 */
export async function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + (ADMIN_CONFIG.tokenExpiryHours * 60 * 60 * 1000)
  };
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + ADMIN_CONFIG.tokenSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return btoa(JSON.stringify(payload)) + '.' + signature;
}

/**
 * Verify and decode an authentication token
 * Returns the payload if valid, null if invalid
 */
export async function verifyToken(token) {
  if (!token) return null;

  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = JSON.parse(atob(payloadB64));

    if (payload.exp < Date.now()) {
      return null; // Token expired
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload) + ADMIN_CONFIG.tokenSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature === expectedSignature) {
      return payload;
    }
    return null;
  } catch (e) {
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
