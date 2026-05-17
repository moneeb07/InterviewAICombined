# InterviewAI - Web Client

The web frontend for the InterviewAI platform - a **React + TypeScript + Vite** single-page app. It's what candidates and interviewers actually use: dashboards, job boards, scheduling, the in-browser code editor, the system-design whiteboard, and the voice-interview client.

It talks to the [Backend API](../InterviewAI-Backend) and never to the AI microservice or model providers directly.

---

## What it does

The app has two main personas with their own dashboards (both mounted under [src/App.tsx](src/App.tsx)):

### `/employee` - interviewer / company owner
- Create companies and invite employees
- Post jobs with configurable round types, required frameworks, and deadlines
- View candidate lists per job, schedule interviews, edit round-level details
- Drill into a specific interview / round to see scores, transcripts, code submissions, and AI remarks

### `/candidate` - interviewee
- See interviews you've been invited to
- Upload a CV (which gets OCR'd into markdown by the AI microservice)
- Sit each round of the interview:
  - **Coding** ([CodingProblem.tsx](src/pages/CodingProblem.tsx)) - Monaco code editor, language picker, run-against-test-cases
  - **System Design** ([SystemDesign.tsx](src/pages/SystemDesign.tsx)) - Excalidraw whiteboard + text answer, submit for AI grading
  - **Knowledge-Based** ([KnowledgeBasedInterviewPage.tsx](src/pages/KnowledgeBasedInterviewPage.tsx)) - voice call with a Vapi agent that's later transcribed and scored
- View final results once all rounds are completed and evaluated

Plus the public marketing pages: Landing, Features, Pricing, About, Contact.

---

## How it's built

```
src/
├── App.tsx                  # Top-level routes + theme state
├── main.tsx                 # ReactDOM + providers
├── pages/                   # One component per top-level route
├── components/              # Feature-grouped UI (Auth, Candidate, Company, Employee, Interview, Job, Landing, Voice, common, layout)
├── services/                # API clients - one file per backend resource
│   ├── api.ts               # Axios instance with auth credentials
│   ├── cvService.ts
│   ├── systemDesign.ts
│   ├── bulkCandidateUpload.ts
│   └── ...
├── contexts/                # React contexts (e.g. CompanyContext)
├── hooks/                   # Custom hooks (e.g. data-fetching wrappers around TanStack Query)
├── lib/                     # Lower-level helpers (auth client, query client setup)
├── types/                   # Shared TS types
├── data/                    # Static seed data (e.g. system design question pool)
└── utils/                   # Misc helpers
```

A few things worth knowing:

- **Routing** is React Router v7. Public routes are wrapped in `MainLayout`; authenticated dashboards in `DashboardLayout` and gated by `PrivateRoute`. See [src/App.tsx](src/App.tsx).
- **Data fetching** is TanStack Query on top of an axios instance configured with `withCredentials: true` so the Better Auth session cookie travels with every request.
- **Theming** is DaisyUI's data-theme attribute toggled between `lemonade` (light) and `forest` (dark), persisted to `localStorage`.
- **Form handling** is React Hook Form + Zod for validation.
- **Coding round** uses `@monaco-editor/react` - the Monaco editor that powers VS Code in the browser.
- **System design round** uses `@excalidraw/excalidraw` for the whiteboard, then exports the drawing as an image alongside the candidate's text answer.
- **Knowledge-based round** uses `@vapi-ai/web` to start a voice session with a Vapi assistant. When the call ends, Vapi calls back into the backend (not the client) with the transcript.
- **Bulk candidate upload** parses CSVs in-browser with `papaparse`.
- **Markdown rendering** (for parsed CVs, AI feedback, etc.) uses `react-markdown` with `remark-gfm`.
- **Charts** on the dashboards use `recharts`.

**Stack**

- React 18 + TypeScript
- Vite 6 (with `@vitejs/plugin-react-swc`)
- TailwindCSS 4 + DaisyUI 5
- TanStack Query, React Hook Form, Zod
- React Router 7
- Monaco Editor, Excalidraw, Vapi Web SDK
- Framer Motion for animations
- ESLint (flat config) + TypeScript strict mode

---

## Running locally

```bash
npm install
npm run dev       # vite dev server on http://localhost:5173
```

Other scripts:

```bash
npm run build     # tsc -b && vite build
npm run preview   # serve the production build
npm run lint      # eslint
```

### Environment variables

Create `.env.local`:

```env
VITE_API_URL=http://localhost:5000     # backend
VITE_VAPI_PUBLIC_KEY=...                # Vapi web SDK public key
VITE_VAPI_ASSISTANT_ID=...              # assistant configured to conduct the knowledge round
```

The backend's CORS allowlist already includes `http://localhost:5173`, so cookies work out of the box for local development.

---

## Deployment

The client deploys to **Vercel** - config is in [vercel.json](vercel.json). The production origin is `https://interview-ai-client-nine.vercel.app` (with `https://web.interview-ai.tech` as the custom domain). Both are in the backend's CORS allowlist.

---

## Contributing

- **New page?** Add a component to [src/pages/](src/pages/) and wire it into [src/App.tsx](src/App.tsx). Put it under the right layout (`MainLayout` for public, `DashboardLayout` for app), and wrap in `PrivateRoute` if it needs auth.
- **New backend resource?** Add a service file in [src/services/](src/services/) that uses the shared axios instance - don't import axios directly in components.
- **Shared UI?** Drop it under [src/components/common/](src/components/common/). Feature-specific components belong in `src/components/<Feature>/`.
- **Styling** uses Tailwind utility classes + DaisyUI components. Keep theme tokens (`bg-base-100`, `text-base-content`, `btn-primary`, etc.) so both themes stay consistent.
