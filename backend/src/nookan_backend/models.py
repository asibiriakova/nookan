"""Pydantic schemas mirroring the shapes in openapi.yaml."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class CardStatus(str, Enum):
    """Fixed 4-stage Kanban pipeline (spec §3.2). Not user-configurable."""

    BACKLOG = "BACKLOG"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    DONE = "DONE"


class Board(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class Card(BaseModel):
    id: str
    board_id: str
    title: str
    status: CardStatus
    position: float
    created_at: str
    updated_at: str


class BoardWithCards(Board):
    cards: list[Card]


class CreateBoardResponse(BaseModel):
    id: str
    url: str


class CreateBoardRequest(BaseModel):
    title: str | None = None


class UpdateBoardRequest(BaseModel):
    title: str | None = None


class CreateCardRequest(BaseModel):
    title: str
    status: CardStatus
    position: float = Field(..., description="Fractional rank determining order within the column.")


class UpdateCardRequest(BaseModel):
    title: str | None = None
    status: CardStatus | None = None
    position: float | None = None


class Error(BaseModel):
    error: str
