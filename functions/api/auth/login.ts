/**
 * POST /api/auth/login - User authentication
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse, generateToken, hashPassword } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { username, password } = await context.request.json();

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    const db = context.env.ANALYTICS_DB;
    const passwordHash = await hashPassword(password);

    // Look up user
    const user = await db
      .prepare('SELECT id, username, name, role FROM admin_users WHERE username = ? AND password_hash = ?')
      .bind(username, passwordHash)
      .first();

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate token
    const token = await generateToken(
      { userId: user.id, username: user.username },
      context.env.JWT_SECRET || 'default-secret'
    );

    // Update last login
    await db
      .prepare('UPDATE admin_users SET last_login = ? WHERE id = ?')
      .bind(new Date().toISOString(), user.id)
      .run();

    return jsonResponse({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
};
