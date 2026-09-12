"""Database-backed persistence layer.

Backed by SQLite by default, configurable via the `DATABASE_URL` env var
(see `config.py`). This module is the only place that knows about ORM rows
vs. the Pydantic models the rest of the app uses — the routers only depend
on the functions below, which take/return `models.Board`/`models.Card`, so
they stay database-agnostic (and untouched if we swap SQLite for Postgres
later; see `database.py`).
"""

from __future__ import annotations

from nookan_backend.database import Base, SessionLocal, engine
from nookan_backend.models import Board, Card, CardStatus
from nookan_backend.orm_models import BoardRow, CardRow

Base.metadata.create_all(bind=engine)


def reset() -> None:
    """Clear all stored data. Used by tests to start from a clean slate."""
    with SessionLocal() as session:
        session.query(CardRow).delete()
        session.query(BoardRow).delete()
        session.commit()


def _board_from_row(row: BoardRow) -> Board:
    return Board(id=row.id, title=row.title, created_at=row.created_at, updated_at=row.updated_at)


def _card_from_row(row: CardRow) -> Card:
    return Card(
        id=row.id,
        board_id=row.board_id,
        title=row.title,
        status=CardStatus(row.status),
        position=row.position,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def get_board(board_id: str) -> Board | None:
    with SessionLocal() as session:
        row = session.get(BoardRow, board_id)
        return _board_from_row(row) if row is not None else None


def save_board(board: Board) -> None:
    with SessionLocal() as session:
        row = session.get(BoardRow, board.id)
        if row is None:
            row = BoardRow(id=board.id)
            session.add(row)
        row.title = board.title
        row.created_at = board.created_at
        row.updated_at = board.updated_at
        session.commit()


def get_card(card_id: str) -> Card | None:
    with SessionLocal() as session:
        row = session.get(CardRow, card_id)
        return _card_from_row(row) if row is not None else None


def save_card(card: Card) -> None:
    with SessionLocal() as session:
        row = session.get(CardRow, card.id)
        if row is None:
            row = CardRow(id=card.id)
            session.add(row)
        row.board_id = card.board_id
        row.title = card.title
        row.status = card.status.value
        row.position = card.position
        row.created_at = card.created_at
        row.updated_at = card.updated_at
        session.commit()


def delete_card(card_id: str) -> None:
    with SessionLocal() as session:
        row = session.get(CardRow, card_id)
        if row is not None:
            session.delete(row)
            session.commit()


def cards_for_board(board_id: str) -> list[Card]:
    with SessionLocal() as session:
        rows = (
            session.query(CardRow)
            .filter(CardRow.board_id == board_id)
            .order_by(CardRow.position)
            .all()
        )
        return [_card_from_row(row) for row in rows]
