import React from 'react';
import { useCamera } from '../hooks/useCamera';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { usePostureDetection } from '../hooks/usePostureDetection';
import './CameraView.css';

/**
 * Renders the live webcam feed and drives both detection loops:
 *   - useEmotionDetection  — face-api.js, polls every 500 ms
 *   - usePostureDetection  — MediaPipe Pose, polls every 800 ms
 *
 * Both hooks write their results directly to AppContext.
 */
export default function CameraView() {
  const { videoRef, isActive, error: cameraError, start } = useCamera();
  const { modelsReady, loadError: emotionError } = useEmotionDetection(videoRef);
  const { poseReady, poseError } = usePostureDetection(videoRef);

  const anyError = emotionError || poseError;
  const allReady = modelsReady && poseReady;

  return (
    <div className="camera-view">
      <div className="camera-frame" aria-label="Live camera feed">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="camera-video"
          playsInline
          muted
          aria-hidden="true"
        />

        {!isActive && !cameraError && (
          <div className="camera-placeholder">
            <span>Initializing camera...</span>
          </div>
        )}

        {cameraError && (
          <div className="camera-error" role="alert">
            <p>{cameraError}</p>
            <button onClick={start}>Retry</button>
          </div>
        )}
      </div>

      <div className="camera-status">
        {anyError && (
          <span className="status-badge status-error" role="alert">
            {anyError}
          </span>
        )}
        {!anyError && !allReady && (
          <span className="status-badge status-loading">
            Loading models{modelsReady ? ' (pose…)' : ' (emotion…)'}
          </span>
        )}
        {!anyError && allReady && (
          <span className="status-badge status-ready">
            Emotion &amp; posture detection active
          </span>
        )}
      </div>
    </div>
  );
}
