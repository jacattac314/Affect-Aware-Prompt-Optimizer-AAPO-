import { useState, useEffect, useRef, useCallback } from 'react';
import { loadPoseModel, detectPosture } from '../services/postureDetection';
import { useAppContext } from '../context/AppContext';

const DETECTION_INTERVAL_MS = 800; // slightly slower than emotion — pose is heavier

/**
 * Continuously detects the user's body posture from a video element.
 * Updates the global postureLabel in AppContext every DETECTION_INTERVAL_MS.
 *
 * @param {React.RefObject<HTMLVideoElement>} videoRef
 * @returns {{ poseReady: boolean, poseError: string | null }}
 */
export function usePostureDetection(videoRef) {
  const { setPostureLabel } = useAppContext();
  const [poseReady, setPoseReady] = useState(false);
  const [poseError, setPoseError] = useState(null);
  const intervalRef = useRef(null);

  // Load model once on mount.
  useEffect(() => {
    loadPoseModel()
      .then(() => setPoseReady(true))
      .catch((err) =>
        setPoseError(`Failed to load pose model: ${err.message}`)
      );
  }, []);

  const runDetection = useCallback(async () => {
    if (!videoRef.current) return;
    const label = await detectPosture(videoRef.current);
    setPostureLabel(label);
  }, [videoRef, setPostureLabel]);

  // Start polling once the model is ready.
  useEffect(() => {
    if (!poseReady) return;
    intervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [poseReady, runDetection]);

  return { poseReady, poseError };
}
