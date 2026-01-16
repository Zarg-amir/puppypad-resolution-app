/**
 * TypingIndicator - Shows when bot is typing
 */

import type { Persona } from '@shared/constants';

interface TypingIndicatorProps {
  persona: Persona;
}

export function TypingIndicator({ persona }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 justify-start animate-fade-in">
      {/* Avatar */}
      <img
        src={persona.avatar}
        alt={persona.name}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
      />

      {/* Typing dots */}
      <div className="message-bubble bot">
        <div className="flex items-center gap-1 py-1">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot"></span>
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot"></span>
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing-dot"></span>
        </div>
      </div>
    </div>
  );
}
