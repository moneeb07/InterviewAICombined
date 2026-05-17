# InterviewAI - AI Microservice

The AI brain of the InterviewAI platform. A small, focused **FastAPI** service that the main backend calls whenever it needs an LLM or OCR result: grading system-design submissions, parsing CVs, and producing the final interview evaluation.

It is intentionally stateless - it owns no database. Inputs come in over HTTP, the service calls the appropriate model provider (OpenAI or Mistral), and structured output goes back to the caller.

---

## What it does

Three HTTP endpoints, one per AI capability:

### `POST /api/system-design/grade`
Grades a candidate's system-design answer (text + an optional diagram image URL) against the problem statement. Uses **OpenAI GPT-4o** with Pydantic-based structured output to return a `{ grade: 0-100, feedback: string }`.

The prompt is deliberately strict - empty submissions get a 0, and the rubric is "be very critical." Multiple questions in a single request are graded as one combined conversation so the model can weigh trade-offs across answers.

### `POST /api/cv-parse`
Takes a URL to a CV (PDF/image) and uses **Mistral's `mistral-ocr-latest`** OCR model to extract the content as markdown. The output is then used downstream by the final-evaluation endpoint and shown back to the candidate.

### `POST /api/interview/evaluate`
The final round of the funnel. Takes everything the platform knows about a completed interview - job description, role, frameworks, the parsed CV, and the per-round scores and remarks - and asks **GPT-4.1** to produce a final 0–100 score plus detailed remarks including strengths, weaknesses, and a hiring recommendation.

All three endpoints return Pydantic models, so the calling backend gets typed JSON.

---

## How it's built

```
main.py                       # FastAPI app, CORS, route definitions
├── services/
│   ├── system_design.py      # SystemDesignService → OpenAI Responses API
│   ├── cv_parse.py           # CVParseService     → Mistral OCR
│   └── final_interview_evaluator.py  # FinalInterviewEvaluator → OpenAI
└── services_types/           # Pydantic request/response models per service
    ├── system_design.py
    ├── cv_parser.py
    └── final_interview.py
```

Each service is a class instantiated per request with the API key from env vars. This keeps the service easy to test (swap in a fake client in `__init__`) and avoids holding model clients in module-level singletons.

**Stack**

- Python 3.12
- [FastAPI](https://fastapi.tiangolo.com/) (with `[standard]` extras for the dev server)
- [`uv`](https://github.com/astral-sh/uv) for dependency management - much faster than pip
- [`openai`](https://github.com/openai/openai-python) for system-design and final-evaluation grading
- [`mistralai`](https://github.com/mistralai/client-python) for CV OCR
- [`python-dotenv`](https://github.com/theskumar/python-dotenv) for local env loading

---

## Running locally

```bash
# install dependencies (creates .venv automatically)
uv sync

# run the dev server with hot-reload (set ENV=dev for reload)
uv run main.py
# → http://localhost:8000
```

FastAPI's interactive docs are at `http://localhost:8000/docs`.

### Environment variables

Create a `.env` in this directory:

```env
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
ENV=dev              # enables uvicorn --reload
TEST_VARIABLE=anything   # just printed on startup, useful for sanity-checking deploys
```

---

## Running with Docker

A `Dockerfile` is included - uses the official `python:3.12-slim` image, installs `uv`, syncs the locked dependencies, and runs `main.py` on port 8000.

```bash
docker build -t interviewai-ai .
docker run --env-file .env -p 8000:8000 interviewai-ai
```

---

## Deployment

The service is deployed via a CI/CD pipeline and is intended to run on a small container host. The backend reaches it via the `AI_SERVICE_URL` environment variable on the backend side. CORS is currently set to `allow_origins=["*"]` for ease of development - **lock this down to the backend's origin before going to production.**

---

## Contributing

If you're adding a new AI capability:

1. Drop a new file in [services/](services/) with a small class that owns the model client and prompt.
2. Add matching Pydantic input/output models in [services_types/](services_types/).
3. Wire it up as a route in [main.py](main.py) returning the Pydantic output model.

Keep services single-purpose - the backend can chain them if a flow needs more than one.
