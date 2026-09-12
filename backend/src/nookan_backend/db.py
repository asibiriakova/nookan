"""In-memory mock database.

Stands in for a real persistence layer (per the task's request to mock it
for now). Data lives only for the lifetime of the process and is not
thread-safe beyond what asyncio's single-threaded event loop already gives
us. Swap this module out for a real database-backed implementation later
without touching the routers, which only depend on the functions below.
"""

from __future__ import annotations

from nookan_backend.models import Board, Card

boards: dict[str, Board] = {}
cards: dict[str, Card] = {}


def reset() -> None:
    """Clear all stored data. Used by tests to start from a clean slate."""
    boards.clear()
    cards.clear()


def get_board(board_id: str) -> Board | None:
    return boards.get(board_id)


def save_board(board: Board) -> None:
    boards[board.id] = board


def get_card(card_id: str) -> Card | None:
    return cards.get(card_id)


def save_card(card: Card) -> None:
    cards[card.id] = card


def delete_card(card_id: str) -> None:
    cards.pop(card_id, None)


def cards_for_board(board_id: str) -> list[Card]:
    return sorted(
        (c for c in cards.values() if c.board_id == board_id),
        key=lambda c: c.position,
    )
