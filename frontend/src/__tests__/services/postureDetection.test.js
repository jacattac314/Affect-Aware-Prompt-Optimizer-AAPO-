import { classifyPosture } from '../../services/postureDetection';

// Mock the @mediapipe/pose dynamic import — classifyPosture is pure and needs no WASM.
jest.mock('@mediapipe/pose', () => ({}), { virtual: true });

// ── Landmark helpers ─────────────────────────────────────────────────────────

function lm(x, y, z = 0, visibility = 0.95) {
  return { x, y, z, visibility };
}

function buildLandmarks(overrides = {}) {
  const base = {
    0:  lm(0.50, 0.20),  // nose
    11: lm(0.40, 0.40),  // left_shoulder
    12: lm(0.60, 0.40),  // right_shoulder
    13: lm(0.35, 0.55),  // left_elbow
    14: lm(0.65, 0.55),  // right_elbow
    15: lm(0.35, 0.70),  // left_wrist
    16: lm(0.65, 0.70),  // right_wrist
    23: lm(0.40, 0.70),  // left_hip
    24: lm(0.60, 0.70),  // right_hip
  };
  const merged = { ...base, ...overrides };
  const arr = [];
  for (let i = 0; i <= 32; i++) {
    arr.push(merged[i] || lm(0.5, 0.5, 0, 0));
  }
  return arr;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('classifyPosture (client-side heuristics)', () => {
  test('upright baseline', () => {
    expect(classifyPosture(buildLandmarks())).toBe('upright');
  });

  test('head-down when nose.y >= shoulder level', () => {
    const lms = buildLandmarks({ 0: lm(0.50, 0.42) });
    expect(classifyPosture(lms)).toBe('head-down');
  });

  test('slouching when vertical gap between nose and shoulders < 0.12', () => {
    const lms = buildLandmarks({ 0: lm(0.50, 0.32) }); // gap = 0.08
    expect(classifyPosture(lms)).toBe('slouching');
  });

  test('crossed-arms when wrists cross opposite shoulders', () => {
    const lms = buildLandmarks({
      15: lm(0.65, 0.55), // left wrist past right shoulder
      16: lm(0.35, 0.55), // right wrist past left shoulder
    });
    expect(classifyPosture(lms)).toBe('crossed-arms');
  });

  test('leaning-forward when nose offset from shoulder centre > 0.12', () => {
    const lms = buildLandmarks({ 0: lm(0.14, 0.20) });
    expect(classifyPosture(lms)).toBe('leaning-forward');
  });

  test('returns unknown when landmarks array is too short', () => {
    expect(classifyPosture([])).toBe('unknown');
    expect(classifyPosture(null)).toBe('unknown');
    expect(classifyPosture(undefined)).toBe('unknown');
  });

  test('returns unknown when shoulders have low visibility', () => {
    const lms = buildLandmarks({
      11: lm(0.40, 0.40, 0, 0.1),
      12: lm(0.60, 0.40, 0, 0.1),
    });
    expect(classifyPosture(lms)).toBe('unknown');
  });

  test('all valid posture labels are strings', () => {
    const cases = [
      buildLandmarks(),
      buildLandmarks({ 0: lm(0.50, 0.42) }),
      buildLandmarks({ 0: lm(0.50, 0.32) }),
      buildLandmarks({ 15: lm(0.65, 0.55), 16: lm(0.35, 0.55) }),
      buildLandmarks({ 0: lm(0.14, 0.20) }),
    ];
    cases.forEach((lms) => {
      const result = classifyPosture(lms);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
