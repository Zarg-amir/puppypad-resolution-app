/**
 * /api/sessions - Session management
 * POST: Create a new session
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return errorResponse('Session ID is required', 400);
    }

    const db = context.env.ANALYTICS_DB;
    const now = new Date().toISOString();

    // Check if session already exists
    const existing = await db
      .prepare('SELECT session_id FROM sessions WHERE session_id = ?')
      .bind(sessionId)
      .first();

    if (existing) {
      return jsonResponse({ success: true, existing: true });
    }

    // Create new session
    await db
      .prepare(
        `INSERT INTO sessions (session_id, started_at, completed, case_created)
         VALUES (?, ?, 0, 0)`
      )
      .bind(sessionId, now)
      .run();

    return jsonResponse({ success: true, created: true });
  } catch (error) {
    console.error('Create session error:', error);
    return errorResponse('Internal server error', 500);
  }
};
