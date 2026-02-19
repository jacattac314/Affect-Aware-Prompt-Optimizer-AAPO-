import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

/**
 * Global application state.
 *
 * Holds the current detected emotion/posture labels, the user's original
 * prompt, the rewritten prompt returned from the backend, and UI state
 * (loading, error).
 */
export function AppProvider({ children }) {
  const [emotionLabel, setEmotionLabel] = useState('neutral');
  const [postureLabel, setPostureLabel] = useState('upright');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [rewrittenPrompt, setRewrittenPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const value = {
    emotionLabel,
    setEmotionLabel,
    postureLabel,
    setPostureLabel,
    originalPrompt,
    setOriginalPrompt,
    rewrittenPrompt,
    setRewrittenPrompt,
    isLoading,
    setIsLoading,
    error,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
