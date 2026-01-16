/**
 * POST /api/cases/[caseId]/comments - Add a comment to a case
 */

import type { Env } from '../../../_middleware';
import { jsonResponse, errorResponse, verifyToken } from '../../../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const caseId = context.params.caseId as string;
    
    // Verify auth
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token, context.env.JWT_SECRET || 'default-secret');
    if (!user) {
      return errorResponse('Invalid token', 401);
    }

    const body = await context.request.json();
    const { content, isInternal = true } = body;

    if (!content?.trim()) {
      return errorResponse('Content is required', 400);
    }

    const db = context.env.ANALYTICS_DB;
    const now = new Date().toISOString();

    await db
      .prepare(
        `INSERT INTO case_comments (case_id, user_id, content, is_internal, created_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(caseId, user.userId, content.trim(), isInternal ? 1 : 0, now)
      .run();

    // Update case updated_at
    await db
      .prepare('UPDATE cases SET updated_at = ? WHERE case_id = ?')
      .bind(now, caseId)
      .run();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Add comment error:', error);
    return errorResponse('Internal server error', 500);
  }
};
