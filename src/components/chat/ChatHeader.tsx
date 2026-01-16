/**
 * ChatHeader - Chat header with persona info
 */

import type { Persona } from '@shared/constants';

interface ChatHeaderProps {
  persona: Persona;
  onRestart: () => void;
}

export function ChatHeader({ persona, onRestart }: ChatHeaderProps) {
  return (
    <header className="glass border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      {/* Persona Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={persona.avatar}
            alt={persona.name}
            className="w-10 h-10 rounded-full object-cover"
            style={{ borderColor: persona.color, borderWidth: 2 }}
          />
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: '#10b981' }}
          ></span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">{persona.name}</h2>
          <p className="text-xs text-gray-500">{persona.title}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRestart}
          className="btn btn-ghost text-sm px-3 py-1.5"
          title="Start again"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Start Again</span>
        </button>
      </div>
    </header>
  );
}
