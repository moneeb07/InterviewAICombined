# InterviewAI — Backend API

The core REST API for the InterviewAI platform. An **Express + TypeScript** server backed by **MongoDB** that handles users, companies, jobs, interviews, code submissions, and orchestrates calls to the [AI microservice](../InterviewAI-AIMicroservice) and external services (Judge0, Cloudinary, OpenAI, Vapi).

The web client talks only to this backend; the backend is the only thing that talks to the AI microservice and the model providers.

---

## What it does

At a high level the backend manages five resources:

- **Users** — created automatically on first login via Better Auth.
- **Companies** — each user can own companies and/or be employed at them.
- **Employees** — link users to companies with a role.
- **Jobs** — postings under a company; define which round types make up the interview (Coding, FrameworkSpecific, SystemDesign, Behavioural, KnowledgeBased), required frameworks, and a deadline.
- **Interviews** — a candidate's run-through of a job, with one entry per round, each storing its own status, score, remarks, transcripts, and submissions.

On top of those resources, it owns these flows:

- **Code submissions** — submitted code is queued in BullMQ, a worker process picks it up, ships it to **Judge0** for sandboxed execution, polls for the result, compares stdout to expected output, and updates the submission record.
- **System design grading** — the diagram is uploaded to **Cloudinary**, then the diagram URL + the candidate's text answer are posted to the AI microservice (`/api/system-design/grade`). The score and feedback go back onto the interview round.
- **CV upload and parsing** — the CV is uploaded to Cloudinary, then the URL is sent to the AI microservice (`/api/cv-parse`) which OCRs it via Mistral. The resulting markdown is stored on the interview.
- **Voice (knowledge-based) interviews** — Vapi calls a webhook (`/api/end-of-call-report`) with the transcript when the call ends. The backend evaluates the transcript directly via **OpenAI function-calling** to produce a structured score, feedback, key strengths, and areas for improvement.
- **Final evaluation** — once all rounds are complete and the CV is parsed, `PUT /api/interviews/:id/evaluate-final` ships everything to the AI microservice's `/api/interview/evaluate` endpoint and stores the final score + remarks.

Full endpoint reference lives in [docs/api.md](docs/api.md).

---

## How it's built

```
src/
├── index.ts                  # Express app, CORS, auth handler, route wiring, Vapi webhook
├── routes/                   # Express routers per resource (one file each)
├── controllers/              # Request handlers — validate, call service, return JSON
├── services/                 # Business logic
│   ├── database.service.ts   # Mongoose connection + health checks
│   ├── ai.service.ts         # HTTP client for the AI microservice
│   ├── judge0.service.ts     # Judge0 submit/poll
│   └── config.service.ts     # Typed env access
├── models/                   # Mongoose schemas (User, Company, Employee, Job, Interview, Submission)
├── lib/
│   ├── auth.ts               # Better Auth setup
│   └── queue.ts              # BullMQ queue for code-eval jobs
├── workers/
│   └── codeEvaluation.worker.ts   # Pulls jobs off the queue, runs Judge0, writes results
├── middlewares/              # logging, auth gate, error handling, 404
├── constants/                # shared constants (ports, status enums)
├── types/                    # shared TS types
└── utils/                    # logger, helpers
```

Two processes run side-by-side:

1. **API server** (`src/index.ts`) — handles HTTP requests
2. **Code-evaluation worker** (`src/workers/codeEvaluation.worker.ts`) — consumes Judge0 jobs off Redis

They share Mongo and Redis. `npm run dev:all` and `npm run start:all` boot both together.

**Stack**

- Node.js + Express + TypeScript
- MongoDB via Mongoose
- [Better Auth](https://www.better-auth.com/) — session management mounted at `/api/auth/*`
- [BullMQ](https://docs.bullmq.io/) on top of ioredis for the code submission queue
- Cloudinary for diagram/CV uploads
- OpenAI SDK (direct, for the voice-transcript scoring)
- Axios for AI-microservice calls
- `nodemon` + `ts-node` for dev, `tsc` for the production build
- `cloudflared` tunnel (via `npm run tunnel`) for exposing webhooks to Vapi during development

---

## Running locally

```bash
npm install

# API server + worker, both with hot-reload
npm run dev:all

# or one at a time
npm run dev        # API only
npm run worker     # worker only

# production-style: build then run both
npm run build
npm run start:all
```

Default port is `5000` (override with `PORT`).

### Exposing the webhook in development

Vapi needs a public URL to deliver `end-of-call-report` events. There's a helper script:

```bash
npm run tunnel    # cloudflared tunnel --url http://localhost:5000
```

Use the printed URL as the webhook target in your Vapi assistant config.

### Environment variables

Create a `.env`:

```env
PORT=5000

# Mongo
MONGODB_URI=mongodb://localhost:27017/interviewai

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth (Better Auth)
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:5000

# External services
AI_SERVICE_URL=http://localhost:8000
JUDGE0_URL=...
JUDGE0_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENAI_API_KEY=sk-...
```

CORS is currently allow-listed to the deployed client, `http://localhost:5173`, and `https://web.interview-ai.tech` in [src/index.ts](src/index.ts#L31). Add your dev origin there if needed.

---

## Deployment

Runs on **AWS EC2** with a CI/CD pipeline that builds the TypeScript output and starts both the API and the worker via `npm run start:all`. The `Makefile` contains the deploy/restart targets used by the pipeline.

---

## Contributing

A few conventions to keep in mind:

- **Routes are thin** — they wire URL → controller. No logic there.
- **Controllers validate input and call services.** Don't put DB queries in controllers; put them in services or directly behind model methods.
- **All protected routes sit behind `requireAuth`** (mounted in [src/index.ts](src/index.ts#L387)). The public routes (root, webhooks, `/health/db`) are declared before that line — order matters.
- **Long-running work goes through BullMQ**, not inline. Look at `codeEvaluation.worker.ts` for the pattern.
- **AI work goes through `services/ai.service.ts`** — don't call the AI microservice directly from a controller.

When adding a new resource: model in [src/models/](src/models/), controller in [src/controllers/](src/controllers/), route in [src/routes/](src/routes/), then mount it in [src/index.ts](src/index.ts) and document it in [docs/api.md](docs/api.md).
