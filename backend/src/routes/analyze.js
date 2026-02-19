'use strict';

const { Router } = require('express');
const { mapBehaviorToIntent } = require('../services/mappingService');
const { resolvePosture } = require('../services/postureService');

const router = Router();

/**
 * POST /analyze
 *
 * Accepts emotion and posture signals and returns a communication intent.
 * The posture can be provided as a pre-computed label OR as raw MediaPipe
 * Pose landmark data — the service will classify the landmarks server-side.
 *
 * Body (JSON):
 *   emotionLabel  {string}          Optional — e.g. "angry"
 *   postureLabel  {string}          Optional — e.g. "slouching"
 *   landmarks     {Array<object>}   Optional — MediaPipe Pose landmark array
 *                                   (ignored when postureLabel is provided)
 *
 * At least one of (emotionLabel | postureLabel | landmarks) is required.
 *
 * Response:
 *   {
 *     intent: string,
 *     toneSuggestion: string,
 *     resolvedPosture: string,
 *     postureSource: 'label' | 'landmarks' | 'default'
 *   }
 */
router.post('/', (req, res, next) => {
  try {
    const { emotionLabel, postureLabel, landmarks } = req.body;

    if (!emotionLabel && !postureLabel && !landmarks) {
      const err = new Error(
        'At least one of emotionLabel, postureLabel, or landmarks is required.'
      );
      err.status = 400;
      throw err;
    }

    // Resolve posture — may throw if landmark data is malformed.
    let resolved;
    try {
      resolved = resolvePosture({ postureLabel, landmarks });
    } catch (postureErr) {
      postureErr.status = 400;
      throw postureErr;
    }

    const { intent, toneSuggestion } = mapBehaviorToIntent(
      emotionLabel || 'neutral',
      resolved.postureLabel
    );

    res.json({
      intent,
      toneSuggestion,
      resolvedPosture: resolved.postureLabel,
      postureSource: resolved.source,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
