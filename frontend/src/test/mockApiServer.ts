// ---------------------------------------------------------------------------
// In-memory stand-in for the FastAPI backend, used only in tests.
//
// src/api/backend.ts is a real HTTP client; rather than requiring a live
// server for every test run, `installMockApiServer()` stubs `globalThis.fetch`
// with a handler that mirrors the routes in backend/openapi.yaml closely
// enough for the frontend's test suite to exercise backend.ts's real
// request-building/parsing/error-handling end to end.
// ---------------------------------------------------------------------------

import { nanoid } from 'nanoid';
import { vi } from 'vitest';
import type { Board, Card, CardStatus } from '../api/types';

interface Db {
  boards: Record<string, Board>;
  cards: Record<string, Card>;
}

let db: Db = { boards: {}, cards: {} };

export function resetMockApiServer(): void {
  db = { boards: {}, cards: {} };
}

function now(): string {
  return new Date().toISOString();
}

function jsonResponse(body: unknown, status = 200): Response {
  if (status === 204) return new Response(null, { status: 204 });
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function notFound(what: string): Response {
  return jsonResponse({ error: `${what} not found` }, 404);
}

async function readBody(init?: RequestInit): Promise<Record<string, unknown> | undefined> {
  if (!init?.body) return undefined;
  return JSON.parse(init.body as string);
}

export async function mockFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === 'string' ? input : input.toString());
  const method = (init?.method ?? 'GET').toUpperCase();
  const body = await readBody(init);
  const parts = url.pathname.replace(/^\/api\/v1\//, '').split('/').filter(Boolean);

  // POST /boards
  if (method === 'POST' && parts.length === 1 && parts[0] === 'boards') {
    const id = nanoid(21); // 21-char NanoID ~= 128 bits of entropy, per specs.md §5.
    const ts = now();
    const title = (body?.title as string | undefined)?.trim() || 'Untitled Board';
    db.boards[id] = { id, title, created_at: ts, updated_at: ts };
    return jsonResponse({ id, url: `/b/${id}` }, 201);
  }

  // GET /boards/{id}
  if (method === 'GET' && parts.length === 2 && parts[0] === 'boards') {
    const board = db.boards[parts[1]];
    if (!board) return notFound('Board');
    const cards = Object.values(db.cards)
      .filter((c) => c.board_id === parts[1])
      .sort((a, b) => a.position - b.position);
    return jsonResponse({ ...board, cards });
  }

  // PATCH /boards/{id}
  if (method === 'PATCH' && parts.length === 2 && parts[0] === 'boards') {
    const board = db.boards[parts[1]];
    if (!board) return notFound('Board');
    if (body?.title !== undefined) board.title = (body.title as string).trim() || 'Untitled Board';
    board.updated_at = now();
    return jsonResponse(board);
  }

  // POST /boards/{id}/cards
  if (method === 'POST' && parts.length === 3 && parts[0] === 'boards' && parts[2] === 'cards') {
    const board = db.boards[parts[1]];
    if (!board) return notFound('Board');
    const id = nanoid();
    const ts = now();
    const card: Card = {
      id,
      board_id: parts[1],
      title: body?.title as string,
      status: body?.status as CardStatus,
      position: body?.position as number,
      created_at: ts,
      updated_at: ts,
    };
    db.cards[id] = card;
    board.updated_at = ts;
    return jsonResponse(card, 201);
  }

  // PATCH /cards/{id}
  if (method === 'PATCH' && parts.length === 2 && parts[0] === 'cards') {
    const card = db.cards[parts[1]];
    if (!card) return notFound('Card');
    if (body?.title !== undefined) card.title = body.title as string;
    if (body?.status !== undefined) card.status = body.status as CardStatus;
    if (body?.position !== undefined) card.position = body.position as number;
    card.updated_at = now();
    const board = db.boards[card.board_id];
    if (board) board.updated_at = now();
    return jsonResponse(card);
  }

  // DELETE /cards/{id}
  if (method === 'DELETE' && parts.length === 2 && parts[0] === 'cards') {
    const card = db.cards[parts[1]];
    if (!card) return notFound('Card');
    delete db.cards[parts[1]];
    const board = db.boards[card.board_id];
    if (board) board.updated_at = now();
    return jsonResponse(undefined, 204);
  }

  throw new Error(`mockApiServer: unhandled request ${method} ${url.pathname}`);
}

export function installMockApiServer(): void {
  vi.stubGlobal('fetch', vi.fn(mockFetch));
}
