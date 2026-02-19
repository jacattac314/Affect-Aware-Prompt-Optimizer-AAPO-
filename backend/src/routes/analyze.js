'use strict';

const { Router } = require('express');
const { mapBehaviorToIntent } = require('../services/mappingService');

const router = Router();

/**
 * POST /analyze
 *
 * Body (all optional — at least one must be present):
 *   emotionLabel  {string}  e.g. "angry"
 *   postureLabel  {string}  e.g. "slouching"
 *
 * Response:
 *   { intent: string, toneSuggestion: string }
 */
router.post('/', (req, res, next) => {
  try {
    const { emotionLabel, postureLabel } = req.body;

    if (!emotionLabel && !postureLabel) {
      const err = new Error('At least one of emotionLabel or postureLabel is required.');
      err.status = 400;
      throw err;
    }

    const { intent, toneSuggestion } = mapBehaviorToIntent(
      emotionLabel || 'neutral',
      postureLabel || 'upright'
    );

    res.json({ intent, toneSuggestion });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
