/**
 * Emotion Detection Service (face-api.js)
 *
 * Loads the face-api.js models and provides a function to detect the
 * dominant facial emotion from a <video> element.
 *
 * Models are loaded from /models in the public directory.
 * Download them with:
 *   npx face-api-models --dest public/models
 * or from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
 */

import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Loads face-api.js models (idempotent — safe to call multiple times).
 * @returns {Promise<void>}
 */
export async function loadModels() {
  if (modelsLoaded) return;

  const MODEL_URL = process.env.REACT_APP_MODELS_URL || '/models';

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

/**
 * Detects the dominant facial emotion from a video element.
 *
 * @param {HTMLVideoElement} videoEl  - Live camera video element.
 * @param {number} [threshold=0.4]   - Minimum confidence to report an emotion.
 * @returns {Promise<string>}        - Dominant emotion label, or 'neutral'.
 */
export async function detectEmotion(videoEl, threshold = 0.4) {
  if (!videoEl || videoEl.readyState < 2) return 'neutral';

  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (!detection) return 'neutral';

  const { expressions } = detection;

  // Find the emotion with the highest confidence above the threshold.
  const entries = Object.entries(expressions);
  const best = entries.reduce((a, b) => (b[1] > a[1] ? b : a), ['neutral', 0]);

  return best[1] >= threshold ? best[0] : 'neutral';
}

/**
 * Returns all expression scores from a video element (useful for overlays).
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<Record<string, number> | null>}
 */
export async function detectAllExpressions(videoEl) {
  if (!videoEl || videoEl.readyState < 2) return null;

  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  return detection ? detection.expressions : null;
}
