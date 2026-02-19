'use strict';

/**
 * Posture Classification Service (server-side)
 *
 * Classifies body posture from MediaPipe Pose landmark data.
 * Mirrors the heuristic rules in frontend/src/services/postureDetection.js
 * so the backend can also interpret posture when landmark arrays are forwarded.
 *
 * Landmark indices used:
 *   0  nose        11 left_shoulder   12 right_shoulder
 *  13  left_elbow  14 right_elbow     15 left_wrist     16 right_wrist
 *  23  left_hip    24 right_hip
 */

const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
};

const VISIBILITY_THRESHOLD = 0.5;
const VALID_POSTURE_LABELS = new Set([
  'upright',
  'slouching',
  'crossed-arms',
  'head-down',
  'leaning-forward',
  'unknown',
]);

function visible(lm) {
  return lm && typeof lm.visibility === 'number' && lm.visibility >= VISIBILITY_THRESHOLD;
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Validates that a landmark array has the correct shape.
 *
 * @param {unknown} landmarks
 * @throws {Error} if the array is invalid
 */
function validateLandmarks(landmarks) {
  if (!Array.isArray(landmarks)) throw new Error('landmarks must be an array');
  if (landmarks.length < 25) throw new Error('landmarks array must have at least 25 entries');
  for (const lm of landmarks) {
    if (
      typeof lm !== 'object' ||
      typeof lm.x !== 'number' ||
      typeof lm.y !== 'number' ||
      typeof lm.z !== 'number'
    ) {
      throw new Error('Each landmark must have numeric x, y, z fields');
    }
  }
}

/**
 * Classifies body posture from MediaPipe landmark data.
 *
 * @param {Array<{x:number, y:number, z:number, visibility?:number}>} landmarks
 * @returns {'upright'|'slouching'|'crossed-arms'|'head-down'|'leaning-forward'|'unknown'}
 */
function classifyPosture(landmarks) {
  validateLandmarks(landmarks);

  const nose = landmarks[LM.NOSE];
  const lShoulder = landmarks[LM.LEFT_SHOULDER];
  const rShoulder = landmarks[LM.RIGHT_SHOULDER];
  const lWrist = landmarks[LM.LEFT_WRIST];
  const rWrist = landmarks[LM.RIGHT_WRIST];

  if (!visible(lShoulder) || !visible(rShoulder)) return 'unknown';

  const shoulderMid = mid(lShoulder, rShoulder);

  // 1. Head-down: nose at or below shoulder level.
  if (visible(nose) && nose.y >= shoulderMid.y - 0.02) return 'head-down';

  // 2. Slouching: head barely above shoulders.
  if (visible(nose) && shoulderMid.y - nose.y < 0.12) return 'slouching';

  // 3. Crossed arms.
  if (visible(lWrist) && visible(rWrist)) {
    if (lWrist.x > rShoulder.x && rWrist.x < lShoulder.x) return 'crossed-arms';
  }

  // 4. Leaning forward: significant horizontal nose offset.
  if (visible(nose) && Math.abs(nose.x - shoulderMid.x) > 0.12) return 'leaning-forward';

  return 'upright';
}

/**
 * Accepts either a pre-computed posture label or a raw landmark array.
 * Returns the label and a confidence note.
 *
 * @param {{ postureLabel?: string, landmarks?: Array }} input
 * @returns {{ postureLabel: string, source: 'label'|'landmarks' }}
 */
function resolvePosture({ postureLabel, landmarks }) {
  if (postureLabel) {
    const label = postureLabel.toLowerCase();
    if (!VALID_POSTURE_LABELS.has(label)) {
      throw new Error(`Unknown posture label: "${postureLabel}"`);
    }
    return { postureLabel: label, source: 'label' };
  }

  if (landmarks) {
    return { postureLabel: classifyPosture(landmarks), source: 'landmarks' };
  }

  return { postureLabel: 'upright', source: 'default' };
}

module.exports = { classifyPosture, resolvePosture, VALID_POSTURE_LABELS };
