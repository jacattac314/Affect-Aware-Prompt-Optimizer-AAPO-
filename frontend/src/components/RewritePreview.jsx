import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import './RewritePreview.css';

/**
 * Displays the rewritten prompt with Accept / Copy / Edit actions.
 *
 * @param {{ rewrittenPrompt: string, isLoading: boolean }} props
 */
export default function RewritePreview({ rewrittenPrompt, isLoading }) {
  const { setOriginalPrompt, setRewrittenPrompt } = useAppContext();

  const handleAccept = useCallback(() => {
    setOriginalPrompt(rewrittenPrompt);
    setRewrittenPrompt('');
  }, [rewrittenPrompt, setOriginalPrompt, setRewrittenPrompt]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rewrittenPrompt);
    } catch {
      // Clipboard API unavailable — silently ignore.
    }
  }, [rewrittenPrompt]);

  const handleDiscard = useCallback(() => {
    setRewrittenPrompt('');
  }, [setRewrittenPrompt]);

  return (
    <div className="rewrite-preview" aria-live="polite" aria-label="Rewritten prompt">
      <div className="rewrite-header">
        <span className="rewrite-badge">Rewritten prompt</span>
      </div>

      {isLoading ? (
        <div className="rewrite-skeleton" aria-busy="true" aria-label="Loading rewritten prompt">
          <div className="skeleton-line" style={{ width: '90%' }} />
          <div className="skeleton-line" style={{ width: '75%' }} />
          <div className="skeleton-line" style={{ width: '60%' }} />
        </div>
      ) : (
        <p className="rewrite-text">{rewrittenPrompt}</p>
      )}

      {!isLoading && rewrittenPrompt && (
        <div className="rewrite-actions">
          <button className="action-btn action-accept" onClick={handleAccept}>
            Accept
          </button>
          <button className="action-btn action-copy" onClick={handleCopy}>
            Copy
          </button>
          <button className="action-btn action-discard" onClick={handleDiscard}>
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
