/**
 * IntentSelection - Issue type selection
 */

import { useChatStore } from '../../stores/chatStore';
import { analytics } from '../../services/analytics';
import { POLICY_CONFIG } from '@shared/constants';

const INTENTS = [
  {
    id: 'refund',
    label: "I'd like a refund",
    description: 'Get a full or partial refund',
    icon: '💰',
    ladderType: 'refund' as const,
  },
  {
    id: 'wrong_item',
    label: 'I received the wrong item',
    description: "We'll make it right",
    icon: '📦',
    ladderType: 'shipping' as const,
  },
  {
    id: 'damaged',
    label: 'Item arrived damaged',
    description: 'Report damage for replacement',
    icon: '💔',
    ladderType: 'shipping' as const,
  },
  {
    id: 'missing',
    label: 'Item is missing from order',
    description: 'Report missing items',
    icon: '❓',
    ladderType: 'shipping' as const,
  },
  {
    id: 'not_working',
    label: "It's not working as expected",
    description: 'Get help with your product',
    icon: '🔧',
    ladderType: 'refund' as const,
  },
  {
    id: 'subscription',
    label: 'I want to change my subscription',
    description: 'Pause, modify, or cancel',
    icon: '🔄',
    ladderType: 'subscription' as const,
  },
];

export function IntentSelection() {
  const { setIntent, setLadderType, setLadderStep, setStep, addMessage, flowType } = useChatStore();

  // Filter intents based on flow type
  const availableIntents = INTENTS.filter((intent) => {
    if (flowType === 'subscription') {
      return intent.id === 'subscription';
    }
    if (flowType === 'shipping') {
      return ['wrong_item', 'damaged', 'missing'].includes(intent.id);
    }
    return true;
  });

  const handleSelectIntent = (intent: typeof INTENTS[0]) => {
    setIntent(intent.id);
    setLadderType(intent.ladderType);
    setLadderStep(0);

    analytics.stepCompleted('intent_selection', {
      intent: intent.id,
      ladderType: intent.ladderType,
    });

    addMessage({
      type: 'user',
      content: intent.label,
    });

    // Start the ladder
    const ladderMessage = getLadderMessage(intent.ladderType);
    addMessage({
      type: 'bot',
      persona: 'amy',
      content: ladderMessage,
    });

    setStep('ladder');
  };

  return (
    <div className="px-4 pb-4 space-y-2 animate-slide-up">
      {availableIntents.map((intent, index) => (
        <button
          key={intent.id}
          onClick={() => handleSelectIntent(intent)}
          className="w-full glass rounded-xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">{intent.icon}</span>
            <div>
              <p className="font-medium text-gray-900 group-hover:text-brand-navy transition-colors">
                {intent.label}
              </p>
              <p className="text-sm text-gray-500">{intent.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function getLadderMessage(ladderType: 'refund' | 'shipping' | 'subscription'): string {
  const ladder = POLICY_CONFIG;

  switch (ladderType) {
    case 'refund':
      return `I understand that can be frustrating. I'd like to offer you a ${ladder.REFUND_LADDER[0]}% refund to make things right. Would that work for you?`;
    case 'shipping':
      return `I'm sorry to hear about this issue. I'd like to offer you a ${ladder.SHIPPING_LADDER[0].refund}% refund plus we'll reship the correct item. Does that sound good?`;
    case 'subscription':
      return `I'd love to help you keep your subscription! How about ${ladder.SUBSCRIPTION_LADDER[0]}% off your next order?`;
    default:
      return "Let me see what I can do to help you.";
  }
}
