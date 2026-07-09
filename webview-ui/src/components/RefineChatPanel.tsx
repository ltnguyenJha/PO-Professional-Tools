import { useEffect, useRef, useState } from 'react';
import { QUICK_REFINEMENT_PILLS } from '../constants/refinementPills';

export interface RefineChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface RefineChatPanelProps {
  busy: boolean;
  onRefine: (instruction: string) => void;
  /** Shown when a refine request completes (busy → idle). */
  completionMessage?: string;
  className?: string;
}

const DEFAULT_AI_REPLY =
  "I've updated the draft based on your feedback. Review the suggestion below and apply the fields you want.";

export function RefineChatPanel({
  busy,
  onRefine,
  completionMessage = DEFAULT_AI_REPLY,
  className = ''
}: RefineChatPanelProps): JSX.Element {
  const [history, setHistory] = useState<RefineChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const awaitingReply = useRef(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [history, busy]);

  useEffect(() => {
    if (awaitingReply.current && !busy) {
      setHistory((prev) => [...prev, { role: 'ai', text: completionMessage }]);
      awaitingReply.current = false;
    }
  }, [busy, completionMessage]);

  const sendInstruction = (instruction: string): void => {
    const text = instruction.trim();
    if (!text || busy) {
      return;
    }
    setHistory((prev) => [...prev, { role: 'user', text }]);
    setDraft('');
    awaitingReply.current = true;
    onRefine(text);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    sendInstruction(draft);
  };

  return (
    <div
      className={`refine-chat-panel ai-section${busy ? ' ai-thinking' : ''} ${className}`.trim()}
      aria-busy={busy}
    >
      {history.length > 0 && (
        <div
          className="refine-chat-history"
          role="log"
          aria-label="Refinement conversation history"
          aria-live="off"
        >
          {history.map((msg, index) => (
            <div
              key={`${msg.role}-${index}-${msg.text.slice(0, 24)}`}
              className={`refine-chat-bubble refine-chat-bubble--${msg.role}`}
            >
              {msg.text}
            </div>
          ))}
          {busy && (
            <div className="refine-chat-bubble refine-chat-bubble--ai refine-chat-typing" aria-hidden="true">
              <span className="refine-chat-dot" />
              <span className="refine-chat-dot" />
              <span className="refine-chat-dot" />
              <span className="sr-only">AI is refining your draft</span>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      )}

      <div className="refine-chat-pills" role="group" aria-label="Quick refinement suggestions">
        {QUICK_REFINEMENT_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className="refine-pill focus-tw-ring"
            disabled={busy}
            onClick={() => sendInstruction(pill.instruction)}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <form className="refine-chat-input-row" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="refine-chat-input">
          Tell AI how to improve this PBI
        </label>
        <textarea
          id="refine-chat-input"
          className="refine-chat-input focus-tw-ring"
          rows={2}
          value={draft}
          disabled={busy}
          placeholder="Tell me how to improve this PBI… (e.g. 'Make it more technical', 'Add accessibility criteria')"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendInstruction(draft);
            }
          }}
        />
        <button
          type="submit"
          className="btn-energy btn-energy-ai focus-tw-ring min-h-touch"
          disabled={busy || !draft.trim()}
        >
          Send to AI ✨
        </button>
      </form>
    </div>
  );
}
