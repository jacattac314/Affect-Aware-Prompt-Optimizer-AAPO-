import React from 'react';
import { useCamera } from '../hooks/useCamera';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import './CameraView.css';

/**
 * Renders the live webcam feed.
 *
 * Also drives the emotion detection loop via useEmotionDetection,
 * which updates the global AppContext state automatically.
 */
export default function CameraView() {
  const { videoRef, isActive, error: cameraError, start } = useCamera();
  const { modelsReady, loadError } = useEmotionDetection(videoRef);

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
        {loadError && (
          <span className="status-badge status-error">
            Model load error — emotion detection unavailable
          </span>
        )}
        {!modelsReady && !loadError && (
          <span className="status-badge status-loading">Loading emotion models...</span>
        )}
        {modelsReady && (
          <span className="status-badge status-ready">Emotion detection active</span>
        )}
      </div>
    </div>
  );
}
