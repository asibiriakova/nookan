// ---------------------------------------------------------------------------
// Centralized backend client.
//
// EVERY call the frontend makes to the backend goes through this module.
// Right now it's implemented as an in-browser mock (localStorage-backed, with
// simulated network latency) so the app is fully interactive without a real
// server. The function signatures and returned shapes mirror the REST API
// in _docs/specs.md §4.2 one-to-one, so swapping the mock body for real
// `fetch()` calls later should not require touching any calling code:
//
//   POST   /api/v1/boards                  -> createBoard()
//   GET    /api/v1/boards/{board_id}        -> getBoard()
//   PATCH  /api/v1/boards/{board_id}        -> updateBoard()
//   POST   /api/v1/boards/{board_id}/cards  -> createCard()
//   PATCH  /api/v1/cards/{card_id}          -> updateCard()
//   DELETE /api/v1/cards/{card_id}          -> deleteCard()
// ---------------------------------------------------------------------------

import { nanoid } from 'nanoid';
import type { Board, BoardWithCards, Card, CardStatus } from './types';

const DB_KEY = 'nookan_mock_db_v1';
const MIN_LATENCY_MS = 150;
const MAX_LATENCY_MS = 450;

interface Db {
  boards: Record<string, Board>;
  cards: Record<string, Card>;
}

function emptyDb(): Db {
  return { boards: {}, cards: {} };
}

function readDb(): Db {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Db;
    return { boards: parsed.boards ?? {}, cards: parsed.cards ?? {} };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: Db): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function delay<T>(value: T): Promise<T> {
  const ms = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function now(): string {
  return new Date().toISOString();
}

class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

/** POST /api/v1/boards */
export async function createBoard(title?: string): Promise<{ id: string; url: string }> {
  const db = readDb();
  const id = nanoid(21); // 21-char NanoID ~= 128 bits of entropy, per spec §5.
  const ts = now();
  db.boards[id] = {
    id,
    title: title?.trim() || 'Untitled Board',
    created_at: ts,
    updated_at: ts,
  };
  writeDb(db);
  return delay({ id, url: `/b/${id}` });
}

/** GET /api/v1/boards/{board_id} */
export async function getBoard(boardId: string): Promise<BoardWithCards> {
  const db = readDb();
  const board = db.boards[boardId];
  if (!board) {
    await delay(undefined);
    throw new NotFoundError('Board');
  }
  const cards = Object.values(db.cards)
    .filter((c) => c.board_id === boardId)
    .sort((a, b) => a.position - b.position);
  return delay({ ...board, cards });
}

/** PATCH /api/v1/boards/{board_id} */
export async function updateBoard(boardId: string, patch: { title?: string }): Promise<Board> {
  const db = readDb();
  const board = db.boards[boardId];
  if (!board) throw new NotFoundError('Board');
  if (patch.title !== undefined) board.title = patch.title.trim() || 'Untitled Board';
  board.updated_at = now();
  db.boards[boardId] = board;
  writeDb(db);
  return delay(board);
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/** POST /api/v1/boards/{board_id}/cards */
export async function createCard(
  boardId: string,
  data: { title: string; status: CardStatus; position: number },
): Promise<Card> {
  const db = readDb();
  if (!db.boards[boardId]) throw new NotFoundError('Board');
  const id = nanoid();
  const ts = now();
  const card: Card = {
    id,
    board_id: boardId,
    title: data.title,
    status: data.status,
    position: data.position,
    created_at: ts,
    updated_at: ts,
  };
  db.cards[id] = card;
  db.boards[boardId].updated_at = ts;
  writeDb(db);
  return delay(card);
}

/** PATCH /api/v1/cards/{card_id} */
export async function updateCard(
  cardId: string,
  patch: { title?: string; status?: CardStatus; position?: number },
): Promise<Card> {
  const db = readDb();
  const card = db.cards[cardId];
  if (!card) throw new NotFoundError('Card');
  if (patch.title !== undefined) card.title = patch.title;
  if (patch.status !== undefined) card.status = patch.status;
  if (patch.position !== undefined) card.position = patch.position;
  card.updated_at = now();
  db.cards[cardId] = card;
  const board = db.boards[card.board_id];
  if (board) board.updated_at = now();
  writeDb(db);
  return delay(card);
}

/** DELETE /api/v1/cards/{card_id} */
export async function deleteCard(cardId: string): Promise<void> {
  const db = readDb();
  const card = db.cards[cardId];
  if (!card) throw new NotFoundError('Card');
  delete db.cards[cardId];
  const board = db.boards[card.board_id];
  if (board) board.updated_at = now();
  writeDb(db);
  return delay(undefined);
}

export { NotFoundError };
