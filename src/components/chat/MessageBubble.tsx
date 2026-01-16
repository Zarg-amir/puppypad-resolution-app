/**
 * MessageBubble - Individual chat message (using original CSS)
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
    <div className={`message ${isBot ? 'bot' : 'user'}`}>
      {/* Bot Avatar */}
      {isBot && persona && (
        <img
          src={persona.avatar}
          alt={persona.name}
          className="message-avatar"
        />
      )}

      {/* Message Content */}
      <div className="message-content">
        {/* Sender Info */}
        {isBot && persona && (
          <div className="message-sender">
            <span className="sender-name">{persona.name}</span>
            <span className="sender-role">{persona.title}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className="message-bubble">
          {message.content}
        </div>
      </div>
    </div>
  );
}
