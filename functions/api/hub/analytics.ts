/**
 * GET /api/hub/analytics - Get analytics data
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

    const url = new URL(context.request.url);
    const range = url.searchParams.get('range') || '30d';

    const db = context.env.ANALYTICS_DB;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get total cases
    const totalCases = await db
      .prepare('SELECT COUNT(*) as count FROM cases')
      .first();

    // Get cases by status
    const casesByStatus = await db
      .prepare(
        `SELECT status, COUNT(*) as count FROM cases GROUP BY status`
      )
      .all();

    // Get cases by type
    const casesByType = await db
      .prepare(
        `SELECT case_type as type, COUNT(*) as count FROM cases GROUP BY case_type`
      )
      .all();

    // Get resolution types
    const resolutionTypes = await db
      .prepare(
        `SELECT resolution_type as type, COUNT(*) as count 
         FROM cases 
         WHERE resolution_type IS NOT NULL 
         GROUP BY resolution_type`
      )
      .all();

    // Get total refunds
    const totalRefunds = await db
      .prepare(
        `SELECT COALESCE(SUM(refund_amount), 0) as total FROM cases`
      )
      .first();

    // Get refunds in last 30 days
    const refunds30d = await db
      .prepare(
        `SELECT COALESCE(SUM(refund_amount), 0) as total 
         FROM cases 
         WHERE created_at >= ?`
      )
      .bind(startDate.toISOString())
      .first();

    // Get average refund
    const avgRefund = await db
      .prepare(
        `SELECT COALESCE(AVG(refund_amount), 0) as avg 
         FROM cases 
         WHERE refund_amount IS NOT NULL AND refund_amount > 0`
      )
      .first();

    // Get total sessions
    const totalSessions = await db
      .prepare('SELECT COUNT(*) as count FROM sessions')
      .first();

    // Get average resolution time
    const avgResolution = await db
      .prepare(
        `SELECT AVG(
          (julianday(completed_at) - julianday(created_at)) * 24
         ) as avg_hours
         FROM cases
         WHERE status = 'completed' AND completed_at IS NOT NULL`
      )
      .first();

    // Get SLA compliance (completed within 24 hours)
    const slaCompliance = await db
      .prepare(
        `SELECT 
          COUNT(CASE WHEN (julianday(completed_at) - julianday(created_at)) * 24 <= 24 THEN 1 END) * 100.0 / 
          COUNT(*) as compliance
         FROM cases
         WHERE status = 'completed' AND completed_at IS NOT NULL`
      )
      .first();

    // Get active team members
    const teamMembers = await db
      .prepare(
        `SELECT COUNT(DISTINCT assigned_to) as count 
         FROM cases 
         WHERE assigned_to IS NOT NULL AND updated_at >= ?`
      )
      .bind(startDate.toISOString())
      .first();

    // Get root cause categories
    const rootCauses = await db
      .prepare(
        `SELECT COUNT(DISTINCT root_cause) as count 
         FROM cases 
         WHERE root_cause IS NOT NULL`
      )
      .first();

    // Get flow types from sessions
    const flowTypes = await db
      .prepare(
        `SELECT flow_type as type, COUNT(*) as count 
         FROM sessions 
         WHERE flow_type IS NOT NULL 
         GROUP BY flow_type`
      )
      .all();

    // Get team leaderboard
    const teamLeaderboard = await db
      .prepare(
        `SELECT 
          u.name,
          COUNT(*) as completed,
          ROUND(AVG((julianday(c.completed_at) - julianday(c.created_at)) * 24), 1) as avg_hours
         FROM cases c
         JOIN admin_users u ON c.assigned_to = u.id
         WHERE c.status = 'completed' AND c.completed_at >= ?
         GROUP BY c.assigned_to
         ORDER BY completed DESC
         LIMIT 10`
      )
      .bind(startDate.toISOString())
      .all();

    // Get root cause analysis
    const rootCauseAnalysis = await db
      .prepare(
        `SELECT 
          root_cause as cause,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM cases WHERE root_cause IS NOT NULL), 1) as percentage
         FROM cases
         WHERE root_cause IS NOT NULL AND created_at >= ?
         GROUP BY root_cause
         ORDER BY count DESC
         LIMIT 10`
      )
      .bind(startDate.toISOString())
      .all();

    // Format average resolution time
    const avgHours = (avgResolution?.avg_hours as number) || 0;
    const avgResolutionStr = avgHours < 1
      ? `${Math.round(avgHours * 60)}m`
      : avgHours < 24
      ? `${Math.round(avgHours)}h`
      : `${Math.round(avgHours / 24)}d ${Math.round(avgHours % 24)}h`;

    // Format team leaderboard avg time
    const formattedLeaderboard = teamLeaderboard.results.map((row: any) => ({
      name: row.name,
      completed: row.completed,
      avgTime: row.avg_hours < 1
        ? `${Math.round(row.avg_hours * 60)}m`
        : row.avg_hours < 24
        ? `${Math.round(row.avg_hours)}h`
        : `${Math.round(row.avg_hours / 24)}d`,
    }));

    return jsonResponse({
      success: true,
      data: {
        totalCases: (totalCases?.count as number) || 0,
        pendingCases: casesByStatus.results.find((r: any) => r.status === 'pending')?.count || 0,
        inProgressCases: casesByStatus.results.find((r: any) => r.status === 'in_progress')?.count || 0,
        completedCases: casesByStatus.results.find((r: any) => r.status === 'completed')?.count || 0,
        totalRefunds: (totalRefunds?.total as number) || 0,
        refunds30d: (refunds30d?.total as number) || 0,
        avgRefund: (avgRefund?.avg as number) || 0,
        totalSessions: (totalSessions?.count as number) || 0,
        avgResolutionTime: avgResolutionStr,
        slaCompliance: Math.round((slaCompliance?.compliance as number) || 0),
        teamMembers: (teamMembers?.count as number) || 0,
        rootCauses: (rootCauses?.count as number) || 0,
        casesByType: casesByType.results,
        casesByStatus: casesByStatus.results,
        resolutionTypes: resolutionTypes.results,
        flowTypes: flowTypes.results,
        teamLeaderboard: formattedLeaderboard,
        rootCauseAnalysis: rootCauseAnalysis.results,
        trendData: [], // TODO: Implement trend data
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return errorResponse('Internal server error', 500);
  }
};
