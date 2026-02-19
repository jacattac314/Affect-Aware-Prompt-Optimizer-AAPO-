/**
 * Posture Detection Service (MediaPipe Pose)
 *
 * Loads the MediaPipe Pose model and provides functions to:
 *   1. Detect 33 body landmarks from a <video> element.
 *   2. Classify those landmarks into a posture label using heuristic rules.
 *
 * All processing is on-device — no video frames are transmitted to any server.
 *
 * MediaPipe landmark indices used:
 *   0  nose        11 left_shoulder   12 right_shoulder
 *  13  left_elbow  14 right_elbow     15 left_wrist     16 right_wrist
 *  23  left_hip    24 right_hip
 */

// Landmark indices (subset we use)
const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
};

// Minimum visibility score to trust a landmark.
const VISIBILITY_THRESHOLD = 0.5;

let poseInstance = null;
let resultsBuffer = null;

/**
 * Loads and initialises the MediaPipe Pose model (idempotent).
 * Uses the CDN-hosted WASM files so no local model download is needed.
 *
 * @returns {Promise<void>}
 */
export async function loadPoseModel() {
  if (poseInstance) return;

  const { Pose } = await import('@mediapipe/pose');

  poseInstance = new Pose({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
  });

  poseInstance.setOptions({
    modelComplexity: 1,        // 0=Lite, 1=Full, 2=Heavy
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  poseInstance.onResults((results) => {
    resultsBuffer = results;
  });

  // Warm up with a blank 1×1 canvas to initialise WASM.
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  await poseInstance.send({ image: canvas });
}

/**
 * Sends a video frame to MediaPipe Pose and returns the latest landmark set.
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<Array<{x:number,y:number,z:number,visibility:number}> | null>}
 */
export async function detectLandmarks(videoEl) {
  if (!poseInstance || !videoEl || videoEl.readyState < 2) return null;
  await poseInstance.send({ image: videoEl });
  return resultsBuffer?.poseLandmarks ?? null;
}

// ── Heuristic posture classifier ─────────────────────────────────────────────

/**
 * Returns true if a landmark is reliable enough to use.
 * @param {{ visibility: number }} lm
 */
function visible(lm) {
  return lm && lm.visibility >= VISIBILITY_THRESHOLD;
}

/** Midpoint of two landmarks (x, y only). */
function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Euclidean distance (2D). */
function dist2d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Classifies body posture from MediaPipe Pose landmarks.
 *
 * Rules (all use normalized 0–1 coordinates; y increases downward):
 *
 *  head-down    : nose.y ≥ shoulder_mid.y          (head level with / below shoulders)
 *  slouching    : (shoulder_mid.y − nose.y) < 0.12  (head barely above shoulders)
 *  crossed-arms : left_wrist is right of right_shoulder AND
 *                 right_wrist is left of left_shoulder
 *  leaning-fwd  : |nose.x − shoulder_mid.x| > 0.12  (head offset from torso centre)
 *  upright      : default
 *
 * @param {Array<{x:number,y:number,z:number,visibility:number}>} landmarks
 * @returns {'upright'|'slouching'|'crossed-arms'|'head-down'|'leaning-forward'|'unknown'}
 */
export function classifyPosture(landmarks) {
  if (!landmarks || landmarks.length < 25) return 'unknown';

  const nose = landmarks[LM.NOSE];
  const lShoulder = landmarks[LM.LEFT_SHOULDER];
  const rShoulder = landmarks[LM.RIGHT_SHOULDER];
  const lWrist = landmarks[LM.LEFT_WRIST];
  const rWrist = landmarks[LM.RIGHT_WRIST];
  const lHip = landmarks[LM.LEFT_HIP];
  const rHip = landmarks[LM.RIGHT_HIP];

  // Need at least shoulders visible.
  if (!visible(lShoulder) || !visible(rShoulder)) return 'unknown';

  const shoulderMid = mid(lShoulder, rShoulder);

  // 1. Head-down: nose at or below shoulder level.
  if (visible(nose) && nose.y >= shoulderMid.y - 0.02) {
    return 'head-down';
  }

  // 2. Slouching: head barely above shoulders (small vertical gap).
  if (visible(nose) && shoulderMid.y - nose.y < 0.12) {
    return 'slouching';
  }

  // 3. Crossed arms: wrists cross the midline of the body.
  if (visible(lWrist) && visible(rWrist)) {
    const crossedLeft = lWrist.x > rShoulder.x;   // left wrist right of right shoulder
    const crossedRight = rWrist.x < lShoulder.x;  // right wrist left of left shoulder
    if (crossedLeft && crossedRight) return 'crossed-arms';
  }

  // 4. Leaning forward: significant horizontal offset of nose from shoulder centre.
  if (visible(nose) && Math.abs(nose.x - shoulderMid.x) > 0.12) {
    return 'leaning-forward';
  }

  return 'upright';
}

/**
 * Convenience: detect landmarks from video then classify posture.
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<string>} posture label
 */
export async function detectPosture(videoEl) {
  const landmarks = await detectLandmarks(videoEl);
  if (!landmarks) return 'upright'; // default when no body detected
  return classifyPosture(landmarks);
}
