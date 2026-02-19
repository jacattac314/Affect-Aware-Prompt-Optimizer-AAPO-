'use strict';

const { classifyPosture, resolvePosture } = require('../src/services/postureService');

// ── Landmark builder helpers ─────────────────────────────────────────────────

/** Creates a single landmark object. */
function lm(x, y, z = 0, visibility = 0.95) {
  return { x, y, z, visibility };
}

/**
 * Builds a minimal 25-landmark array.
 * All landmarks default to a neutral "upright" position; the caller
 * can override specific indices.
 */
function buildLandmarks(overrides = {}) {
  // Base: person standing, roughly centred, upright.
  // y increases downward (0 = top of frame, 1 = bottom).
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
  // Fill remaining indices (up to 24) with invisible landmarks.
  const arr = [];
  for (let i = 0; i <= 24; i++) {
    arr.push(merged[i] || lm(0.5, 0.5, 0, 0));
  }
  return arr;
}

// ── classifyPosture ──────────────────────────────────────────────────────────

describe('classifyPosture', () => {
  test('upright baseline', () => {
    const lms = buildLandmarks();
    expect(classifyPosture(lms)).toBe('upright');
  });

  test('head-down when nose.y >= shoulder_mid.y', () => {
    const lms = buildLandmarks({
      0: lm(0.50, 0.42), // nose at same height as shoulders (0.40)
    });
    expect(classifyPosture(lms)).toBe('head-down');
  });

  test('slouching when head barely above shoulders (gap < 0.12)', () => {
    const lms = buildLandmarks({
      0: lm(0.50, 0.32), // shoulder_mid.y=0.40, nose.y=0.32 → gap=0.08 < 0.12
    });
    expect(classifyPosture(lms)).toBe('slouching');
  });

  test('crossed-arms when wrists cross midline', () => {
    const lms = buildLandmarks({
      // Left wrist moves right past right shoulder; right wrist left past left shoulder.
      15: lm(0.65, 0.55), // left wrist  x=0.65 > right_shoulder.x=0.60 ✓
      16: lm(0.35, 0.55), // right wrist x=0.35 < left_shoulder.x=0.40  ✓
    });
    expect(classifyPosture(lms)).toBe('crossed-arms');
  });

  test('leaning-forward when nose offset > 0.12 from shoulder centre', () => {
    const lms = buildLandmarks({
      0: lm(0.14, 0.20), // shoulder mid = 0.50, nose.x = 0.14 → offset = 0.36 > 0.12
    });
    expect(classifyPosture(lms)).toBe('leaning-forward');
  });

  test('returns unknown when shoulders have low visibility', () => {
    const lms = buildLandmarks({
      11: lm(0.40, 0.40, 0, 0.1), // low visibility
      12: lm(0.60, 0.40, 0, 0.1),
    });
    expect(classifyPosture(lms)).toBe('unknown');
  });

  test('throws on invalid landmark array', () => {
    expect(() => classifyPosture('not-an-array')).toThrow('landmarks must be an array');
    expect(() => classifyPosture([])).toThrow('at least 25 entries');
    expect(() =>
      classifyPosture(Array.from({ length: 25 }, () => ({ x: 'bad', y: 0, z: 0 })))
    ).toThrow('numeric x, y, z');
  });
});

// ── resolvePosture ───────────────────────────────────────────────────────────

describe('resolvePosture', () => {
  test('returns pre-computed label unchanged', () => {
    const result = resolvePosture({ postureLabel: 'slouching' });
    expect(result.postureLabel).toBe('slouching');
    expect(result.source).toBe('label');
  });

  test('normalises label to lowercase', () => {
    const result = resolvePosture({ postureLabel: 'UPRIGHT' });
    expect(result.postureLabel).toBe('upright');
  });

  test('throws on unknown label', () => {
    expect(() => resolvePosture({ postureLabel: 'moonwalking' })).toThrow('Unknown posture label');
  });

  test('classifies from landmarks when no label supplied', () => {
    const lms = buildLandmarks(); // upright
    const result = resolvePosture({ landmarks: lms });
    expect(result.postureLabel).toBe('upright');
    expect(result.source).toBe('landmarks');
  });

  test('prefers postureLabel over landmarks when both supplied', () => {
    const lms = buildLandmarks({ 0: lm(0.50, 0.42) }); // would be head-down
    const result = resolvePosture({ postureLabel: 'upright', landmarks: lms });
    expect(result.postureLabel).toBe('upright');
    expect(result.source).toBe('label');
  });

  test('returns default upright when nothing supplied', () => {
    const result = resolvePosture({});
    expect(result.postureLabel).toBe('upright');
    expect(result.source).toBe('default');
  });
});
