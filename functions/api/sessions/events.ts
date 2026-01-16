/**
 * POST /api/sessions/events - Log a session event
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse } from '../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    const { sessionId, eventType, eventName, eventData } = body;

    if (!sessionId || !eventType || !eventName) {
      return errorResponse('Missing required fields', 400);
    }

    const db = context.env.ANALYTICS_DB;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO events (session_id, event_type, event_name, event_data, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        sessionId,
        eventType,
        eventName,
        eventData ? JSON.stringify(eventData) : null,
        now
      )
      .run();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Log event error:', error);
    return errorResponse('Internal server error', 500);
  }
};
