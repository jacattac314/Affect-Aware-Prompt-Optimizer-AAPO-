import { useState, useEffect, useRef, useCallback } from 'react';
import { loadModels, detectEmotion } from '../services/emotionDetection';
import { useAppContext } from '../context/AppContext';

const DETECTION_INTERVAL_MS = 500;

/**
 * Continuously detects the user's facial emotion from a video element.
 * Updates the global emotionLabel in AppContext every DETECTION_INTERVAL_MS.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @returns {{ modelsReady: boolean, loadError: string | null }}
 */
export function useEmotionDetection(videoRef) {
  const { setEmotionLabel } = useAppContext();
  const [modelsReady, setModelsReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const intervalRef = useRef(null);

  // Load models once on mount.
  useEffect(() => {
    loadModels()
      .then(() => setModelsReady(true))
      .catch((err) => setLoadError(`Failed to load emotion models: ${err.message}`));
  }, []);

  const runDetection = useCallback(async () => {
    if (!videoRef.current) return;
    const label = await detectEmotion(videoRef.current);
    setEmotionLabel(label);
  }, [videoRef, setEmotionLabel]);

  // Start polling once models are ready.
  useEffect(() => {
    if (!modelsReady) return;

    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [modelsReady, runDetection]);

  return { modelsReady, loadError };
}
