/**
 * ChatContainer - Main chat interface
 */

import { useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { PERSONAS } from '@shared/constants';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { CustomerIdentificationForm } from '../forms/CustomerIdentificationForm';
import { OrderSelection } from '../forms/OrderSelection';
import { ProductSelection } from '../forms/ProductSelection';
import { IntentSelection } from '../forms/IntentSelection';
import { LadderOffers } from '../forms/LadderOffers';
import { CaseConfirmation } from '../forms/CaseConfirmation';

interface ChatContainerProps {
  onRestart: () => void;
}

export function ChatContainer({ onRestart }: ChatContainerProps) {
  const {
    messages,
    isTyping,
    currentStep,
    currentPersona,
  } = useChatStore();

  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const persona = PERSONAS[currentPersona];

  return (
    <div className="chat-container active">
      {/* Header */}
      <ChatHeader persona={persona} onRestart={onRestart} />

      {/* Chat Area */}
      <div ref={chatAreaRef} className="chat-area">
        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator persona={persona} />}

        {/* Interactive Content based on step */}
        {!isTyping && (
          <div className="interactive-content">
            {renderStepContent(currentStep)}
          </div>
        )}
      </div>
    </div>
  );
}

function renderStepContent(step: string) {
  switch (step) {
    case 'identify':
      return <CustomerIdentificationForm />;
    case 'orders':
      return <OrderSelection />;
    case 'products':
      return <ProductSelection />;
    case 'intent':
      return <IntentSelection />;
    case 'ladder':
      return <LadderOffers />;
    case 'confirmation':
    case 'complete':
      return <CaseConfirmation />;
    default:
      return null;
  }
}
