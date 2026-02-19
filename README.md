# Affect-Aware Prompt Optimizer (AAPO)

A multi-platform application that analyzes facial expressions and body posture in real time to infer a user's emotional state and communication intent, then rewrites their text prompt accordingly using an LLM.

## Architecture Overview

```
Client (Web / Mobile / Desktop)
  ├── Camera → Face Emotion Detection (face-api.js / MediaPipe)
  ├── Posture Detection (MediaPipe Pose)
  └── Text Input
         │
         ▼
  Behavior→Intent Mapping Module
         │
         ▼
  Backend REST API (/analyze, /rewrite)
         │
         ▼
  LLM Service (OpenAI GPT-4 / Claude / Gemini)
         │
         ▼
  Rewritten Prompt → User Review → Final Submission
```

## Repository Structure

```
.
├── backend/               # Node.js/Express REST API
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── routes/        # Route handlers (/analyze, /rewrite)
│   │   ├── services/      # Business logic (emotion, LLM, mapping)
│   │   └── middleware/    # Auth, rate limiting
│   └── tests/             # Backend unit & integration tests
├── frontend/              # React web app
│   ├── public/
│   └── src/
│       ├── components/    # CameraView, EmotionOverlay, PromptEditor, RewritePreview
│       ├── hooks/         # useCamera, useEmotionDetection
│       ├── services/      # API client, emotion detection
│       ├── utils/         # Behavior-to-intent mapping
│       └── context/       # Global app state (React Context)
├── electron/              # Electron desktop wrapper
├── mobile/                # React Native mobile app
└── .github/workflows/     # CI/CD pipelines
```

## Tech Stack

| Layer | Technology |
|---|---|
| Facial Emotion | face-api.js (TensorFlow.js), DeepFace (Python) |
| Posture Detection | MediaPipe Pose |
| Frontend (Web) | React 18 |
| Frontend (Mobile) | React Native (Expo) |
| Frontend (Desktop) | Electron |
| Backend | Node.js + Express |
| LLM Integration | OpenAI GPT-4, Anthropic Claude, Google Gemini |
| Testing | Jest, React Testing Library, Supertest |
| CI/CD | GitHub Actions |

## Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 9
- An OpenAI API key (or Anthropic / Google key)

### 1. Backend

```bash
cd backend
cp .env.example .env          # fill in your LLM API key
npm install
npm run dev                   # starts on http://localhost:4000
```

### 2. Frontend (Web)

```bash
cd frontend
npm install
npm start                     # starts on http://localhost:3000
```

### 3. Desktop (Electron)

```bash
cd electron
npm install
npm start                     # opens native window pointing to the web build
```

### 4. Mobile (React Native / Expo)

```bash
cd mobile
npm install
npx expo start                # scan QR code with Expo Go
```

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for prompt rewriting |
| `ANTHROPIC_API_KEY` | (optional) Anthropic Claude API key |
| `LLM_PROVIDER` | `openai` \| `anthropic` \| `gemini` (default: `openai`) |
| `PORT` | Backend server port (default: `4000`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |

## Privacy Design

- All facial and posture analysis runs **on-device / in-browser** — no raw video or images are sent to servers.
- Only the abstracted emotion label (e.g. `"angry"`) is transmitted to the backend.
- No biometric identification; face recognition features are explicitly disabled.
- All API calls use TLS. No images or personal data are stored.

## Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Run all tests (from repo root)
npm test --workspaces
```

## 8-Week Milestone Timeline

| Week | Focus |
|---|---|
| 1 | Planning, architecture, repo setup, dependency installation |
| 2 | Facial emotion + posture detection prototype |
| 3 | Backend `/rewrite` endpoint + LLM integration |
| 4 | Frontend UI prototype (camera view + prompt editor) |
| 5 | Multi-platform support (React Native + Electron) |
| 6 | Mapping refinement, prompt engineering, unit tests |
| 7 | Integration & end-to-end testing, performance tuning |
| 8 | User testing, bug fixes, documentation, release |

## License

MIT
