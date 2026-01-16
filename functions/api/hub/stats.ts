/**
 * GET /api/hub/stats - Get hub statistics
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse, verifyToken } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
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

    const db = context.env.ANALYTICS_DB;

    // Get counts by status
    const statusCounts = await db
      .prepare(
        `SELECT 
          status,
          COUNT(*) as count
         FROM cases
         GROUP BY status`
      )
      .all();

    // Get counts by type
    const typeCounts = await db
      .prepare(
        `SELECT 
          case_type,
          COUNT(*) as count
         FROM cases
         GROUP BY case_type`
      )
      .all();

    // Get completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM cases 
         WHERE status = 'completed' AND completed_at >= ?`
      )
      .bind(today.toISOString())
      .first();

    // Calculate average resolution time
    const avgTime = await db
      .prepare(
        `SELECT AVG(
          (julianday(completed_at) - julianday(created_at)) * 24
         ) as avg_hours
         FROM cases
         WHERE status = 'completed' AND completed_at IS NOT NULL`
      )
      .first();

    // Build response
    const statusMap = new Map(
      statusCounts.results.map((r: any) => [r.status, r.count])
    );
    const typeMap = new Map(
      typeCounts.results.map((r: any) => [r.case_type, r.count])
    );

    const pending = (statusMap.get('pending') || 0) as number;
    const inProgress = (statusMap.get('in_progress') || 0) as number;
    const completed = (statusMap.get('completed') || 0) as number;

    const avgHours = (avgTime?.avg_hours as number) || 0;
    const avgTimeStr = avgHours < 1
      ? `${Math.round(avgHours * 60)}m`
      : avgHours < 24
      ? `${Math.round(avgHours)}h`
      : `${Math.round(avgHours / 24)}d`;

    return jsonResponse({
      success: true,
      pending,
      inProgress,
      completed,
      completedToday: (completedToday?.count as number) || 0,
      avgTime: avgTimeStr,
      all: pending + inProgress + completed,
      shipping: (typeMap.get('shipping') || 0) as number,
      refund: (typeMap.get('refund') || 0) as number,
      subscription: (typeMap.get('subscription') || 0) as number,
      return: (typeMap.get('return') || 0) as number,
      manual: (typeMap.get('manual') || 0) as number,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return errorResponse('Internal server error', 500);
  }
};
