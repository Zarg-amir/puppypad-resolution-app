/**
 * Analytics Service - Event tracking and session management
 */

import { api } from './api';

class AnalyticsService {
  private sessionId: string | null = null;
  private queue: Array<{
    eventType: string;
    eventName: string;
    eventData?: Record<string, unknown>;
  }> = [];
  private isProcessing = false;

  setSession(sessionId: string) {
    this.sessionId = sessionId;
    this.processQueue();
  }

  async startSession(sessionId: string) {
    this.sessionId = sessionId;
    try {
      await api.createSession(sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    this.processQueue();
  }

  track(eventType: string, eventName: string, eventData?: Record<string, unknown>) {
    const event = { eventType, eventName, eventData };

    if (!this.sessionId) {
      this.queue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  private async sendEvent(event: {
    eventType: string;
    eventName: string;
    eventData?: Record<string, unknown>;
  }) {
    if (!this.sessionId) return;

    try {
      await api.logEvent(this.sessionId, event.eventType, event.eventName, event.eventData);
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  private async processQueue() {
    if (this.isProcessing || !this.sessionId || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        await this.sendEvent(event);
      }
    }

    this.isProcessing = false;
  }

  // Convenience methods for common events
  pageView(pageName: string, metadata?: Record<string, unknown>) {
    this.track('navigation', 'page_view', { page: pageName, ...metadata });
  }

  stepCompleted(stepName: string, metadata?: Record<string, unknown>) {
    this.track('flow', 'step_completed', { step: stepName, ...metadata });
  }

  userAction(action: string, metadata?: Record<string, unknown>) {
    this.track('interaction', action, metadata);
  }

  error(errorType: string, errorMessage: string, metadata?: Record<string, unknown>) {
    this.track('error', errorType, { message: errorMessage, ...metadata });
  }

  flowStart(flowType: string) {
    this.track('flow', 'flow_started', { flowType });
  }

  flowComplete(flowType: string, resolution?: string) {
    this.track('flow', 'flow_completed', { flowType, resolution });
  }

  caseCreated(caseId: string, caseType: string) {
    this.track('case', 'case_created', { caseId, caseType });
  }
}

export const analytics = new AnalyticsService();
