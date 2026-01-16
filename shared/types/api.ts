/**
 * API Types - Shared request/response types
 */

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: number;
    username: string;
    name: string;
    role: 'admin' | 'user';
  };
  error?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'user';
}

// Sessions
export interface Session {
  sessionId: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  flowType?: string;
  startedAt: string;
  endedAt?: string;
  completed: boolean;
  caseCreated: boolean;
  caseId?: string;
}

export interface SessionEvent {
  id: number;
  sessionId: string;
  eventType: string;
  eventName: string;
  eventData?: Record<string, unknown>;
  createdAt: string;
}

// Hub Stats
export interface HubStats {
  pending: number;
  inProgress: number;
  completed: number;
  completedToday: number;
  avgTime: string;
  all: number;
  shipping: number;
  refund: number;
  subscription: number;
  manual: number;
}

// Case Creation
export interface CreateCaseRequest {
  sessionId: string;
  caseType: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderId?: string;
  orderNumber?: string;
  orderTotal?: number;
  selectedItems?: string[];
  intent?: string;
  resolutionType?: string;
  refundAmount?: number;
  refundPercentage?: number;
  trackingNumber?: string;
  trackingStatus?: string;
  carrierName?: string;
  notes?: string;
}

export interface CreateCaseResponse {
  success: boolean;
  caseId?: string;
  clickupTaskId?: string;
  richpanelTicketId?: string;
  error?: string;
}

// Tracking
export interface TrackingLookupRequest {
  trackingNumber: string;
  carrier?: string;
}

export interface TrackingLookupResponse {
  success: boolean;
  tracking?: {
    trackingNumber: string;
    carrier: string;
    status: string;
    statusDescription: string;
    estimatedDelivery?: string;
    lastUpdate?: string;
    events: Array<{
      timestamp: string;
      status: string;
      description: string;
      location?: string;
    }>;
  };
  error?: string;
}

// Analytics
export interface AnalyticsData {
  totalCases: number;
  pendingCases: number;
  inProgressCases: number;
  completedCases: number;
  totalRefunds: number;
  refunds30d: number;
  avgRefund: number;
  totalSessions: number;
  avgResolutionTime: string;
  slaCompliance: number;
  teamMembers: number;
  rootCauses: number;
  casesByType: Array<{ type: string; count: number }>;
  casesByStatus: Array<{ status: string; count: number }>;
  resolutionTypes: Array<{ type: string; count: number }>;
  flowTypes: Array<{ type: string; count: number }>;
  teamLeaderboard: Array<{ name: string; completed: number; avgTime: string }>;
  rootCauseAnalysis: Array<{ cause: string; count: number; percentage: number }>;
  trendData: Array<{ date: string; cases: number; sessions: number }>;
}
