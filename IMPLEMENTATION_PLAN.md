# Implementation Plan: Multi-Platform Emotion-Aware Prompt Rewriting App

## System Architecture Overview

The application consists of four tiers:

1. **Client App** (web/mobile/desktop) — captures user video (camera) and text input.
2. **Local/Edge Detector** — analyzes facial expression and body posture on-device.
3. **Mapping Module** — interprets detected signals as communication intent.
4. **LLM Rewriting Service** — rewrites the user's prompt based on inferred intent.

### Typical Request Flow

```
Camera frames ──► FaceEmotion Detector ──► EmotionLabel
                                                │
Posture frames ─► MediaPipe Pose Detector ──► PostureLabel
                                                │
                                         BehaviorMapper
                                                │
User text ──────────────────────────────► /rewrite API
                                                │
                                           LLM (GPT-4)
                                                │
                                       Rewritten Prompt
                                                │
                                       User Confirms/Edits
```

This multi-tier design separates real-time analysis from LLM processing and allows code reuse across platforms.

---

## Technology Selection

### Facial Expression Detection

- **face-api.js** (TensorFlow.js) — in-browser emotion recognition.
  - Pre-trained "face expression" model (~310 KB), lightweight and fast.
  - API: `faceapi.detectSingleFace(video).withFaceExpressions()`
  - Returns probability scores for: `happy`, `sad`, `angry`, `surprised`, `neutral`, `fearful`, `disgusted`.
- **DeepFace** (Python, MIT) — server-side alternative.
  - `DeepFace.analyze(img, actions=['emotion'])` returns dominant emotion.
- **FER** (Python, MIT) — simple server-side detector.
  - `FER().detect_emotions(img)` returns per-emotion probabilities.

### Body Posture Detection

- **MediaPipe Pose** (Google) — 33 3D body landmarks in real time.
  - Landmarks include: shoulders, elbows, wrists, hips, knees, ankles, head.
  - Heuristics on landmark angles determine posture class (slouching, upright, crossed-arms).
  - Runs on CPU; available as Python library or via TensorFlow.js.

### Cross-Platform UI

| Target | Technology |
|---|---|
| Web | React 18 |
| Mobile (iOS/Android) | React Native (Expo) |
| Desktop | Electron (embeds Chromium + Node.js) |

React Native shares component logic with the web React app. Electron wraps the production web build into a native desktop window. A Flutter-based approach is also viable from a single Dart codebase.

### Backend

- **Node.js + Express** for the REST API.
  - `/analyze` — accepts image or pre-analyzed emotion data; returns classification.
  - `/rewrite` — accepts original prompt + metadata (emotion, posture tags); returns rewritten prompt.
- Stateless design; session state kept in-memory or via a lightweight store.
- HTTPS for all endpoints.

### LLM / Prompt Rewriting

- **OpenAI GPT-4** (primary) — strong text rewriting, easy API integration.
- **Anthropic Claude** or **Google Gemini** — drop-in alternatives via their SDKs.
- The backend sends a system message that includes the inferred emotional context plus the original prompt; the model returns a rewritten version that preserves intent while adjusting tone.

---

## Building Steps

### Step 1 — Emotion Detection (Facial Expression)

1. Load face-api.js models at app start (`tinyFaceDetector`, `faceExpressionNet`).
2. Stream camera via `getUserMedia` → `<video>` element.
3. On each animation frame: `faceapi.detectSingleFace(video).withFaceExpressions()`.
4. Extract the top emotion above a confidence threshold (default 0.5).
5. Emit `emotionChanged(label)` event to the mapping module.

### Step 2 — Posture Detection (Body Language)

1. Load MediaPipe Pose (Python side) or `@mediapipe/pose` (JS side).
2. Feed each video frame to the pose estimator.
3. Extract key angles:
   - **Slouch angle**: angle between neck landmark and vertical axis.
   - **Crossed-arms**: distance between left wrist and right shoulder vs. right wrist and left shoulder.
   - **Head-down**: y-position of nose relative to shoulder midpoint.
4. Apply threshold rules → output posture label: `upright | slouching | crossed-arms | head-down`.
5. Combine with facial emotion in the mapping module.

### Step 3 — Behavior → Intent Mapping

```
Emotion × Posture → CommunicationIntent
─────────────────────────────────────────
angry    × slouching     → FRUSTRATED
angry    × upright       → ASSERTIVE
sad      × head-down     → DISCOURAGED
happy    × upright       → ENTHUSIASTIC
neutral  × crossed-arms  → GUARDED
neutral  × upright       → NEUTRAL
fearful  × slouching     → ANXIOUS
```

The mapping outputs a `tone_suggestion` string (e.g. `"calm explanatory"`) and an optional `system_tag` (e.g. `[USER_FRUSTRATED]`) that is prepended to the LLM system prompt.

### Step 4 — Prompt Rewriting (LLM)

System prompt template:

```
You are an expert prompt engineer. Rewrite the following user query to better
match their inferred emotional state and communication intent. Preserve the
original meaning exactly. Adjust only the tone and phrasing.

Inferred state: {{tone_suggestion}}
Original prompt: {{user_prompt}}

Return only the rewritten prompt. Do not add explanations.
```

The backend substitutes `{{tone_suggestion}}` and `{{user_prompt}}`, calls the LLM API, and returns the result.

### Step 5 — Frontend UI

**Screens / Components:**

