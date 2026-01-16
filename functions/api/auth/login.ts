/**
 * POST /api/auth/login - User authentication
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse, generateToken } from '../../_middleware';

// Hardcoded admin users (in production, use database)
const ADMIN_USERS = [
  {
    id: '1',
    email: 'zarg.business@gmail.com',
    password: 'puppypad2026',
    name: 'Zarg',
    role: 'admin',
  },
];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { email, password } = await context.request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Find user by email and password
    const user = ADMIN_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate token
    const token = await generateToken(
      { userId: user.id, email: user.email },
      context.env.JWT_SECRET || 'puppypad-secret-key-2026'
    );

    return jsonResponse({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
};
