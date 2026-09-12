import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NewCardInput } from './NewCardInput';

describe('NewCardInput', () => {
  it('shows a trigger button first, with no form visible', () => {
    render(<NewCardInput onAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: '+ Add a card' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Card title…')).not.toBeInTheDocument();
  });

  it('opens the form when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<NewCardInput onAdd={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '+ Add a card' }));
    expect(screen.getByPlaceholderText('Card title…')).toBeInTheDocument();
  });

  it('submits on Enter and stays open for rapid entry', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NewCardInput onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: '+ Add a card' }));
    const textarea = screen.getByPlaceholderText('Card title…');
    await user.type(textarea, 'First task{Enter}');

    expect(onAdd).toHaveBeenCalledWith('First task');
    // Form stays open, and cleared, ready for the next card.
    expect(screen.getByPlaceholderText('Card title…')).toHaveValue('');
  });

  it('does not submit a blank title', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NewCardInput onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: '+ Add a card' }));
    await user.type(screen.getByPlaceholderText('Card title…'), '   {Enter}');

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits via the Add card button', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NewCardInput onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: '+ Add a card' }));
    await user.type(screen.getByPlaceholderText('Card title…'), 'Buy milk');
    await user.click(screen.getByRole('button', { name: 'Add card' }));

    expect(onAdd).toHaveBeenCalledWith('Buy milk');
  });

  it('closes without submitting on Escape or Cancel', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<NewCardInput onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: '+ Add a card' }));
    await user.type(screen.getByPlaceholderText('Card title…'), 'abandoned{Escape}');
    expect(screen.queryByPlaceholderText('Card title…')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ Add a card' }));
    await user.type(screen.getByPlaceholderText('Card title…'), 'also abandoned');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByPlaceholderText('Card title…')).not.toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
