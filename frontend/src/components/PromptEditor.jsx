import React from 'react';
import { useAppContext } from '../context/AppContext';
import './PromptEditor.css';

const MAX_LENGTH = 4000;

/**
 * Text area for the user's original prompt + the "Improve My Prompt" button.
 *
 * @param {{ onImprove: () => void, isLoading: boolean }} props
 */
export default function PromptEditor({ onImprove, isLoading }) {
  const { originalPrompt, setOriginalPrompt } = useAppContext();

  const charsRemaining = MAX_LENGTH - originalPrompt.length;
  const isOverLimit = charsRemaining < 0;
  const canSubmit = originalPrompt.trim().length > 0 && !isOverLimit && !isLoading;

  return (
    <div className="prompt-editor">
      <label htmlFor="prompt-input" className="prompt-label">
        Your prompt
      </label>

      <textarea
        id="prompt-input"
        className={`prompt-textarea ${isOverLimit ? 'over-limit' : ''}`}
        value={originalPrompt}
        onChange={(e) => setOriginalPrompt(e.target.value)}
        placeholder="Type your message or question here..."
        rows={6}
        maxLength={MAX_LENGTH + 100} // allow slight overflow so counter is visible
        aria-describedby="char-count"
        disabled={isLoading}
      />

      <div className="prompt-footer">
        <span
          id="char-count"
          className={`char-count ${isOverLimit ? 'over-limit' : ''}`}
          aria-live="polite"
        >
          {isOverLimit ? `${Math.abs(charsRemaining)} over limit` : `${charsRemaining} remaining`}
        </span>

        <button
          className="improve-button"
          onClick={onImprove}
          disabled={!canSubmit}
          aria-busy={isLoading}
        >
          {isLoading ? 'Rewriting...' : 'Improve My Prompt'}
        </button>
      </div>
    </div>
  );
}
