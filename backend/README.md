# Nookan backend

FastAPI implementation of the REST API described in
[../openapi.yaml](../openapi.yaml). Managed with [uv](https://docs.astral.sh/uv/).

Persistence is currently an in-memory mock ([src/nookan_backend/db.py](src/nookan_backend/db.py))
— data resets on every restart. It's isolated behind a small set of
functions so it can be swapped for a real database later without touching
the routers.

## Commands

```bash
cd backend
uv run uvicorn nookan_backend.main:app --reload   # run the dev server (http://localhost:8000)
uv run pytest                                     # run the tests
```

## Layout

```text
src/nookan_backend/
  main.py           FastAPI app, CORS, error handling
  routers/boards.py /boards endpoints
  routers/cards.py  /cards endpoints
  models.py         Pydantic request/response schemas
  db.py             In-memory mock database
  errors.py         NotFoundError -> 404 {"error": ...}
  utils.py          id generation, timestamps, title normalization
tests/              pytest suite, one file per resource
```
