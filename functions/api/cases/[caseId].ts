/**
 * /api/cases/[caseId] - Single case operations
 * GET: Get case details
 * PUT: Update case
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse, verifyToken } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async (context) => {
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

    const db = context.env.ANALYTICS_DB;

    // Get case
    const caseResult = await db
      .prepare('SELECT * FROM cases WHERE case_id = ?')
      .bind(caseId)
      .first();

    if (!caseResult) {
      return errorResponse('Case not found', 404);
    }

    // Get comments
    const commentsResult = await db
      .prepare(
        `SELECT c.*, u.name as user_name 
         FROM case_comments c 
         LEFT JOIN admin_users u ON c.user_id = u.id 
         WHERE c.case_id = ? 
         ORDER BY c.created_at ASC`
      )
      .bind(caseId)
      .all();

    // Get timeline events
    const timelineResult = await db
      .prepare(
        `SELECT * FROM case_timeline 
         WHERE case_id = ? 
         ORDER BY created_at DESC 
         LIMIT 50`
      )
      .bind(caseId)
      .all();

    const caseData = {
      caseId: caseResult.case_id,
      sessionId: caseResult.session_id,
      caseType: caseResult.case_type,
      status: caseResult.status,
      resolutionType: caseResult.resolution_type,
      customerId: caseResult.customer_id,
      customerEmail: caseResult.customer_email,
      customerName: caseResult.customer_name,
      customerPhone: caseResult.customer_phone,
      orderId: caseResult.order_id,
      orderNumber: caseResult.order_number,
      orderTotal: caseResult.order_total,
      refundAmount: caseResult.refund_amount,
      refundPercentage: caseResult.refund_percentage,
      trackingNumber: caseResult.tracking_number,
      trackingStatus: caseResult.tracking_status,
      carrierName: caseResult.carrier_name,
      assignedTo: caseResult.assigned_to,
      dueDate: caseResult.due_date,
      rootCause: caseResult.root_cause,
      notes: caseResult.notes,
      clickupTaskId: caseResult.clickup_task_id,
      richpanelTicketId: caseResult.richpanel_ticket_id,
      createdAt: caseResult.created_at,
      updatedAt: caseResult.updated_at,
      completedAt: caseResult.completed_at,
    };

    const comments = commentsResult.results.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      userId: row.user_id,
      userName: row.user_name || 'System',
      content: row.content,
      isInternal: row.is_internal === 1,
      createdAt: row.created_at,
    }));

    const timeline = timelineResult.results.map((row: any) => ({
      id: row.id,
      caseId: row.case_id,
      eventType: row.event_type,
      description: row.description,
      userId: row.user_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at,
    }));

    return jsonResponse({
      success: true,
      case: caseData,
      comments,
      timeline,
    });
  } catch (error) {
    console.error('Get case error:', error);
    return errorResponse('Internal server error', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
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
    const { status, assignedTo, rootCause, notes } = body;

    const db = context.env.ANALYTICS_DB;
    const now = new Date().toISOString();

    // Build update query
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'completed') {
        updates.push('completed_at = ?');
        params.push(now);
      }
    }

    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assignedTo);
    }

    if (rootCause !== undefined) {
      updates.push('root_cause = ?');
      params.push(rootCause);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    params.push(caseId);

    await db
      .prepare(`UPDATE cases SET ${updates.join(', ')} WHERE case_id = ?`)
      .bind(...params)
      .run();

    // Log timeline event
    if (status) {
      await db
        .prepare(
          `INSERT INTO case_timeline (case_id, event_type, description, user_id, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(caseId, 'status_change', `Status changed to ${status}`, user.userId, now)
        .run();
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Update case error:', error);
    return errorResponse('Internal server error', 500);
  }
};
