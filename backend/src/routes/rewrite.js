'use strict';

const { Router } = require('express');
const { rewritePrompt } = require('../services/llmService');
const { mapBehaviorToIntent } = require('../services/mappingService');

const router = Router();

const MAX_PROMPT_LENGTH = 4000;

/**
 * POST /rewrite
 *
 * Body:
 *   prompt        {string}  required — the user's original prompt
 *   emotionLabel  {string}  optional — e.g. "angry"
 *   postureLabel  {string}  optional — e.g. "slouching"
 *   intent        {string}  optional — pre-computed intent (skips mapping if provided)
 *   toneSuggestion {string} optional — pre-computed tone suggestion
 *
 * Response:
 *   { rewrittenPrompt: string, intent: string, toneSuggestion: string }
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      prompt,
      emotionLabel = 'neutral',
      postureLabel = 'upright',
      intent: intentOverride,
      toneSuggestion: toneOverride,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      const err = new Error("'prompt' is required and must be a string.");
      err.status = 400;
      throw err;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      const err = new Error(
        `'prompt' exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`
      );
      err.status = 400;
      throw err;
    }

    const { intent, toneSuggestion } =
      intentOverride && toneOverride
        ? { intent: intentOverride, toneSuggestion: toneOverride }
        : mapBehaviorToIntent(emotionLabel, postureLabel);

    const rewrittenPrompt = await rewritePrompt(prompt, toneSuggestion);

    res.json({ rewrittenPrompt, intent, toneSuggestion });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
