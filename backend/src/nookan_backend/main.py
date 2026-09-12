"""FastAPI application implementing the contract in openapi.yaml.

Persistence is currently an in-memory mock (see `db.py`); swap that module
out for a real database later without touching the routers.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from nookan_backend.errors import NotFoundError
from nookan_backend.routers import boards, cards

app = FastAPI(
    title="Nookan (Mini Kanban Board) API",
    version="1.0",
)

# No auth in this app (see openapi.yaml's "Authentication" note) — the board
# id itself is the secret, so a permissive CORS policy doesn't weaken access
# control. Restrict this if that ever changes.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"error": exc.message})


app.include_router(boards.router, prefix="/api/v1")
app.include_router(cards.router, prefix="/api/v1")


def main() -> None:
    import uvicorn

    uvicorn.run("nookan_backend.main:app", host="0.0.0.0", port=8000, reload=True)
