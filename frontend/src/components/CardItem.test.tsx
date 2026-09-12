import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Card } from '../api/types';
import { CardItem } from './CardItem';

// CardItem uses dnd-kit's useSortable, which needs a DndContext ancestor to
// resolve without warnings; SortableContext supplies the sorting strategy.
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

function renderCard(card: Card, handlers: Partial<Parameters<typeof CardItem>[0]> = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onMove = vi.fn();
  render(
    <DndContext>
      <SortableContext items={[card.id]}>
        <CardItem card={card} onEdit={onEdit} onDelete={onDelete} onMove={onMove} {...handlers} />
      </SortableContext>
    </DndContext>,
  );
  return { onEdit, onDelete, onMove };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    board_id: 'board-1',
    title: 'Write release notes',
    status: 'IN_PROGRESS',
    position: 1000,
    created_at: 't',
    updated_at: 't',
    ...overrides,
  };
}

describe('CardItem', () => {
  it('renders the card title', () => {
    renderCard(makeCard());
    expect(screen.getByText('Write release notes')).toBeInTheDocument();
  });

  it('enters edit mode on double-click and commits the new title on Enter', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderCard(makeCard());

    await user.dblClick(screen.getByText('Write release notes'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Ship release notes{Enter}');

    expect(onEdit).toHaveBeenCalledWith('card-1', 'Ship release notes');
  });

  it('cancels editing on Escape without calling onEdit', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderCard(makeCard());

    await user.dblClick(screen.getByText('Write release notes'));
    const input = screen.getByRole('textbox');
    await user.type(input, ' more{Escape}');

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Write release notes')).toBeInTheDocument();
  });

  it('requires a second click to delete (quick confirm)', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderCard(makeCard());

    const deleteButton = screen.getByRole('button', { name: 'Delete card' });
    await user.click(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();

    const confirmButton = screen.getByRole('button', { name: 'Confirm delete' });
    await user.click(confirmButton);
    expect(onDelete).toHaveBeenCalledWith('card-1');
  });

  it('disables the move-left button in the first column and move-right in the last', async () => {
    const user = userEvent.setup();
    const { onMove: onMoveBacklog } = renderCard(makeCard({ status: 'BACKLOG' }));
    expect(screen.getByRole('button', { name: 'Move to previous column' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Move to next column' }));
    expect(onMoveBacklog).toHaveBeenCalledWith('card-1', 1);
  });

  it('disables move-right in the last column', () => {
    renderCard(makeCard({ status: 'DONE' }));
    expect(screen.getByRole('button', { name: 'Move to next column' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move to previous column' })).not.toBeDisabled();
  });
});
