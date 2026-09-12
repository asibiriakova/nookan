// ---------------------------------------------------------------------------
// Centralized backend client.
//
// EVERY call the frontend makes to the backend goes through this module. It
// talks to the real FastAPI service (see backend/) over HTTP, at the URL in
// VITE_API_BASE_URL (see .env.example) — defaulting to http://localhost:8000
// for local dev. Request/response shapes mirror the REST API in
// _docs/specs.md §4.2 / backend/openapi.yaml one-to-one:
//
//   POST   /api/v1/boards                  -> createBoard()
//   GET    /api/v1/boards/{board_id}        -> getBoard()
//   PATCH  /api/v1/boards/{board_id}        -> updateBoard()
//   POST   /api/v1/boards/{board_id}/cards  -> createCard()
//   PATCH  /api/v1/cards/{card_id}          -> updateCard()
//   DELETE /api/v1/cards/{card_id}          -> deleteCard()
//
// Tests stub out `fetch` (see src/test/mockApiServer.ts) rather than hitting
// a real server, so this module's request-building/parsing still gets
// exercised end to end.
// ---------------------------------------------------------------------------

import type { Board, BoardWithCards, Card, CardStatus } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = 'NotFoundError';
  }
}

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Reads the `{ error }` body the API sends on failure, per openapi.yaml's Error schema. */
async function apiError(res: Response): Promise<ApiError> {
  const body = await parseJson<{ error?: string }>(res).catch(() => undefined);
  return new ApiError(res.status, body?.error ?? `Request failed with status ${res.status}`);
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

/** POST /api/v1/boards */
export async function createBoard(title?: string): Promise<{ id: string; url: string }> {
  const res = await apiFetch('/api/v1/boards', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw await apiError(res);
  return parseJson(res);
}

/** GET /api/v1/boards/{board_id} */
export async function getBoard(boardId: string): Promise<BoardWithCards> {
  const res = await apiFetch(`/api/v1/boards/${encodeURIComponent(boardId)}`);
  if (res.status === 404) throw new NotFoundError('Board');
  if (!res.ok) throw await apiError(res);
  return parseJson(res);
}

/** PATCH /api/v1/boards/{board_id} */
export async function updateBoard(boardId: string, patch: { title?: string }): Promise<Board> {
  const res = await apiFetch(`/api/v1/boards/${encodeURIComponent(boardId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (res.status === 404) throw new NotFoundError('Board');
  if (!res.ok) throw await apiError(res);
  return parseJson(res);
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/** POST /api/v1/boards/{board_id}/cards */
export async function createCard(
  boardId: string,
  data: { title: string; status: CardStatus; position: number },
): Promise<Card> {
  const res = await apiFetch(`/api/v1/boards/${encodeURIComponent(boardId)}/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.status === 404) throw new NotFoundError('Board');
  if (!res.ok) throw await apiError(res);
  return parseJson(res);
}

/** PATCH /api/v1/cards/{card_id} */
export async function updateCard(
  cardId: string,
  patch: { title?: string; status?: CardStatus; position?: number },
): Promise<Card> {
  const res = await apiFetch(`/api/v1/cards/${encodeURIComponent(cardId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  if (res.status === 404) throw new NotFoundError('Card');
  if (!res.ok) throw await apiError(res);
  return parseJson(res);
}

/** DELETE /api/v1/cards/{card_id} */
export async function deleteCard(cardId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/cards/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
  if (res.status === 404) throw new NotFoundError('Card');
  if (!res.ok) throw await apiError(res);
}

export { ApiError, NotFoundError };
