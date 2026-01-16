/**
 * GET /api/auth/verify - Verify JWT token
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse, verifyToken } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('No token provided', 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token, context.env.JWT_SECRET || 'default-secret');

    if (!payload) {
      return errorResponse('Invalid or expired token', 401);
    }

    // Get user from database
    const db = context.env.ANALYTICS_DB;
    const user = await db
      .prepare('SELECT id, username, name, role FROM admin_users WHERE id = ?')
      .bind(payload.userId)
      .first();

    if (!user) {
      return errorResponse('User not found', 401);
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return errorResponse('Internal server error', 500);
  }
};
