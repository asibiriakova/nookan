# AGENTS.md

Frontend - a few useful commands:

```bash
cd frontend && npm install && npm run dev
cd frontend && npm run test
```

The frontend talks to the backend over HTTP via `frontend/src/api/backend.ts`, using the base
URL in `VITE_API_BASE_URL` (see `frontend/.env.example`) — defaults to `http://localhost:8000`,
so running both dev servers together with no extra config just works.

Backend (FastAPI, managed with uv) - a few useful commands:

```bash
cd backend && uv run uvicorn nookan_backend.main:app --reload
cd backend && uv run pytest
```

Regularly commit code to GitHub
