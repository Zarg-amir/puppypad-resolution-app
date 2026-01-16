/**
 * /api/cases - Case management
 * GET: List cases
 * POST: Create a new case
 */

import type { Env } from '../../_middleware';
import { jsonResponse, errorResponse, verifyToken } from '../../_middleware';

// Generate case ID
function generateCaseId(type: string): string {
  const prefixes: Record<string, string> = {
    refund: 'REF',
    shipping: 'SHP',
    subscription: 'SUB',
    return: 'RET',
    manual: 'MAN',
  };
  const prefix = prefixes[type] || 'CAS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

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
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy') || 'created_desc';
    const offset = (page - 1) * limit;

    const db = context.env.ANALYTICS_DB;

    // Build query
    let whereClause = '1=1';
    const params: any[] = [];

    if (type && type !== 'all') {
      whereClause += ' AND case_type = ?';
      params.push(type);
    }

    if (status && status !== 'all') {
      if (status === 'overdue') {
        whereClause += ' AND status = ? AND due_date < datetime("now")';
        params.push('pending');
      } else {
        whereClause += ' AND status = ?';
        params.push(status);
      }
    }

    if (search) {
      whereClause += ' AND (customer_email LIKE ? OR customer_name LIKE ? OR case_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sort
    let orderClause = 'created_at DESC';
    switch (sortBy) {
      case 'created_asc':
        orderClause = 'created_at ASC';
        break;
      case 'due_asc':
        orderClause = 'due_date ASC NULLS LAST';
        break;
      case 'due_desc':
        orderClause = 'due_date DESC NULLS LAST';
        break;
      case 'customer_asc':
        orderClause = 'customer_name ASC';
        break;
      case 'customer_desc':
        orderClause = 'customer_name DESC';
        break;
    }

    // Get total count
    const countResult = await db
      .prepare(`SELECT COUNT(*) as count FROM cases WHERE ${whereClause}`)
      .bind(...params)
      .first();
    const total = (countResult?.count as number) || 0;

    // Get cases
    const casesResult = await db
      .prepare(
        `SELECT 
          case_id, case_type, status, customer_name, customer_email,
          order_number, resolution_type, assigned_to, due_date, created_at
        FROM cases 
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all();

    const cases = casesResult.results.map((row: any) => ({
      caseId: row.case_id,
      caseType: row.case_type,
      status: row.status,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      orderNumber: row.order_number,
      resolutionType: row.resolution_type,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      createdAt: row.created_at,
    }));

    return jsonResponse({
      success: true,
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get cases error:', error);
    return errorResponse('Internal server error', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    const {
      sessionId,
      caseType,
      customerEmail,
      customerName,
      customerPhone,
      orderId,
      orderNumber,
      orderTotal,
      selectedItems,
      intent,
      resolutionType,
      refundAmount,
      refundPercentage,
      trackingNumber,
      trackingStatus,
      carrierName,
      notes,
    } = body;

    if (!sessionId || !caseType || !customerEmail) {
      return errorResponse('Missing required fields', 400);
    }

    const db = context.env.ANALYTICS_DB;
    const caseId = generateCaseId(caseType);
    const now = new Date().toISOString();

    // Create case
    await db
      .prepare(
        `INSERT INTO cases (
          case_id, session_id, case_type, status, customer_email, customer_name,
          customer_phone, order_id, order_number, order_total, resolution_type,
          refund_amount, refund_percentage, tracking_number, tracking_status,
          carrier_name, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        caseId,
        sessionId,
        caseType,
        'pending',
        customerEmail,
        customerName,
        customerPhone || null,
        orderId || null,
        orderNumber || null,
        orderTotal || null,
        resolutionType || null,
        refundAmount || null,
        refundPercentage || null,
        trackingNumber || null,
        trackingStatus || null,
        carrierName || null,
        notes || null,
        now,
        now
      )
      .run();

    // Update session with case ID
    await db
      .prepare('UPDATE sessions SET case_id = ?, case_created = 1 WHERE session_id = ?')
      .bind(caseId, sessionId)
      .run();

    // TODO: Create ClickUp task and Richpanel ticket

    return jsonResponse({
      success: true,
      caseId,
    });
  } catch (error) {
    console.error('Create case error:', error);
    return errorResponse('Internal server error', 500);
  }
};
