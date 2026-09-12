import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { recordRecentBoard } from '../lib/recentBoards';
import Home from './Home';

function BoardStub() {
  const { boardId } = useParams<{ boardId: string }>();
  return <div>Board page: {boardId}</div>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/b/:boardId" element={<BoardStub />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a board and navigates to it', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole('button', { name: 'Create a new board' }));

    expect(await screen.findByText(/Board page: /)).toBeInTheDocument();
  });

  it('rejects a join value that is not a board link or id', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(screen.getByPlaceholderText('Paste a board link or ID…'), 'not a valid link!!');
    await user.click(screen.getByRole('button', { name: 'Go' }));

    expect(screen.getByText("That doesn't look like a board link or ID.")).toBeInTheDocument();
  });

  it('navigates to a board pasted as a bare id', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(screen.getByPlaceholderText('Paste a board link or ID…'), 'abc123XYZ');
    await user.click(screen.getByRole('button', { name: 'Go' }));

    expect(await screen.findByText('Board page: abc123XYZ')).toBeInTheDocument();
  });

  it('navigates to a board pasted as a full URL', async () => {
    const user = userEvent.setup();
    renderHome();

    await user.type(
      screen.getByPlaceholderText('Paste a board link or ID…'),
      'https://nookan.example.com/b/board-42',
    );
    await user.click(screen.getByRole('button', { name: 'Go' }));

    expect(await screen.findByText('Board page: board-42')).toBeInTheDocument();
  });

  it('lists recent boards and lets you forget one', async () => {
    const user = userEvent.setup();
    recordRecentBoard('board-1', 'First board');
    recordRecentBoard('board-2', 'Second board');
    renderHome();

    expect(screen.getByText('First board')).toBeInTheDocument();
    expect(screen.getByText('Second board')).toBeInTheDocument();

    const row = screen.getByText('Second board').closest('li') as HTMLElement;
    await user.click(row.querySelector('button')!);

    expect(screen.queryByText('Second board')).not.toBeInTheDocument();
    expect(screen.getByText('First board')).toBeInTheDocument();
  });

  it('shows no recent-boards section when none exist', () => {
    renderHome();
    expect(screen.queryByText('Recent boards on this device')).not.toBeInTheDocument();
  });
});
