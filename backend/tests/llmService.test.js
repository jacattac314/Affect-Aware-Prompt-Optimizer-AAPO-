'use strict';

const { buildSystemPrompt, rewritePrompt } = require('../src/services/llmService');

// ── buildSystemPrompt ────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  test('injects toneSuggestion into template', () => {
    const prompt = buildSystemPrompt('calm and empathetic');
    expect(prompt).toContain('calm and empathetic');
    expect(prompt).not.toContain('{{TONE_SUGGESTION}}');
  });

  test('returns a non-empty string', () => {
    const prompt = buildSystemPrompt('direct');
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(10);
  });
});

// ── rewritePrompt (mocked LLM calls) ────────────────────────────────────────

// We mock the provider modules so tests do not require API keys.
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked OpenAI rewrite.' } }],
        }),
      },
    },
  }));
});

jest.mock('@anthropic-ai/sdk', () => ({
  Anthropic: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Mocked Anthropic rewrite.' }],
      }),
    },
  })),
}));

describe('rewritePrompt', () => {
  const original = 'How do I fix this bug?';
  const tone = 'calm explanatory';

  test('calls OpenAI and returns rewritten text', async () => {
    const result = await rewritePrompt(original, tone, 'openai');
    expect(result).toBe('Mocked OpenAI rewrite.');
  });

  test('calls Anthropic and returns rewritten text', async () => {
    const result = await rewritePrompt(original, tone, 'anthropic');
    expect(result).toBe('Mocked Anthropic rewrite.');
  });

  test('defaults to OpenAI when provider is unrecognised', async () => {
    const result = await rewritePrompt(original, tone, 'unknown-provider');
    expect(result).toBe('Mocked OpenAI rewrite.');
  });
});
