import React, { useCallback } from 'react';
import CameraView from './components/CameraView';
import EmotionOverlay from './components/EmotionOverlay';
import PromptEditor from './components/PromptEditor';
import RewritePreview from './components/RewritePreview';
import { useAppContext } from './context/AppContext';
import { rewritePromptAPI } from './services/api';

import './App.css';

export default function App() {
  const {
    emotionLabel,
    postureLabel,
    originalPrompt,
    rewrittenPrompt,
    isLoading,
    error,
    setRewrittenPrompt,
    setIsLoading,
    setError,
  } = useAppContext();

  const handleImprove = useCallback(async () => {
    if (!originalPrompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setRewrittenPrompt('');

    try {
      const { rewrittenPrompt: result } = await rewritePromptAPI({
        prompt: originalPrompt,
        emotionLabel,
        postureLabel,
      });
      setRewrittenPrompt(result);
    } catch (err) {
      setError(err.message || 'Failed to rewrite prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [originalPrompt, emotionLabel, postureLabel, setRewrittenPrompt, setIsLoading, setError]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Affect-Aware Prompt Optimizer</h1>
        <p className="app-subtitle">
          Your emotional state shapes your words. Let AAPO help you communicate clearly.
        </p>
      </header>

      <main className="app-main">
        <section className="camera-section">
          <CameraView />
          <EmotionOverlay emotion={emotionLabel} posture={postureLabel} />
        </section>

        <section className="prompt-section">
          <PromptEditor onImprove={handleImprove} isLoading={isLoading} />

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          {(rewrittenPrompt || isLoading) && (
            <RewritePreview rewrittenPrompt={rewrittenPrompt} isLoading={isLoading} />
          )}
        </section>
      </main>
    </div>
  );
}
