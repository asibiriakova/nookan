"""Database configuration.

Reads `DATABASE_URL` from the environment to decide which database the
server connects to. Defaults to a local SQLite file so the dev server and
tests work out of the box with no setup, mirroring the frontend's
`VITE_API_BASE_URL` convention (see AGENTS.md).

Any SQLAlchemy-supported URL works here with no code changes elsewhere,
e.g. `postgresql+psycopg://user:pass@host/dbname` for Postgres — just set
`DATABASE_URL` and install that database's driver package. See `database.py`
for where this is consumed.
"""

from __future__ import annotations

import os
from pathlib import Path

# backend/nookan.db — alongside pyproject.toml, gitignored.
_DEFAULT_SQLITE_PATH = Path(__file__).resolve().parent.parent.parent / "nookan.db"
_DEFAULT_DATABASE_URL = f"sqlite:///{_DEFAULT_SQLITE_PATH}"

DATABASE_URL = os.environ.get("DATABASE_URL", _DEFAULT_DATABASE_URL)
