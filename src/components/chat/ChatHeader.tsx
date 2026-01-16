/**
 * ChatHeader - Chat header with persona info (using original CSS)
 */

import type { Persona } from '@shared/constants';

interface ChatHeaderProps {
  persona: Persona;
  onRestart: () => void;
}

export function ChatHeader({ persona, onRestart }: ChatHeaderProps) {
  return (
    <header className="header">
      {/* Persona Info */}
      <div className="header-left">
        <div className="persona-indicator">
          <div className="avatar-ring" data-persona={persona.name.toLowerCase()}>
            <img
              src={persona.avatar}
              alt={persona.name}
              className="avatar"
            />
          </div>
          <div className="persona-info">
            <h2 className="persona-name">{persona.name}</h2>
            <div className="persona-status">
              <span className="status-indicator"></span>
              <span>{persona.title}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <button onClick={onRestart} className="restart-btn" title="Start again">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Start Again</span>
      </button>
    </header>
  );
}
