import { useState } from 'react';
import type { KeyboardEvent } from 'react';

interface Props {
  onAdd: (title: string) => void;
}

export function NewCardInput({ onAdd }: Props) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue('');
    }
    setActive(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
      setActive(true); // stay open for rapid entry
    } else if (e.key === 'Escape') {
      setValue('');
      setActive(false);
    }
  }

  if (!active) {
    return (
      <button type="button" className="new-card-trigger" onClick={() => setActive(true)}>
        + Add a card
      </button>
    );
  }

  return (
    <div className="new-card-form">
      <textarea
        autoFocus
        rows={2}
        placeholder="Card title…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!value.trim()) setActive(false);
        }}
      />
      <div className="new-card-form__actions">
        <button type="button" className="glass-button glass-button--primary glass-button--small" onClick={submit}>
          Add card
        </button>
        <button
          type="button"
          className="glass-button glass-button--small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setValue('');
            setActive(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
