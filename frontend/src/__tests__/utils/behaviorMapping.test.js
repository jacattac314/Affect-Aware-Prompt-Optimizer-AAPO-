import { mapBehaviorToIntent } from '../../utils/behaviorMapping';

describe('mapBehaviorToIntent (client-side)', () => {
  test('angry + slouching → FRUSTRATED with emoji', () => {
    const result = mapBehaviorToIntent('angry', 'slouching');
    expect(result.intent).toBe('FRUSTRATED');
    expect(result.emoji).toBeDefined();
    expect(typeof result.emoji).toBe('string');
  });

  test('happy + upright → ENTHUSIASTIC', () => {
    const result = mapBehaviorToIntent('happy', 'upright');
    expect(result.intent).toBe('ENTHUSIASTIC');
  });

  test('neutral + slouching → FATIGUED', () => {
    const result = mapBehaviorToIntent('neutral', 'slouching');
    expect(result.intent).toBe('FATIGUED');
  });

  test('unknown emotion returns NEUTRAL default', () => {
    const result = mapBehaviorToIntent('confused', 'upright');
    expect(result.intent).toBe('NEUTRAL');
  });

  test('null inputs return NEUTRAL', () => {
    const result = mapBehaviorToIntent(null, null);
    expect(result.intent).toBe('NEUTRAL');
  });

  test('returns toneSuggestion for every known combination', () => {
    const emotions = ['angry', 'sad', 'happy', 'surprised', 'neutral', 'fearful', 'disgusted'];
    const postures = ['upright', 'slouching', 'crossed-arms', 'head-down', 'leaning-forward'];

    emotions.forEach((emotion) => {
      postures.forEach((posture) => {
        const result = mapBehaviorToIntent(emotion, posture);
        expect(typeof result.toneSuggestion).toBe('string');
        expect(result.toneSuggestion.length).toBeGreaterThan(0);
      });
    });
  });
});
