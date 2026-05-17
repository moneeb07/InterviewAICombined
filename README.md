# InterviewAI

InterviewAI is an end-to-end, AI-driven technical interview platform. Companies create jobs, schedule interviews, and let candidates complete multi-round assessments — coding, system design, voice-based knowledge interviews, and CV-aware final evaluation — entirely online, with AI doing the grading.

This repository is the **monorepo** that holds all three services that make up the platform:

```
InterviewAICombined/
├── InterviewAI-AIMicroservice/   # Python FastAPI — AI grading + CV parsing
├── InterviewAI-Backend/          # Node.js/Express + MongoDB — core API
└── InterviewAIClient/            # React + Vite + TypeScript — web UI
```

---

## What the platform does

From a user's point of view there are two roles:

- **Interviewers / company owners** create a company, post jobs (with the kinds of rounds the role needs — Coding, FrameworkSpecific, SystemDesign, Behavioural, KnowledgeBased), invite candidates, and review AI-generated scores and remarks.
- **Candidates** log in, upload a CV, sit each round of the interview (write code in an in-browser editor, draw a system design on a whiteboard, or talk to a voice agent for the knowledge round), and get an AI-produced final evaluation that combines all rounds with their CV against the job description.

The interesting parts are all AI-assisted:

| Round | How it's graded |
|---|---|
| Coding | Code is executed against test cases via the [Judge0](https://judge0.com/) sandbox, queued through BullMQ/Redis |
| System Design | Candidate's text answer + Excalidraw diagram (image) are sent to GPT-4o for a 0–100 grade and detailed feedback |
| Knowledge-Based | Voice interview via [Vapi](https://vapi.ai/); transcript is scored by OpenAI using structured function-calling |
| CV Parsing | PDF/image CV is OCR'd by Mistral's `mistral-ocr-latest` model into markdown |
| Final Evaluation | GPT-4.1 combines parsed CV + per-round scores + job description into one final score and hiring recommendation |

---

## How the three services fit together

```
                           ┌────────────────────────────────────┐
                           │   InterviewAIClient (React/Vite)   │
                           │  - Monaco code editor              │
                           │  - Excalidraw system-design board  │
                           │  - Vapi voice client               │
                           └──────────────┬─────────────────────┘
                                          │  REST + auth cookies
                                          ▼
                           ┌────────────────────────────────────┐
                           │  InterviewAI-Backend (Express/TS)  │
                           │  - MongoDB (users/jobs/interviews) │
                           │  - Better Auth                     │
                           │  - BullMQ queue → Judge0 worker    │
                           │  - Cloudinary for diagram uploads  │
                           └────────────┬───────────────┬───────┘
                                        │               │
                       Judge0 (code)    │               │   AI calls (CV, SD, final)
                                        ▼               ▼
                              ┌──────────────┐   ┌────────────────────────────────┐
                              │   Judge0     │   │ InterviewAI-AIMicroservice     │
                              │   sandbox    │   │ (FastAPI / Python)             │
                              └──────────────┘   │  - OpenAI (system design,      │
                                                 │    final evaluation)           │
                                                 │  - Mistral OCR (CV parsing)    │
                                                 └────────────────────────────────┘
```

The **Backend** is the single source of truth — the client never talks to the AI microservice directly. For any AI work (system-design grading, CV parsing, final evaluation), the backend POSTs to the AI microservice and persists the result back into the interview document in MongoDB. The voice interview flow is webhook-driven: Vapi calls back into the backend's `/api/end-of-call-report` endpoint with the transcript, and the backend uses OpenAI directly to score it.

---

## Tech stack at a glance

- **Frontend** — React 18, TypeScript, Vite, TailwindCSS + DaisyUI, React Router, TanStack Query, Monaco Editor, Excalidraw, Vapi web SDK, deployed on Vercel
- **Backend** — Node.js, Express, TypeScript, MongoDB (Mongoose), Better Auth, BullMQ + Redis, Cloudinary, OpenAI SDK, deployed on AWS EC2 with a CI/CD pipeline
- **AI Microservice** — Python 3.12, FastAPI, `uv` for dependency management, OpenAI SDK, Mistral SDK, Pydantic, Docker

---

## Getting started locally

Each service has its own README with detailed setup steps. The quick version:

```bash
# 1. AI microservice (port 8000)
cd InterviewAI-AIMicroservice
uv sync
uv run main.py

# 2. Backend API + code-evaluation worker (port 5000)
cd InterviewAI-Backend
npm install
npm run dev:all

# 3. Web client (port 5173)
cd InterviewAIClient
npm install
npm run dev
```

Environment variables each service needs are listed in its own README.

---

## Contributing

Open an issue or a PR against the relevant sub-project. Keep changes scoped to one service when possible — if a feature spans services (e.g. a new round type), it'll usually touch all three and the PR description should call that out so reviewers know to check end-to-end.
