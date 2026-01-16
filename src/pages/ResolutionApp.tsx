/**
 * ResolutionApp - Customer-facing chat application
 */

import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { analytics } from '../services/analytics';
import { ChatContainer } from '../components/chat/ChatContainer';
import { HomeScreen } from '../components/chat/HomeScreen';

export function ResolutionApp() {
  const { sessionId, currentStep, reset } = useChatStore();

  useEffect(() => {
    // Initialize analytics session
    analytics.startSession(sessionId);
    analytics.pageView('resolution_app');

    return () => {
      // Cleanup on unmount
    };
  }, [sessionId]);

  const handleStartFlow = (flowType: 'order' | 'shipping' | 'subscription') => {
    useChatStore.getState().setFlowType(flowType);
    useChatStore.getState().setStep('identify');
    analytics.flowStart(flowType);
  };

  const handleRestart = () => {
    reset();
    analytics.track('interaction', 'restart_clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-blue-50/50">
      {currentStep === 'welcome' ? (
        <HomeScreen onStartFlow={handleStartFlow} />
      ) : (
        <ChatContainer onRestart={handleRestart} />
      )}
    </div>
  );
}
