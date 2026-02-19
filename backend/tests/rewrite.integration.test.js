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
  test('returns intent and toneSuggestion for valid emotion+posture', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ emotionLabel: 'happy', postureLabel: 'upright' });

    expect(res.status).toBe(200);
    expect(res.body.intent).toBe('ENTHUSIASTIC');
    expect(res.body).toHaveProperty('toneSuggestion');
  });

  test('returns 400 when both emotionLabel and postureLabel are missing', async () => {
    const res = await request(app).post('/analyze').send({});
    expect(res.status).toBe(400);
  });

  test('works with only emotionLabel provided', async () => {
    const res = await request(app).post('/analyze').send({ emotionLabel: 'neutral' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('intent');
  });
});

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
