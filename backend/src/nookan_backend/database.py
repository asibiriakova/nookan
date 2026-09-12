"""SQLAlchemy engine/session setup.

This is the only module that needs to know which database backend is in
use. Everything above it (`db.py`, `orm_models.py`, and the routers) talks
to the database exclusively through SQLAlchemy's engine and ORM, so
swapping SQLite for Postgres (or anything else SQLAlchemy supports) is a
matter of changing `DATABASE_URL` — see `config.py`.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from nookan_backend.config import DATABASE_URL

# SQLite connections are single-threaded by default and refuse to be reused
# across threads; FastAPI runs sync path operations in a thread pool, so
# pooled connections do get handed between threads. Other backends (e.g.
# Postgres) don't understand this argument, so only pass it for SQLite.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)

# expire_on_commit=False lets db.py hand back ORM objects (or values copied
# from them) after the session that loaded them has been closed.
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
