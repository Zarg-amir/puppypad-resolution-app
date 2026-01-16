/**
 * MessageBubble - Individual chat message
 */

import type { Message } from '../../stores/chatStore';
import { PERSONAS } from '@shared/constants';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isBot = message.type === 'bot';
  const persona = message.persona ? PERSONAS[message.persona] : null;

  return (
    <div
      className={`flex gap-3 animate-slide-up ${
        isBot ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Bot Avatar */}
      {isBot && persona && (
        <img
          src={persona.avatar}
          alt={persona.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
        />
      )}

      {/* Message Content */}
      <div
        className={`message-bubble ${isBot ? 'bot' : 'user'}`}
        style={
          !isBot
            ? { backgroundColor: '#1a365d' }
            : undefined
        }
      >
        {/* Bot name */}
        {isBot && persona && (
          <p className="text-xs font-medium text-gray-500 mb-1">
            {persona.name}
          </p>
        )}

        {/* Message text */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}
