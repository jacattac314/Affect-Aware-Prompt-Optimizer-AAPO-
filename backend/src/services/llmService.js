'use strict';

/**
 * LLM Service
 *
 * Provides a unified `rewritePrompt` function that delegates to the
 * configured LLM provider (OpenAI, Anthropic, or Gemini).
 *
 * Provider is controlled by the LLM_PROVIDER environment variable.
 */

const SYSTEM_TEMPLATE = `You are an expert communication coach and prompt engineer.
Your task is to rewrite the user's query so it better matches their current emotional state and communication intent.

Rules:
1. Preserve the original meaning and all factual content exactly.
2. Adjust only the tone, phrasing, and structure.
3. Keep the rewritten prompt concise — no longer than 20% more words than the original.
4. Return only the rewritten prompt. Do not add explanations, headers, or meta-commentary.

Inferred communication style: {{TONE_SUGGESTION}}`;

function buildSystemPrompt(toneSuggestion) {
  return SYSTEM_TEMPLATE.replace('{{TONE_SUGGESTION}}', toneSuggestion);
}

// ── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(originalPrompt, toneSuggestion) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(toneSuggestion) },
      { role: 'user', content: originalPrompt },
    ],
    temperature: 0.5,
    max_tokens: 1024,
  });

  return response.choices[0].message.content.trim();
}

// ── Anthropic Claude ─────────────────────────────────────────────────────────

async function callAnthropic(originalPrompt, toneSuggestion) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(toneSuggestion),
    messages: [{ role: 'user', content: originalPrompt }],
  });

  return response.content[0].text.trim();
}

// ── Google Gemini ─────────────────────────────────────────────────────────────

async function callGemini(originalPrompt, toneSuggestion) {
  // Uses the official @google/generative-ai SDK.
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const fullPrompt = `${buildSystemPrompt(toneSuggestion)}\n\nUser prompt to rewrite:\n${originalPrompt}`;
  const result = await model.generateContent(fullPrompt);
  return result.response.text().trim();
}

// ── Public interface ─────────────────────────────────────────────────────────

/**
 * Rewrites the given prompt to match the suggested communication tone.
 *
 * @param {string} originalPrompt   - The user's original prompt.
 * @param {string} toneSuggestion   - Tone hint from the mapping module.
 * @param {string} [provider]       - Override the LLM provider for this call.
 * @returns {Promise<string>}       - The rewritten prompt.
 */
async function rewritePrompt(
  originalPrompt,
  toneSuggestion,
  provider = process.env.LLM_PROVIDER || 'openai'
) {
  switch (provider.toLowerCase()) {
    case 'anthropic':
      return callAnthropic(originalPrompt, toneSuggestion);
    case 'gemini':
      return callGemini(originalPrompt, toneSuggestion);
    case 'openai':
    default:
      return callOpenAI(originalPrompt, toneSuggestion);
  }
}

module.exports = { rewritePrompt, buildSystemPrompt };
