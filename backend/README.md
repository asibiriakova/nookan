# Nookan backend

FastAPI implementation of the REST API described in
[../openapi.yaml](../openapi.yaml). Managed with [uv](https://docs.astral.sh/uv/).

Persistence is via [SQLAlchemy](https://www.sqlalchemy.org/), defaulting to a local
SQLite file (`backend/nookan.db`) so the commands below work with no setup. Which
database to use is controlled by the `DATABASE_URL` env var (see
[.env.example](.env.example)) — any SQLAlchemy-supported URL works with no code
changes, e.g. Postgres, as long as that database's driver package is installed.

## Commands

```bash
cd backend
uv run uvicorn nookan_backend.main:app --reload   # run the dev server (http://localhost:8000)
uv run pytest                                     # run the tests
uv run ruff check .                               # lint
uv run ruff format .                              # format

# to use a non-default database, copy .env.example to .env, adjust it, then:
uv run --env-file .env uvicorn nookan_backend.main:app --reload
```

## Layout

```text
src/nookan_backend/
  main.py           FastAPI app, CORS, error handling
  routers/boards.py /boards endpoints
  routers/cards.py  /cards endpoints
  models.py         Pydantic request/response schemas
  orm_models.py     SQLAlchemy ORM models (on-disk shape)
  db.py             Persistence layer routers call (ORM <-> Pydantic)
  database.py       SQLAlchemy engine/session setup
  config.py         DATABASE_URL env var handling
  errors.py         NotFoundError -> 404 {"error": ...}
  utils.py          id generation, timestamps, title normalization
tests/              pytest suite, one file per resource
```
