/**
 * Case Types - Shared between frontend and backend
 */

export type CaseType = 'refund' | 'shipping' | 'subscription' | 'return' | 'manual';

export type CaseStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ResolutionType =
  | 'full_refund'
  | 'partial_refund'
  | 'reship'
  | 'partial_refund_reship'
  | 'discount'
  | 'return_refund'
  | 'subscription_discount'
  | 'subscription_cancel'
  | 'escalated'
  | 'resolved_in_app'
  | 'other';

export interface CaseData {
  caseId: string;
  sessionId: string;
  caseType: CaseType;
  status: CaseStatus;
  resolutionType?: ResolutionType;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderId?: string;
  orderNumber?: string;
  orderTotal?: number;
  refundAmount?: number;
  refundPercentage?: number;
  trackingNumber?: string;
  trackingStatus?: string;
  carrierName?: string;
  assignedTo?: number;
  assignedToName?: string;
  dueDate?: string;
  rootCause?: string;
  notes?: string;
  clickupTaskId?: string;
  richpanelTicketId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CaseComment {
  id: number;
  caseId: string;
  userId: number;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface CaseListItem {
  caseId: string;
  caseType: CaseType;
  status: CaseStatus;
  customerName: string;
  customerEmail: string;
  orderNumber?: string;
  resolutionType?: ResolutionType;
  assignedToName?: string;
  dueDate?: string;
  createdAt: string;
}

export interface CasesListResponse {
  success: boolean;
  cases: CaseListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CaseDetailResponse {
  success: boolean;
  case: CaseData;
  comments: CaseComment[];
  timeline: CaseTimelineEvent[];
}

export interface CaseTimelineEvent {
  id: number;
  caseId: string;
  eventType: string;
  description: string;
  userId?: number;
  userName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