| Component | Responsibility |
|---|---|
| `CameraView` | Renders live video; draws face/pose overlays on canvas |
| `EmotionOverlay` | Displays detected emotion label + confidence badge |
| `PromptEditor` | Textarea for the user's original prompt |
| `RewritePreview` | Displays rewritten prompt; Accept / Re-run / Edit buttons |
| `AppContext` | Holds global state: emotion, posture, originalPrompt, rewrittenPrompt |

**Platform handling:**
- Web: HTML5 `<video>` + `getUserMedia`.
- Mobile: `expo-camera` or `react-native-camera`.
- Desktop: Electron main process passes camera permissions; renderer uses same web code.

### Step 6 — Backend Services

**Endpoints:**

```
POST /analyze
  Body: { imageBase64?: string, emotionLabel?: string, postureLabel?: string }
  Response: { intent: string, toneSuggestion: string }

POST /rewrite
  Body: { prompt: string, intent: string, toneSuggestion: string }
  Response: { rewrittenPrompt: string }

GET /health
  Response: { status: "ok" }
```

**LLM provider abstraction:**

```js
// services/llmService.js
async function rewritePrompt(originalPrompt, toneSuggestion, provider = 'openai') {
  if (provider === 'openai')    return callOpenAI(originalPrompt, toneSuggestion);
  if (provider === 'anthropic') return callAnthropic(originalPrompt, toneSuggestion);
  if (provider === 'gemini')    return callGemini(originalPrompt, toneSuggestion);
}
```

### Step 7 — Integration & Flow

1. App launches → models load in the background.
2. User types a prompt; camera runs continuously.
3. Emotion/posture state is updated every ~500 ms.
4. User clicks **"Improve My Prompt"**:
   - Snapshot current emotion + posture labels.
   - POST to `/rewrite` with prompt + labels.
   - Display spinner.
5. Rewritten prompt appears in `RewritePreview`.
6. User clicks **Accept** → rewritten prompt is copied to clipboard or forwarded to the target LLM.

---

## Privacy Considerations

- Facial and posture analysis runs entirely **in-browser / on-device**.
- No raw video frames or images are transmitted to the server.
- Only the abstracted label (e.g. `"angry"`) crosses the network.
- Labels are used transiently and never persisted.
- No face recognition or biometric identification.
- All API calls use TLS (HTTPS).
- Server logs contain only prompt metadata, never images or personal text.

---

## Testing Strategy

### Unit Tests

- `behaviorMapping.test.js` — verify all emotion × posture combinations produce the correct intent.
- `llmService.test.js` — mock the OpenAI SDK; verify system prompt construction.
- `PromptEditor.test.jsx` — verify textarea renders, character count works, submit fires.
- `EmotionOverlay.test.jsx` — verify correct label and emoji render for each emotion.

### Integration Tests

- `rewrite.integration.test.js` — POST to `/rewrite` with a real prompt + mock LLM; verify response shape.
- `analyze.integration.test.js` — POST to `/analyze` with a test emotion label; verify intent output.
- Cypress E2E — simulate camera grant, type a prompt, click Improve, assert rewritten text appears.

### Performance Tests

- face-api.js runs at ≥ 15 fps on a mid-range laptop.
- `/rewrite` endpoint responds within 3 s under normal LLM API conditions.
- Electron memory footprint < 300 MB at idle.

### Security Checks

- API keys never exposed in client bundle (server-side only).
- CORS restricted to known origins.
- Input validation on all backend endpoints (max prompt length, required fields).

---

## Timeline & Milestones (8 Weeks)

| Week | Deliverable |
|---|---|
| **1** | Repo setup, architecture finalized, dependencies installed, CI skeleton |
| **2** | face-api.js emotion demo + MediaPipe posture prototype; mapping rules drafted |
| **3** | Backend `/rewrite` endpoint live; LLM call verified; mocked unit tests passing |
| **4** | Frontend prototype: camera view + emotion overlay + prompt editor + rewrite display |
| **5** | React Native mobile build; Electron desktop wrapper; shared component library |
| **6** | Mapping refinement; prompt templates tuned; unit test coverage ≥ 80% |
| **7** | Integration tests; Cypress E2E; performance profiling; bug fixes |
| **8** | User acceptance testing; final bug fixes; docs; release builds for web/mobile/desktop |

---

## Team Roles & Responsibilities

| Role | Responsibilities |
|---|---|
| **Project Lead / Architect** | Overall design, tech choices, timeline, cross-team coordination |
| **Frontend Developer(s)** | React / React Native UI, camera integration, face-api.js, UX |
| **ML Engineer** | Emotion/posture detection, library evaluation, mapping heuristics |
| **Backend Developer** | REST API, LLM integration, session state, security |
| **QA / Tester** | Unit + integration + E2E tests, privacy/security checks |
| **DevOps** | CI/CD pipelines, containerization, release packaging |

---

## References

1. face-api.js — "face expression recognition model is lightweight, fast and provides reasonable accuracy."
2. DeepFace — supports facial expression (emotion) analysis via `DeepFace.analyze()`.
3. FER — `FER().detect_emotions(img)` returns per-class emotion probabilities.
4. MediaPipe Pose — renders 33 3D landmarks for full-body tracking.
5. React Native — "Create native apps for Android, iOS, and more using React."
6. Electron — "Electron apps run natively on macOS, Windows, and Linux."
7. Flutter — open-source framework for multi-platform apps from a single codebase.
8. Prompt-rewriting research — "Rephrasing ineffective prompts can elicit better responses while preserving the user's original intent."
9. MorphCast privacy model — "Emotional analysis is performed entirely within the user's browser, with no images or personal data being sent to external servers."
10. Atlassian testing guide — unit tests focus on individual methods; integration tests verify different modules working together.
