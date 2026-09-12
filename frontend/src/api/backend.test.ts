import { beforeEach, describe, expect, it } from 'vitest';
import * as backend from './backend';

describe('backend (mock)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createBoard', () => {
    it('creates a board with a default title and a share URL', async () => {
      const { id, url } = await backend.createBoard();
      expect(id).toHaveLength(21); // NanoID default length, per specs.md §5
      expect(url).toBe(`/b/${id}`);

      const board = await backend.getBoard(id);
      expect(board.title).toBe('Untitled Board');
      expect(board.cards).toEqual([]);
    });

    it('uses a trimmed custom title when given one', async () => {
      const { id } = await backend.createBoard('  Sprint 12  ');
      const board = await backend.getBoard(id);
      expect(board.title).toBe('Sprint 12');
    });

    it('falls back to the default title for a blank string', async () => {
      const { id } = await backend.createBoard('   ');
      const board = await backend.getBoard(id);
      expect(board.title).toBe('Untitled Board');
    });
  });

  describe('getBoard', () => {
    it('rejects with NotFoundError for an unknown id', async () => {
      await expect(backend.getBoard('does-not-exist')).rejects.toBeInstanceOf(backend.NotFoundError);
    });

    it('returns cards sorted by position', async () => {
      const { id: boardId } = await backend.createBoard();
      await backend.createCard(boardId, { title: 'Third', status: 'BACKLOG', position: 300 });
      await backend.createCard(boardId, { title: 'First', status: 'BACKLOG', position: 100 });
      await backend.createCard(boardId, { title: 'Second', status: 'BACKLOG', position: 200 });

      const board = await backend.getBoard(boardId);
      expect(board.cards.map((c) => c.title)).toEqual(['First', 'Second', 'Third']);
    });
  });

  describe('updateBoard', () => {
    it('renames a board', async () => {
      const { id: boardId } = await backend.createBoard('Old name');
      await backend.updateBoard(boardId, { title: 'New name' });

      const board = await backend.getBoard(boardId);
      expect(board.title).toBe('New name');
    });

    it('rejects with NotFoundError for an unknown board', async () => {
      await expect(backend.updateBoard('nope', { title: 'x' })).rejects.toBeInstanceOf(backend.NotFoundError);
    });
  });

  describe('createCard / updateCard / deleteCard', () => {
    it('creates a card scoped to its board', async () => {
      const { id: boardId } = await backend.createBoard();
      const card = await backend.createCard(boardId, { title: 'Write tests', status: 'BACKLOG', position: 1000 });

      expect(card.board_id).toBe(boardId);
      expect(card.status).toBe('BACKLOG');

      const board = await backend.getBoard(boardId);
      expect(board.cards).toHaveLength(1);
    });

    it('rejects card creation for an unknown board', async () => {
      await expect(
        backend.createCard('nope', { title: 'x', status: 'BACKLOG', position: 1000 }),
      ).rejects.toBeInstanceOf(backend.NotFoundError);
    });

    it('partially updates a card (title, status, or position independently)', async () => {
      const { id: boardId } = await backend.createBoard();
      const card = await backend.createCard(boardId, { title: 'Draft', status: 'BACKLOG', position: 1000 });

      await backend.updateCard(card.id, { status: 'IN_PROGRESS' });
      let updated = (await backend.getBoard(boardId)).cards[0];
      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.title).toBe('Draft'); // untouched

      await backend.updateCard(card.id, { title: 'Final' });
      updated = (await backend.getBoard(boardId)).cards[0];
      expect(updated.title).toBe('Final');
      expect(updated.status).toBe('IN_PROGRESS'); // untouched
    });

    it('rejects updating an unknown card', async () => {
      await expect(backend.updateCard('nope', { title: 'x' })).rejects.toBeInstanceOf(backend.NotFoundError);
    });

    it('deletes a card', async () => {
      const { id: boardId } = await backend.createBoard();
      const card = await backend.createCard(boardId, { title: 'Temp', status: 'BACKLOG', position: 1000 });

      await backend.deleteCard(card.id);

      const board = await backend.getBoard(boardId);
      expect(board.cards).toEqual([]);
    });

    it('rejects deleting an unknown card', async () => {
      await expect(backend.deleteCard('nope')).rejects.toBeInstanceOf(backend.NotFoundError);
    });
  });
});
