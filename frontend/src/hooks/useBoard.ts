import { useCallback, useEffect, useRef, useState } from 'react';
import * as backend from '../api/backend';
import type { Board, Card, CardStatus } from '../api/types';
import { positionBetween } from '../lib/position';

const POLL_INTERVAL_MS = 7000;

export type SyncState = 'idle' | 'syncing' | 'error' | 'offline-changes';

export function useBoard(boardId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sync, setSync] = useState<SyncState>('idle');

  // Skip clobbering local state with a poll response while a drag or edit
  // is actively in flight, so optimistic UI never gets yanked mid-gesture.
  const suppressPollRef = useRef(0);

  const applyServerState = useCallback((fresh: Board & { cards: Card[] }) => {
    setBoard({ id: fresh.id, title: fresh.title, created_at: fresh.created_at, updated_at: fresh.updated_at });
    setCards(fresh.cards);
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setSync('syncing');
      try {
        const fresh = await backend.getBoard(boardId);
        if (suppressPollRef.current === 0) applyServerState(fresh);
        setNotFound(false);
        setSync('idle');
      } catch (err) {
        if (err instanceof backend.NotFoundError) {
          setNotFound(true);
        } else {
          setSync('error');
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [boardId, applyServerState],
  );

  // Initial load.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Background polling, per spec §3.4.
  useEffect(() => {
    const id = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Refresh on window focus, per spec §3.4.
  useEffect(() => {
    const onFocus = () => load({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // The mock backend persists to localStorage, so other tabs editing the
  // same board fire a native 'storage' event — piggyback on it for
  // near-instant cross-tab sync instead of waiting for the next poll.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'nookan_mock_db_v1') load({ silent: true });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [load]);

  const withOptimism = useCallback(
    async <T,>(apply: () => void, revert: () => void, request: () => Promise<T>) => {
      suppressPollRef.current++;
      apply();
      try {
        await request();
      } catch {
        revert();
        setSync('error');
      } finally {
        suppressPollRef.current--;
      }
    },
    [],
  );

  const renameBoard = useCallback(
    (title: string) => {
      if (!board) return;
      const prev = board;
      withOptimism(
        () => setBoard((b) => (b ? { ...b, title } : b)),
        () => setBoard(prev),
        () => backend.updateBoard(boardId, { title }),
      );
    },
    [board, boardId, withOptimism],
  );

  const addCard = useCallback(
    (status: CardStatus, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const inColumn = cards.filter((c) => c.status === status).sort((a, b) => a.position - b.position);
      const lastPos = inColumn.length ? inColumn[inColumn.length - 1].position : undefined;
      const position = positionBetween(lastPos, undefined);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticCard: Card = {
        id: tempId,
        board_id: boardId,
        title: trimmed,
        status,
        position,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      withOptimism(
        () => setCards((cs) => [...cs, optimisticCard]),
        () => setCards((cs) => cs.filter((c) => c.id !== tempId)),
        async () => {
          const real = await backend.createCard(boardId, { title: trimmed, status, position });
          setCards((cs) => cs.map((c) => (c.id === tempId ? real : c)));
        },
      );
    },
    [boardId, cards, withOptimism],
  );

  const editCardTitle = useCallback(
    (cardId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const prev = cards.find((c) => c.id === cardId);
      if (!prev) return;
      withOptimism(
        () => setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, title: trimmed } : c))),
        () => setCards((cs) => cs.map((c) => (c.id === cardId ? prev : c))),
        () => backend.updateCard(cardId, { title: trimmed }),
      );
    },
    [cards, withOptimism],
  );

  const moveCard = useCallback(
    (cardId: string, status: CardStatus, position: number, opts?: { silent?: boolean }) => {
      // `silent`: reflect a pending drag position locally only, with no
      // network round-trip — used for live drag-over preview. The final
      // drop always calls this again without `silent` to persist it.
      if (opts?.silent) {
        setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, status, position } : c)));
        return;
      }
      const prev = cards.find((c) => c.id === cardId);
      if (!prev) return;
      withOptimism(
        () => setCards((cs) => cs.map((c) => (c.id === cardId ? { ...c, status, position } : c))),
        () => setCards((cs) => cs.map((c) => (c.id === cardId ? prev : c))),
        () => backend.updateCard(cardId, { status, position }),
      );
    },
    [cards, withOptimism],
  );

  const removeCard = useCallback(
    (cardId: string) => {
      const prev = cards.find((c) => c.id === cardId);
      if (!prev) return;
      withOptimism(
        () => setCards((cs) => cs.filter((c) => c.id !== cardId)),
        () => setCards((cs) => (cs.some((c) => c.id === cardId) ? cs : [...cs, prev])),
        () => backend.deleteCard(cardId),
      );
    },
    [cards, withOptimism],
  );

  return {
    board,
    cards,
    loading,
    notFound,
    sync,
    renameBoard,
    addCard,
    editCardTitle,
    moveCard,
    removeCard,
    refresh: () => load({ silent: true }),
  };
}
