import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Manages webcam access and provides a ref to the <video> element.
 *
 * @returns {{
 *   videoRef: React.RefObject<HTMLVideoElement>,
 *   isActive: boolean,
 *   error: string | null,
 *   start: () => Promise<void>,
 *   stop: () => void,
 * }}
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);
      }
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and refresh.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err.message}`;
      setError(msg);
    }
  }, []);

  // Auto-start on mount; clean up on unmount.
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return { videoRef, isActive, error, start, stop };
}
