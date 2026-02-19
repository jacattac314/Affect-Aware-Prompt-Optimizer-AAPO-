/**
 * API client — communicates with the AAPO backend.
 *
 * The `proxy` field in package.json redirects /analyze and /rewrite to
 * http://localhost:4000 during development, so paths here are relative.
 *
 * Every request is tagged with an X-Request-Id header (UUID v4) so that
 * errors surfaced in the UI can be correlated with backend logs.
 */

const BASE_URL = process.env.REACT_APP_API_URL || '';

/** Generates a UUID v4 using the Web Crypto API (available in all modern browsers). */
function newRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments where randomUUID is unavailable (e.g. tests).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function post(path, body) {
  const requestId = newRequestId();

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const serverRequestId = response.headers.get('X-Request-Id') || requestId;
    const err = new Error(payload.error || `Request failed with status ${response.status}`);
    err.requestId = serverRequestId;
    throw err;
  }

  return response.json();
}

/**
 * Asks the backend to map emotion + posture labels to a communication intent.
 *
 * @param {{ emotionLabel?: string, postureLabel?: string }} params
 * @returns {Promise<{ intent: string, toneSuggestion: string, resolvedPosture: string }>}
 */
export async function analyzeAPI({ emotionLabel, postureLabel }) {
  return post('/analyze', { emotionLabel, postureLabel });
}

/**
 * Asks the backend to rewrite the given prompt using the current affective state.
 *
 * @param {{ prompt: string, emotionLabel?: string, postureLabel?: string }} params
 * @returns {Promise<{ rewrittenPrompt: string, intent: string, toneSuggestion: string }>}
 */
export async function rewritePromptAPI({ prompt, emotionLabel, postureLabel }) {
  return post('/rewrite', { prompt, emotionLabel, postureLabel });
}
