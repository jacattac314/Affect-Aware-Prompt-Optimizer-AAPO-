import React from 'react';
import { mapBehaviorToIntent } from '../utils/behaviorMapping';
import './EmotionOverlay.css';

const EMOTION_COLORS = {
  angry: '#ff6b6b',
  sad: '#74b9ff',
  happy: '#55efc4',
  surprised: '#fdcb6e',
  fearful: '#a29bfe',
  disgusted: '#fd79a8',
  neutral: '#b2bec3',
};

/**
 * Displays the detected emotion and posture labels, plus the inferred intent.
 *
 * @param {{ emotion: string, posture: string }} props
 */
export default function EmotionOverlay({ emotion, posture }) {
  const { intent, toneSuggestion, emoji } = mapBehaviorToIntent(emotion, posture);
  const color = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  return (
    <div className="emotion-overlay" aria-live="polite" aria-atomic="true">
      <div className="emotion-primary" style={{ borderColor: color }}>
        <span className="emotion-emoji" role="img" aria-label={`Detected emotion: ${emotion}`}>
          {emoji}
        </span>
        <div className="emotion-labels">
          <span className="emotion-label" style={{ color }}>
            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
          </span>
          <span className="posture-label">{posture}</span>
        </div>
      </div>

      <div className="intent-chip">
        <span className="intent-label">Intent: {intent}</span>
      </div>

      <p className="tone-suggestion">
        <strong>Suggested tone:</strong> {toneSuggestion}
      </p>
    </div>
  );
}
