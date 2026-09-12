from __future__ import annotations

from fastapi import APIRouter

from nookan_backend import db, utils
from nookan_backend.errors import NotFoundError
from nookan_backend.models import (
    Board,
    BoardWithCards,
    CreateBoardRequest,
    CreateBoardResponse,
    UpdateBoardRequest,
)

router = APIRouter(tags=["boards"])


@router.post("/boards", status_code=201, response_model=CreateBoardResponse)
def create_board(body: CreateBoardRequest | None = None) -> CreateBoardResponse:
    board_id = utils.new_id()
    ts = utils.now()
    title = utils.normalize_title(body.title if body else None)
    db.save_board(Board(id=board_id, title=title, created_at=ts, updated_at=ts))
    return CreateBoardResponse(id=board_id, url=f"/b/{board_id}")


@router.get("/boards/{board_id}", response_model=BoardWithCards)
def get_board(board_id: str) -> BoardWithCards:
    board = db.get_board(board_id)
    if board is None:
        raise NotFoundError("Board")
    cards = db.cards_for_board(board_id)
    return BoardWithCards(**board.model_dump(), cards=cards)


@router.patch("/boards/{board_id}", response_model=Board)
def update_board(board_id: str, body: UpdateBoardRequest) -> Board:
    board = db.get_board(board_id)
    if board is None:
        raise NotFoundError("Board")
    if body.title is not None:
        board.title = utils.normalize_title(body.title)
    board.updated_at = utils.now()
    db.save_board(board)
    return board
