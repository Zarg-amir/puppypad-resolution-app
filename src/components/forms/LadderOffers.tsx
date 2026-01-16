/**
 * LadderOffers - Escalating offer cards
 */

import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { api } from '../../services/api';
import { analytics } from '../../services/analytics';
import { POLICY_CONFIG } from '@shared/constants';
import { formatDollarAmount } from '../../utils/formatters';

export function LadderOffers() {
  const {
    sessionId,
    ladderStep,
    ladderType,
    selectedOrder,
    selectedItems,
    customerData,
    intent,
    setLadderStep,
    setRefund,
    setCaseId,
    setStep,
    addMessage,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);

  if (!ladderType || !selectedOrder) return null;

  const ladder = getLadder(ladderType);
  const currentOffer = ladder[ladderStep];
  const isLastStep = ladderStep >= ladder.length - 1;

  // Calculate refund amount
  const orderTotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const refundAmount = orderTotal * (currentOffer.percentage / 100);

  const handleAccept = async () => {
    setIsLoading(true);
    setRefund(refundAmount, currentOffer.percentage);

    analytics.stepCompleted('offer_accepted', {
      ladderStep,
      percentage: currentOffer.percentage,
      amount: refundAmount,
    });

    addMessage({
      type: 'user',
      content: '✅ Yes, I accept this offer',
    });

    try {
      const response = await api.createCase({
        sessionId,
        caseType: ladderType,
        customerEmail: customerData.email,
        customerName: customerData.firstName || 'Customer',
        orderId: selectedOrder.id,
        orderNumber: selectedOrder.orderNumber,
        orderTotal: selectedOrder.totalPrice,
        selectedItems: selectedItems.map((i) => i.id),
        intent: intent || undefined,
        resolutionType: getResolutionType(ladderType, currentOffer),
        refundAmount,
        refundPercentage: currentOffer.percentage,
      });

      if (response.success && response.caseId) {
        setCaseId(response.caseId);
        addMessage({
          type: 'bot',
          persona: 'amy',
          content: `Wonderful! I've processed your ${currentOffer.percentage}% refund of ${formatDollarAmount(refundAmount)}. Your case ID is ${response.caseId}. You'll receive a confirmation email shortly.`,
        });
        analytics.caseCreated(response.caseId, ladderType);
        setStep('complete');
      } else {
        throw new Error(response.error || 'Failed to create case');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      addMessage({
        type: 'bot',
        persona: 'amy',
        content: `I'm sorry, something went wrong: ${message}. Please try again.`,
      });
      analytics.error('case_creation_failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    if (isLastStep) {
      // Escalate to human
      addMessage({
        type: 'user',
        content: "No, I'd like to speak to someone",
      });
      addMessage({
        type: 'bot',
        persona: 'sarah',
        content: "I understand. I'm Sarah, the Customer Experience Lead. Let me personally look into this for you. I'll create a case and our team will follow up within 24 hours.",
      });
      analytics.stepCompleted('escalated', { ladderStep });
      setStep('confirmation');
    } else {
      // Move to next ladder step
      const nextStep = ladderStep + 1;
      const nextOffer = ladder[nextStep];
      
      addMessage({
        type: 'user',
        content: "I'd like a better offer",
      });

      addMessage({
        type: 'bot',
        persona: 'amy',
        content: `I understand. Let me do better for you. How about ${nextOffer.percentage}% instead? That would be ${formatDollarAmount(orderTotal * (nextOffer.percentage / 100))}.`,
      });

      setLadderStep(nextStep);
      analytics.stepCompleted('offer_declined', {
        ladderStep,
        nextStep,
      });
    }
  };

  return (
    <div className="px-4 pb-4 animate-slide-up">
      {/* Offer Card */}
      <div className="glass rounded-2xl overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-brand-navy to-brand-navy-light p-6 text-white text-center">
          <p className="text-sm opacity-80 mb-2">Your Offer</p>
          <p className="text-4xl font-bold font-display mb-1">
            {currentOffer.percentage}% Off
          </p>
          <p className="text-xl font-semibold">
            {formatDollarAmount(refundAmount)}
          </p>
          {currentOffer.includesReship && (
            <p className="text-sm opacity-80 mt-2">+ Free Replacement</p>
          )}
        </div>
        <div className="p-4 text-center text-sm text-gray-600">
          {getOfferDescription(ladderType, currentOffer)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white"></span>
              Processing...
            </span>
          ) : (
            '✅ Accept This Offer'
          )}
        </button>

        <button
          onClick={handleDecline}
          disabled={isLoading}
          className="btn btn-secondary w-full"
        >
          {isLastStep ? "I'd like to speak to someone" : "I'd like a better offer"}
        </button>
      </div>

      {/* Ladder progress */}
      <div className="mt-4 flex justify-center gap-2">
        {ladder.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index <= ladderStep ? 'bg-brand-navy' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function getLadder(type: 'refund' | 'shipping' | 'subscription') {
  const config = POLICY_CONFIG;

  switch (type) {
    case 'refund':
      return config.REFUND_LADDER.map((p) => ({ percentage: p, includesReship: false }));
    case 'shipping':
      return config.SHIPPING_LADDER.map((s) => ({
        percentage: s.refund,
        includesReship: s.reship,
      }));
    case 'subscription':
      return config.SUBSCRIPTION_LADDER.map((p) => ({ percentage: p, includesReship: false }));
    default:
      return [{ percentage: 20, includesReship: false }];
  }
}

function getResolutionType(
  ladderType: string,
  offer: { percentage: number; includesReship: boolean }
): string {
  if (offer.includesReship) {
    return 'partial_refund_reship';
  }
  if (offer.percentage >= 100) {
    return 'full_refund';
  }
  if (ladderType === 'subscription') {
    return 'subscription_discount';
  }
  return 'partial_refund';
}

function getOfferDescription(
  ladderType: string,
  offer: { percentage: number; includesReship: boolean }
): string {
  if (offer.includesReship) {
    return `We'll refund ${offer.percentage}% of your order and ship a replacement at no cost.`;
  }
  if (ladderType === 'subscription') {
    return `${offer.percentage}% discount on your next subscription order.`;
  }
  return `${offer.percentage}% refund will be credited to your original payment method.`;
}
