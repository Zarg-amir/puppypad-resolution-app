/**
 * API Service - Centralized API client
 */

import { useAuthStore } from '../stores/authStore';
import type {
  ApiResponse,
  OrderLookupRequest,
  OrderLookupResponse,
  TrackingLookupRequest,
  TrackingLookupResponse,
  CreateCaseRequest,
  CreateCaseResponse,
  CasesListResponse,
  CaseDetailResponse,
  HubStats,
  LoginResponse,
} from '@shared/types';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async verifyAuth(): Promise<ApiResponse> {
    return this.request('/auth/verify');
  }

  // Orders
  async lookupOrders(data: OrderLookupRequest): Promise<OrderLookupResponse> {
    return this.request('/orders/lookup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tracking
  async lookupTracking(data: TrackingLookupRequest): Promise<TrackingLookupResponse> {
    return this.request('/tracking/lookup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Cases
  async createCase(data: CreateCaseRequest): Promise<CreateCaseResponse> {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCases(params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    assignee?: string;
    search?: string;
    sortBy?: string;
    dateRange?: string;
  }): Promise<CasesListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== 'all') {
        searchParams.append(key, String(value));
      }
    });
    return this.request(`/hub/cases?${searchParams.toString()}`);
  }

  async getCase(caseId: string): Promise<CaseDetailResponse> {
    return this.request(`/cases/${caseId}`);
  }

  async updateCase(
    caseId: string,
    data: Partial<{
      status: string;
      assignedTo: number;
      rootCause: string;
      notes: string;
    }>
  ): Promise<ApiResponse> {
    return this.request(`/cases/${caseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addCaseComment(
    caseId: string,
    content: string,
    isInternal: boolean = true
  ): Promise<ApiResponse> {
    return this.request(`/cases/${caseId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, isInternal }),
    });
  }

  // Hub Stats
  async getHubStats(): Promise<{ success: boolean } & HubStats> {
    return this.request('/hub/stats');
  }

  // Sessions
  async createSession(sessionId: string): Promise<ApiResponse> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async logEvent(
    sessionId: string,
    eventType: string,
    eventName: string,
    eventData?: Record<string, unknown>
  ): Promise<ApiResponse> {
    return this.request('/sessions/events', {
      method: 'POST',
      body: JSON.stringify({ sessionId, eventType, eventName, eventData }),
    });
  }

  // Users (Admin)
  async getUsers(): Promise<ApiResponse> {
    return this.request('/hub/users');
  }

  async createUser(data: {
    username: string;
    name: string;
    password: string;
    role: string;
  }): Promise<ApiResponse> {
    return this.request('/hub/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: number): Promise<ApiResponse> {
    return this.request(`/hub/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics(dateRange?: string): Promise<ApiResponse> {
    const params = dateRange ? `?range=${dateRange}` : '';
    return this.request(`/hub/analytics${params}`);
  }
}

export const api = new ApiClient();
