import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import * as backend from '../api/backend';
import BoardPage from './BoardPage';

// The drop-target math (resolveDrop) is unit-tested on its own in
// src/lib/resolveDrop.test.ts; this file covers the page's rendering and
// user-facing interactions (add/edit/move/delete) end to end against the
// real mock backend.

describe('BoardPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function renderBoard(boardId: string) {
    return render(
      <MemoryRouter initialEntries={[`/b/${boardId}`]}>
        <Routes>
          <Route path="/b/:boardId" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('shows a not-found state for an unknown board', async () => {
    renderBoard('does-not-exist');
    expect(await screen.findByText('Board not found')).toBeInTheDocument();
  });

  it('loads a real board and renders its columns and cards', async () => {
    const { id: boardId } = await backend.createBoard('Launch plan');
    await backend.createCard(boardId, { title: 'Write copy', status: 'BACKLOG', position: 1000 });
    await backend.createCard(boardId, { title: 'Ship it', status: 'DONE', position: 1000 });

    renderBoard(boardId);

    expect(await screen.findByRole('heading', { name: 'Launch plan' })).toBeInTheDocument();
    expect(screen.getByText('Write copy')).toBeInTheDocument();
    expect(screen.getByText('Ship it')).toBeInTheDocument();

    const backlog = screen.getByText('Backlog').closest('.column') as HTMLElement;
    expect(within(backlog).getByText('1')).toBeInTheDocument(); // card count badge
  });

  it('adds a card through the UI and persists it to the backend', async () => {
    const user = userEvent.setup();
    const { id: boardId } = await backend.createBoard('Launch plan');
    renderBoard(boardId);
    await screen.findByRole('heading', { name: 'Launch plan' });

    const backlog = screen.getByText('Backlog').closest('.column') as HTMLElement;
    await user.click(within(backlog).getByRole('button', { name: '+ Add a card' }));
    await user.type(within(backlog).getByPlaceholderText('Card title…'), 'New task{Enter}');

    expect(await within(backlog).findByText('New task')).toBeInTheDocument();

    await waitFor(async () => {
      const board = await backend.getBoard(boardId);
      expect(board.cards.map((c) => c.title)).toContain('New task');
    });
  });

  it('moves a card to the next column with the quick-move button', async () => {
    const user = userEvent.setup();
    const { id: boardId } = await backend.createBoard('Launch plan');
    await backend.createCard(boardId, { title: 'Write copy', status: 'BACKLOG', position: 1000 });
    renderBoard(boardId);

    await screen.findByText('Write copy');
    const card = screen.getByText('Write copy').closest('.card') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'Move to next column' }));

    const inProgress = screen.getByText('In Progress').closest('.column') as HTMLElement;
    expect(await within(inProgress).findByText('Write copy')).toBeInTheDocument();

    await waitFor(async () => {
      const board = await backend.getBoard(boardId);
      expect(board.cards.find((c) => c.title === 'Write copy')?.status).toBe('IN_PROGRESS');
    });
  });

  it('deletes a card after a second confirming click', async () => {
    const user = userEvent.setup();
    const { id: boardId } = await backend.createBoard('Launch plan');
    await backend.createCard(boardId, { title: 'Temp card', status: 'BACKLOG', position: 1000 });
    renderBoard(boardId);

    await screen.findByText('Temp card');
    const card = screen.getByText('Temp card').closest('.card') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'Delete card' }));
    await user.click(within(card).getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(screen.queryByText('Temp card')).not.toBeInTheDocument());

    await waitFor(async () => {
      const board = await backend.getBoard(boardId);
      expect(board.cards).toHaveLength(0);
    });
  });
});
