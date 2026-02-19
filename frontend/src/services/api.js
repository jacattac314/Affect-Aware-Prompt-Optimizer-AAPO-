/**
 * API client — communicates with the AAPO backend.
 *
 * The `proxy` field in package.json redirects /analyze and /rewrite to
 * http://localhost:4000 during development, so paths here are relative.
 */

const BASE_URL = process.env.REACT_APP_API_URL || '';

async function post(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Asks the backend to map emotion + posture labels to a communication intent.
 *
 * @param {{ emotionLabel?: string, postureLabel?: string }} params
 * @returns {Promise<{ intent: string, toneSuggestion: string }>}
 */
export async function analyzeAPI({ emotionLabel, postureLabel }) {
  return post('/analyze', { emotionLabel, postureLabel });
}

/**
 * Asks the backend to rewrite the given prompt.
 *
 * @param {{ prompt: string, emotionLabel?: string, postureLabel?: string }} params
 * @returns {Promise<{ rewrittenPrompt: string, intent: string, toneSuggestion: string }>}
 */
export async function rewritePromptAPI({ prompt, emotionLabel, postureLabel }) {
  return post('/rewrite', { prompt, emotionLabel, postureLabel });
}
