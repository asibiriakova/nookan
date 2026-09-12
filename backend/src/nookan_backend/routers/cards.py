from __future__ import annotations

from fastapi import APIRouter, Response

from nookan_backend import db, utils
from nookan_backend.errors import NotFoundError
from nookan_backend.models import Card, CreateCardRequest, UpdateCardRequest

router = APIRouter(tags=["cards"])


@router.post("/boards/{board_id}/cards", status_code=201, response_model=Card)
def create_card(board_id: str, body: CreateCardRequest) -> Card:
    if db.get_board(board_id) is None:
        raise NotFoundError("Board")
    ts = utils.now()
    card = Card(
        id=utils.new_id(),
        board_id=board_id,
        title=body.title,
        status=body.status,
        position=body.position,
        created_at=ts,
        updated_at=ts,
    )
    db.save_card(card)
    board = db.get_board(board_id)
    if board is not None:
        board.updated_at = ts
        db.save_board(board)
    return card


@router.patch("/cards/{card_id}", response_model=Card)
def update_card(card_id: str, body: UpdateCardRequest) -> Card:
    card = db.get_card(card_id)
    if card is None:
        raise NotFoundError("Card")
    if body.title is not None:
        card.title = body.title
    if body.status is not None:
        card.status = body.status
    if body.position is not None:
        card.position = body.position
    ts = utils.now()
    card.updated_at = ts
    db.save_card(card)
    board = db.get_board(card.board_id)
    if board is not None:
        board.updated_at = ts
        db.save_board(board)
    return card


@router.delete("/cards/{card_id}", status_code=204, response_class=Response)
def delete_card(card_id: str) -> Response:
    card = db.get_card(card_id)
    if card is None:
        raise NotFoundError("Card")
    db.delete_card(card_id)
    board = db.get_board(card.board_id)
    if board is not None:
        board.updated_at = utils.now()
        db.save_board(board)
    return Response(status_code=204)
