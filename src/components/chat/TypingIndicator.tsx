/**
 * TypingIndicator - Shows when bot is typing (using original CSS)
 */

import type { Persona } from '@shared/constants';

interface TypingIndicatorProps {
  persona: Persona;
}

export function TypingIndicator({ persona }: TypingIndicatorProps) {
  return (
    <div className="message bot">
      {/* Avatar */}
      <img
        src={persona.avatar}
        alt={persona.name}
        className="message-avatar"
      />

      {/* Typing dots */}
      <div className="message-content">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    </div>
  );
}
