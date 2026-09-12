# nookan

Mini Kanban board, with a FastAPI backend and a Vite/React frontend.

- `backend/` — FastAPI service implementing [openapi.yaml](openapi.yaml), managed with [uv](https://docs.astral.sh/uv/).
- `frontend/` — Vite/React app that talks to the backend over HTTP.

## Quickstart

```bash
# Backend
cd backend && uv run uvicorn nookan_backend.main:app --reload

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

The frontend defaults to `http://localhost:8000` for the backend base URL, so running both dev
servers together with no extra config just works. See [AGENTS.md](AGENTS.md) for more commands
(tests, env config) and further details.
