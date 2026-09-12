import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BoardHeader } from './BoardHeader';

function renderHeader(props: ComponentProps<typeof BoardHeader>) {
  return render(
    <MemoryRouter>
      <BoardHeader {...props} />
    </MemoryRouter>,
  );
}

describe('BoardHeader', () => {
  it('shows the board title as heading text', () => {
    renderHeader({ title: 'Sprint 12', onRename: vi.fn(), sync: 'idle' });
    expect(screen.getByRole('heading', { name: 'Sprint 12' })).toBeInTheDocument();
  });

  it('links back to the home page', () => {
    renderHeader({ title: 'Sprint 12', onRename: vi.fn(), sync: 'idle' });
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });

  it('shows a human-readable sync state', () => {
    const { rerender } = renderHeader({ title: 'Sprint 12', onRename: vi.fn(), sync: 'syncing' });
    expect(screen.getByText('Syncing…')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <BoardHeader title="Sprint 12" onRename={vi.fn()} sync="error" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Offline — retrying')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <BoardHeader title="Sprint 12" onRename={vi.fn()} sync="idle" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Synced')).toBeInTheDocument();
  });

  it('renames the board by clicking the title and pressing Enter', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderHeader({ title: 'Sprint 12', onRename, sync: 'idle' });

    await user.click(screen.getByRole('heading', { name: 'Sprint 12' }));
    const input = screen.getByDisplayValue('Sprint 12');
    await user.clear(input);
    await user.type(input, 'Sprint 13{Enter}');

    expect(onRename).toHaveBeenCalledWith('Sprint 13');
  });

  it('does not rename on an unchanged or blank title', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderHeader({ title: 'Sprint 12', onRename, sync: 'idle' });

    await user.click(screen.getByRole('heading', { name: 'Sprint 12' }));
    await user.keyboard('{Enter}'); // unchanged
    expect(onRename).not.toHaveBeenCalled();

    await user.click(screen.getByRole('heading', { name: 'Sprint 12' }));
    const input = screen.getByDisplayValue('Sprint 12');
    await user.clear(input);
    await user.keyboard('{Enter}'); // blank
    expect(onRename).not.toHaveBeenCalled();
  });

  it('discards the edit on Escape', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderHeader({ title: 'Sprint 12', onRename, sync: 'idle' });

    await user.click(screen.getByRole('heading', { name: 'Sprint 12' }));
    const input = screen.getByDisplayValue('Sprint 12');
    await user.type(input, ' changed{Escape}');

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Sprint 12' })).toBeInTheDocument();
  });

  describe('copy share link', () => {
    it('copies the current URL and shows confirmation', async () => {
      // user-event installs its own navigator.clipboard stub as part of
      // setup(), so spy on it afterwards rather than pre-defining one.
      const user = userEvent.setup();
      const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

      renderHeader({ title: 'Sprint 12', onRename: vi.fn(), sync: 'idle' });
      await user.click(screen.getByRole('button', { name: 'Copy share link' }));

      expect(writeText).toHaveBeenCalledWith(window.location.href);
      expect(await screen.findByText('Link copied!')).toBeInTheDocument();
    });

    it('still shows confirmation even if the clipboard write fails', async () => {
      const user = userEvent.setup();
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

      renderHeader({ title: 'Sprint 12', onRename: vi.fn(), sync: 'idle' });
      await user.click(screen.getByRole('button', { name: 'Copy share link' }));

      expect(await screen.findByText('Link copied!')).toBeInTheDocument();
    });
  });
});
