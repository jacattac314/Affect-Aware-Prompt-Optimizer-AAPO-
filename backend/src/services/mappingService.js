'use strict';

/**
 * Behavior → Communication Intent Mapping
 *
 * Maps combinations of facial emotion and body posture labels to a
 * high-level communication intent and a suggested rewriting tone.
 *
 * Emotions:  angry | sad | happy | surprised | neutral | fearful | disgusted
 * Postures:  upright | slouching | crossed-arms | head-down | leaning-forward
 */

const MAPPING_TABLE = {
  angry: {
    slouching: { intent: 'FRUSTRATED', toneSuggestion: 'calm and empathetic' },
    'crossed-arms': { intent: 'DEFENSIVE', toneSuggestion: 'reassuring and non-confrontational' },
    'head-down': { intent: 'RESIGNED_ANGRY', toneSuggestion: 'supportive and solution-focused' },
    upright: { intent: 'ASSERTIVE', toneSuggestion: 'clear, direct, and respectful' },
    'leaning-forward': { intent: 'CONFRONTATIONAL', toneSuggestion: 'de-escalating and constructive' },
  },
  sad: {
    slouching: { intent: 'DISCOURAGED', toneSuggestion: 'warm, encouraging, and positive' },
    'head-down': { intent: 'DEJECTED', toneSuggestion: 'compassionate and uplifting' },
    'crossed-arms': { intent: 'WITHDRAWN', toneSuggestion: 'gentle and open-ended' },
    upright: { intent: 'REFLECTIVE', toneSuggestion: 'thoughtful and supportive' },
    'leaning-forward': { intent: 'SEEKING_HELP', toneSuggestion: 'helpful and actionable' },
  },
  happy: {
    upright: { intent: 'ENTHUSIASTIC', toneSuggestion: 'energetic and collaborative' },
    'leaning-forward': { intent: 'ENGAGED', toneSuggestion: 'enthusiastic and exploratory' },
    slouching: { intent: 'RELAXED_HAPPY', toneSuggestion: 'casual and friendly' },
    'crossed-arms': { intent: 'CONTENT_GUARDED', toneSuggestion: 'friendly but concise' },
    'head-down': { intent: 'FOCUSED_HAPPY', toneSuggestion: 'clear and focused' },
  },
  surprised: {
    upright: { intent: 'CURIOUS', toneSuggestion: 'informative and clear' },
    'leaning-forward': { intent: 'INTRIGUED', toneSuggestion: 'detailed and engaging' },
    slouching: { intent: 'OVERWHELMED', toneSuggestion: 'calming and step-by-step' },
    'crossed-arms': { intent: 'SKEPTICAL', toneSuggestion: 'evidence-based and transparent' },
    'head-down': { intent: 'PROCESSING', toneSuggestion: 'patient and explanatory' },
  },
  fearful: {
    slouching: { intent: 'ANXIOUS', toneSuggestion: 'reassuring, calm, and structured' },
    'head-down': { intent: 'OVERWHELMED', toneSuggestion: 'step-by-step and comforting' },
    'crossed-arms': { intent: 'GUARDED', toneSuggestion: 'safe, clear, and non-threatening' },
    upright: { intent: 'CAUTIOUS', toneSuggestion: 'careful and measured' },
    'leaning-forward': { intent: 'ALERT', toneSuggestion: 'precise and informative' },
  },
  disgusted: {
    upright: { intent: 'CRITICAL', toneSuggestion: 'objective and professional' },
    'crossed-arms': { intent: 'DISMISSIVE', toneSuggestion: 'neutral and factual' },
    slouching: { intent: 'APATHETIC', toneSuggestion: 'concise and direct' },
    'head-down': { intent: 'RESIGNED', toneSuggestion: 'constructive and forward-looking' },
    'leaning-forward': { intent: 'CHALLENGING', toneSuggestion: 'balanced and respectful' },
  },
  neutral: {
    upright: { intent: 'NEUTRAL', toneSuggestion: 'balanced and professional' },
    'leaning-forward': { intent: 'ATTENTIVE', toneSuggestion: 'clear and informative' },
    slouching: { intent: 'FATIGUED', toneSuggestion: 'concise and easy to scan' },
    'crossed-arms': { intent: 'GUARDED', toneSuggestion: 'respectful and to-the-point' },
    'head-down': { intent: 'TIRED', toneSuggestion: 'brief and actionable' },
  },
};

const DEFAULT_RESULT = { intent: 'NEUTRAL', toneSuggestion: 'balanced and professional' };

/**
 * Maps a detected emotion + posture to a communication intent.
 *
 * @param {string} emotionLabel - Detected facial emotion label.
 * @param {string} postureLabel - Detected body posture label.
 * @returns {{ intent: string, toneSuggestion: string }}
 */
function mapBehaviorToIntent(emotionLabel, postureLabel) {
  const emotion = (emotionLabel || 'neutral').toLowerCase();
  const posture = (postureLabel || 'upright').toLowerCase();

  const emotionMap = MAPPING_TABLE[emotion];
  if (!emotionMap) return DEFAULT_RESULT;

  return emotionMap[posture] || emotionMap['upright'] || DEFAULT_RESULT;
}

module.exports = { mapBehaviorToIntent, MAPPING_TABLE };
