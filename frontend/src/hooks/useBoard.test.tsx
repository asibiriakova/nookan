import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as backend from '../api/backend';
import type { Board, Card } from '../api/types';
import { useBoard } from './useBoard';

vi.mock('../api/backend', async () => {
  const actual = await vi.importActual<typeof import('../api/backend')>('../api/backend');
  return {
    ...actual,
    getBoard: vi.fn(),
    updateBoard: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
  };
});

const boardId = 'board-1';

function makeBoard(cards: Card[]): Board & { cards: Card[] } {
  return { id: boardId, title: 'Test board', created_at: 't', updated_at: 't', cards };
}

function makeCard(overrides: Partial<Card>): Card {
  return {
    id: 'card-1',
    board_id: boardId,
    title: 'Card',
    status: 'BACKLOG',
    position: 1000,
    created_at: 't',
    updated_at: 't',
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(backend.getBoard).mockReset();
  vi.mocked(backend.updateBoard).mockReset();
  vi.mocked(backend.createCard).mockReset();
  vi.mocked(backend.updateCard).mockReset();
  vi.mocked(backend.deleteCard).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useBoard', () => {
  it('loads the board and its cards on mount', async () => {
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([makeCard({})]));

    const { result } = renderHook(() => useBoard(boardId));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.board?.title).toBe('Test board');
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.notFound).toBe(false);
  });

  it('surfaces a not-found board instead of leaving it loading forever', async () => {
    vi.mocked(backend.getBoard).mockRejectedValue(new backend.NotFoundError('Board'));

    const { result } = renderHook(() => useBoard(boardId));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
  });

  it('adds a card optimistically before the backend call resolves', async () => {
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([]));
    let resolveCreate!: (card: Card) => void;
    vi.mocked(backend.createCard).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const { result } = renderHook(() => useBoard(boardId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addCard('BACKLOG', 'New task');
    });

    // Visible immediately, before the backend has responded.
    expect(result.current.cards).toHaveLength(1);
    expect(result.current.cards[0].title).toBe('New task');

    await act(async () => {
      resolveCreate(makeCard({ id: 'real-id', title: 'New task' }));
      await Promise.resolve();
    });

    expect(result.current.cards[0].id).toBe('real-id');
  });

  it('ignores a blank card title without calling the backend', async () => {
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([]));
    const { result } = renderHook(() => useBoard(boardId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addCard('BACKLOG', '   ');
    });

    expect(result.current.cards).toHaveLength(0);
    expect(backend.createCard).not.toHaveBeenCalled();
  });

  it('rolls back an edit if the backend rejects it', async () => {
    const card = makeCard({ title: 'Original' });
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([card]));
    vi.mocked(backend.updateCard).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useBoard(boardId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.editCardTitle(card.id, 'Edited');
    });

    // Applied optimistically first, then rolled back once the rejection lands.
    await waitFor(() => expect(result.current.cards[0].title).toBe('Original'));
    expect(result.current.sync).toBe('error');
  });

  it('removes a card optimistically and calls deleteCard', async () => {
    const card = makeCard({});
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([card]));
    vi.mocked(backend.deleteCard).mockResolvedValue(undefined);

    const { result } = renderHook(() => useBoard(boardId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.removeCard(card.id);
    });

    expect(result.current.cards).toHaveLength(0);
    await waitFor(() => expect(backend.deleteCard).toHaveBeenCalledWith(card.id));
  });

  it('moves a card to a new status/position and persists it', async () => {
    const card = makeCard({ status: 'BACKLOG', position: 1000 });
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([card]));
    vi.mocked(backend.updateCard).mockResolvedValue({ ...card, status: 'DONE', position: 2000 });

    const { result } = renderHook(() => useBoard(boardId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.moveCard(card.id, 'DONE', 2000);
    });

    expect(result.current.cards[0].status).toBe('DONE');
    await waitFor(() => expect(backend.updateCard).toHaveBeenCalledWith(card.id, { status: 'DONE', position: 2000 }));
  });

  it('applies a silent move locally without calling the backend (drag preview)', async () => {
    const card = makeCard({ status: 'BACKLOG', position: 1000 });
    vi.mocked(backend.getBoard).mockResolvedValue(makeBoard([card]));

    const { result } = renderHook(() => useBoard(boardId));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.moveCard(card.id, 'IN_PROGRESS', 500, { silent: true });
    });

    expect(result.current.cards[0].status).toBe('IN_PROGRESS');
    expect(backend.updateCard).not.toHaveBeenCalled();
  });
});
