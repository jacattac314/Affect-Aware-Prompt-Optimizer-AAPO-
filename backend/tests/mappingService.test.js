'use strict';

const { mapBehaviorToIntent, MAPPING_TABLE } = require('../src/services/mappingService');

describe('mapBehaviorToIntent', () => {
  describe('returns correct intent for known combinations', () => {
    test('angry + slouching → FRUSTRATED with calm tone', () => {
      const result = mapBehaviorToIntent('angry', 'slouching');
      expect(result.intent).toBe('FRUSTRATED');
      expect(result.toneSuggestion).toMatch(/calm/i);
    });

    test('angry + upright → ASSERTIVE', () => {
      const result = mapBehaviorToIntent('angry', 'upright');
      expect(result.intent).toBe('ASSERTIVE');
    });

    test('happy + upright → ENTHUSIASTIC', () => {
      const result = mapBehaviorToIntent('happy', 'upright');
      expect(result.intent).toBe('ENTHUSIASTIC');
    });

    test('sad + slouching → DISCOURAGED', () => {
      const result = mapBehaviorToIntent('sad', 'slouching');
      expect(result.intent).toBe('DISCOURAGED');
    });

    test('neutral + upright → NEUTRAL', () => {
      const result = mapBehaviorToIntent('neutral', 'upright');
      expect(result.intent).toBe('NEUTRAL');
    });

    test('fearful + slouching → ANXIOUS', () => {
      const result = mapBehaviorToIntent('fearful', 'slouching');
      expect(result.intent).toBe('ANXIOUS');
    });
  });

  describe('graceful fallbacks', () => {
    test('unknown emotion returns NEUTRAL', () => {
      const result = mapBehaviorToIntent('confused', 'upright');
      expect(result.intent).toBe('NEUTRAL');
    });

    test('unknown posture falls back to upright mapping', () => {
      const result = mapBehaviorToIntent('angry', 'dancing');
      expect(result.intent).toBe('ASSERTIVE'); // angry + upright fallback
    });

    test('empty strings return NEUTRAL', () => {
      const result = mapBehaviorToIntent('', '');
      expect(result.intent).toBe('NEUTRAL');
    });

    test('null inputs return NEUTRAL', () => {
      const result = mapBehaviorToIntent(null, null);
      expect(result.intent).toBe('NEUTRAL');
    });
  });

  describe('case insensitivity', () => {
    test('ANGRY + UPRIGHT (uppercase) → ASSERTIVE', () => {
      const result = mapBehaviorToIntent('ANGRY', 'UPRIGHT');
      expect(result.intent).toBe('ASSERTIVE');
    });

    test('Happy + Upright (mixed case) → ENTHUSIASTIC', () => {
      const result = mapBehaviorToIntent('Happy', 'Upright');
      expect(result.intent).toBe('ENTHUSIASTIC');
    });
  });

  describe('mapping table completeness', () => {
    const expectedEmotions = ['angry', 'sad', 'happy', 'surprised', 'neutral', 'fearful', 'disgusted'];
    const expectedPostures = ['upright', 'slouching', 'crossed-arms', 'head-down', 'leaning-forward'];

    expectedEmotions.forEach((emotion) => {
      test(`emotion "${emotion}" has entries in the mapping table`, () => {
        expect(MAPPING_TABLE[emotion]).toBeDefined();
      });

      expectedPostures.forEach((posture) => {
        test(`${emotion} + ${posture} returns an intent and toneSuggestion`, () => {
          const result = mapBehaviorToIntent(emotion, posture);
          expect(result).toHaveProperty('intent');
          expect(result).toHaveProperty('toneSuggestion');
          expect(typeof result.intent).toBe('string');
          expect(typeof result.toneSuggestion).toBe('string');
        });
      });
    });
  });
});
