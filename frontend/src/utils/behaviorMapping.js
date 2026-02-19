/**
 * Client-side behavior → intent mapping utility.
 *
 * This mirrors the backend mappingService so the frontend can show a
 * predicted intent in the UI before the user hits "Improve My Prompt".
 * The authoritative mapping is always applied server-side.
 */

const MAPPING_TABLE = {
  angry: {
    slouching: { intent: 'FRUSTRATED', toneSuggestion: 'calm and empathetic', emoji: '😤' },
    'crossed-arms': { intent: 'DEFENSIVE', toneSuggestion: 'reassuring and non-confrontational', emoji: '🤐' },
    'head-down': { intent: 'RESIGNED_ANGRY', toneSuggestion: 'supportive and solution-focused', emoji: '😞' },
    upright: { intent: 'ASSERTIVE', toneSuggestion: 'clear, direct, and respectful', emoji: '😠' },
    'leaning-forward': { intent: 'CONFRONTATIONAL', toneSuggestion: 'de-escalating and constructive', emoji: '😡' },
  },
  sad: {
    slouching: { intent: 'DISCOURAGED', toneSuggestion: 'warm, encouraging, and positive', emoji: '😢' },
    'head-down': { intent: 'DEJECTED', toneSuggestion: 'compassionate and uplifting', emoji: '😔' },
    'crossed-arms': { intent: 'WITHDRAWN', toneSuggestion: 'gentle and open-ended', emoji: '😶' },
    upright: { intent: 'REFLECTIVE', toneSuggestion: 'thoughtful and supportive', emoji: '😕' },
    'leaning-forward': { intent: 'SEEKING_HELP', toneSuggestion: 'helpful and actionable', emoji: '🙏' },
  },
  happy: {
    upright: { intent: 'ENTHUSIASTIC', toneSuggestion: 'energetic and collaborative', emoji: '😄' },
    'leaning-forward': { intent: 'ENGAGED', toneSuggestion: 'enthusiastic and exploratory', emoji: '😊' },
    slouching: { intent: 'RELAXED_HAPPY', toneSuggestion: 'casual and friendly', emoji: '😌' },
    'crossed-arms': { intent: 'CONTENT_GUARDED', toneSuggestion: 'friendly but concise', emoji: '🙂' },
    'head-down': { intent: 'FOCUSED_HAPPY', toneSuggestion: 'clear and focused', emoji: '🤓' },
  },
  surprised: {
    upright: { intent: 'CURIOUS', toneSuggestion: 'informative and clear', emoji: '😲' },
    'leaning-forward': { intent: 'INTRIGUED', toneSuggestion: 'detailed and engaging', emoji: '🤩' },
    slouching: { intent: 'OVERWHELMED', toneSuggestion: 'calming and step-by-step', emoji: '😵' },
    'crossed-arms': { intent: 'SKEPTICAL', toneSuggestion: 'evidence-based and transparent', emoji: '🤨' },
    'head-down': { intent: 'PROCESSING', toneSuggestion: 'patient and explanatory', emoji: '🤔' },
  },
  fearful: {
    slouching: { intent: 'ANXIOUS', toneSuggestion: 'reassuring, calm, and structured', emoji: '😰' },
    'head-down': { intent: 'OVERWHELMED', toneSuggestion: 'step-by-step and comforting', emoji: '😨' },
    'crossed-arms': { intent: 'GUARDED', toneSuggestion: 'safe, clear, and non-threatening', emoji: '😟' },
    upright: { intent: 'CAUTIOUS', toneSuggestion: 'careful and measured', emoji: '😦' },
    'leaning-forward': { intent: 'ALERT', toneSuggestion: 'precise and informative', emoji: '😧' },
  },
  disgusted: {
    upright: { intent: 'CRITICAL', toneSuggestion: 'objective and professional', emoji: '😒' },
    'crossed-arms': { intent: 'DISMISSIVE', toneSuggestion: 'neutral and factual', emoji: '🙄' },
    slouching: { intent: 'APATHETIC', toneSuggestion: 'concise and direct', emoji: '😑' },
    'head-down': { intent: 'RESIGNED', toneSuggestion: 'constructive and forward-looking', emoji: '😞' },
    'leaning-forward': { intent: 'CHALLENGING', toneSuggestion: 'balanced and respectful', emoji: '😤' },
  },
  neutral: {
    upright: { intent: 'NEUTRAL', toneSuggestion: 'balanced and professional', emoji: '😐' },
    'leaning-forward': { intent: 'ATTENTIVE', toneSuggestion: 'clear and informative', emoji: '🧐' },
    slouching: { intent: 'FATIGUED', toneSuggestion: 'concise and easy to scan', emoji: '😪' },
    'crossed-arms': { intent: 'GUARDED', toneSuggestion: 'respectful and to-the-point', emoji: '😶' },
    'head-down': { intent: 'TIRED', toneSuggestion: 'brief and actionable', emoji: '😴' },
  },
};

const DEFAULT = { intent: 'NEUTRAL', toneSuggestion: 'balanced and professional', emoji: '😐' };

/**
 * @param {string} emotionLabel
 * @param {string} postureLabel
 * @returns {{ intent: string, toneSuggestion: string, emoji: string }}
 */
export function mapBehaviorToIntent(emotionLabel, postureLabel) {
  const emotion = (emotionLabel || 'neutral').toLowerCase();
  const posture = (postureLabel || 'upright').toLowerCase();
  const emotionMap = MAPPING_TABLE[emotion];
  if (!emotionMap) return DEFAULT;
  return emotionMap[posture] || emotionMap['upright'] || DEFAULT;
}

export { MAPPING_TABLE };
