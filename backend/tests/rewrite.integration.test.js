'use strict';

const request = require('supertest');

// Mock the LLM service before loading the app so no real API calls are made.
jest.mock('../src/services/llmService', () => ({
  rewritePrompt: jest.fn().mockResolvedValue('This is the mocked rewritten prompt.'),
  buildSystemPrompt: jest.requireActual('../src/services/llmService').buildSystemPrompt,
}));

const app = require('../src/index');

describe('POST /rewrite', () => {
  test('returns 200 with rewrittenPrompt for valid request', async () => {
    const res = await request(app)
      .post('/rewrite')
      .send({ prompt: 'Fix my code', emotionLabel: 'angry', postureLabel: 'slouching' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rewrittenPrompt', 'This is the mocked rewritten prompt.');
    expect(res.body).toHaveProperty('intent');
    expect(res.body).toHaveProperty('toneSuggestion');
  });

  test('maps angry+slouching to FRUSTRATED intent', async () => {
    const res = await request(app)
      .post('/rewrite')
      .send({ prompt: 'Help me.', emotionLabel: 'angry', postureLabel: 'slouching' });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('FRUSTRATED');
  });

  test('returns 400 when prompt is missing', async () => {
    const res = await request(app).post('/rewrite').send({ emotionLabel: 'happy' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when prompt is not a string', async () => {
    const res = await request(app).post('/rewrite').send({ prompt: 42 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when prompt exceeds max length', async () => {
    const longPrompt = 'a'.repeat(5000);
    const res = await request(app).post('/rewrite').send({ prompt: longPrompt });
    expect(res.status).toBe(400);
  });

  test('accepts pre-computed intent and toneSuggestion, skips mapping', async () => {
    const res = await request(app).post('/rewrite').send({
      prompt: 'Hello',
      intent: 'CUSTOM_INTENT',
      toneSuggestion: 'very formal',
    });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('CUSTOM_INTENT');
    expect(res.body.toneSuggestion).toBe('very formal');
  });
});

describe('POST /analyze', () => {
  test('returns intent and toneSuggestion for valid emotion+posture label', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ emotionLabel: 'happy', postureLabel: 'upright' });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('ENTHUSIASTIC');
    expect(res.body).toHaveProperty('toneSuggestion');
    expect(res.body.resolvedPosture).toBe('upright');
    expect(res.body.postureSource).toBe('label');
  });

  test('returns 400 when body is completely empty', async () => {
    const res = await request(app).post('/analyze').send({});
    expect(res.status).toBe(400);
  });

  test('works with only emotionLabel — posture defaults to upright', async () => {
    const res = await request(app).post('/analyze').send({ emotionLabel: 'neutral' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('intent');
    expect(res.body.postureSource).toBe('default');
  });

  test('classifies posture from raw landmarks when postureLabel omitted', async () => {
    // Build a minimal 25-landmark array representing an upright person.
    const landmarks = Array.from({ length: 25 }, (_, i) => {
      const base = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
      if (i === 0)  return { ...base, x: 0.50, y: 0.20 }; // nose — high up
      if (i === 11) return { ...base, x: 0.40, y: 0.40 }; // left shoulder
      if (i === 12) return { ...base, x: 0.60, y: 0.40 }; // right shoulder
      return { ...base, visibility: 0.1 };
    });

    const res = await request(app)
      .post('/analyze')
      .send({ emotionLabel: 'happy', landmarks });

    expect(res.status).toBe(200);
    expect(res.body.postureSource).toBe('landmarks');
    expect(['upright', 'slouching', 'unknown']).toContain(res.body.resolvedPosture);
  });

  test('returns 400 for malformed landmark data', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ emotionLabel: 'neutral', landmarks: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for unknown postureLabel', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ emotionLabel: 'neutral', postureLabel: 'moonwalking' });
    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('X-Request-Id tracing', () => {
  test('every response includes an X-Request-Id header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test('echoes back a client-supplied X-Request-Id', async () => {
    const clientId = '11111111-2222-4333-a444-555555555555';
    const res = await request(app)
      .get('/health')
      .set('X-Request-Id', clientId);
    expect(res.headers['x-request-id']).toBe(clientId);
  });

  test('error responses include requestId in the JSON body', async () => {
    const res = await request(app).post('/rewrite').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('requestId');
  });
});
