import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef, useState } from 'react';
import type { Card, CardStatus } from '../api/types';
import { COLUMNS } from '../api/types';

interface Props {
  card: Card;
  onEdit: (cardId: string, title: string) => void;
  onDelete: (cardId: string) => void;
  onMove: (cardId: string, direction: -1 | 1) => void;
}

export function CardItem({ card, onEdit, onDelete, onMove }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { status: card.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => () => {
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
  }, []);

  const columnIndex = COLUMNS.findIndex((c) => c.status === card.status);

  function startEdit() {
    setDraft(card.title);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== card.title) {
      onEdit(card.id, draft.trim());
    }
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(card.title);
  }

  function handleDeleteClick() {
    if (confirmingDelete) {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
      onDelete(card.id);
      return;
    }
    setConfirmingDelete(true);
    confirmTimeout.current = setTimeout(() => setConfirmingDelete(false), 2500);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card glass-panel${isDragging ? ' card--dragging' : ''}`}
    >
      <div className="card__handle" {...attributes} {...listeners} aria-label="Drag to move card" title="Drag to move">
        <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
          <circle cx="3" cy="3" r="1.5" fill="currentColor" />
          <circle cx="9" cy="3" r="1.5" fill="currentColor" />
          <circle cx="3" cy="10" r="1.5" fill="currentColor" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="3" cy="17" r="1.5" fill="currentColor" />
          <circle cx="9" cy="17" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <div className="card__body">
        {editing ? (
          <textarea
            ref={inputRef}
            className="card__input"
            value={draft}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitEdit();
              } else if (e.key === 'Escape') {
                cancelEdit();
              }
            }}
          />
        ) : (
          <p className="card__title" onDoubleClick={startEdit}>
            {card.title}
          </p>
        )}

        <div className="card__actions">
          <div className="card__move-actions">
            <button
              type="button"
              className="icon-btn"
              disabled={columnIndex <= 0}
              onClick={() => onMove(card.id, -1)}
              aria-label="Move to previous column"
              title="Move left"
            >
              ←
            </button>
            <button
              type="button"
              className="icon-btn"
              disabled={columnIndex >= COLUMNS.length - 1}
              onClick={() => onMove(card.id, 1)}
              aria-label="Move to next column"
              title="Move right"
            >
              →
            </button>
          </div>
          <div className="card__edit-actions">
            <button type="button" className="icon-btn" onClick={startEdit} aria-label="Edit card" title="Edit">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M11.5 1.5l3 3-8 8-3.5.5.5-3.5 8-8z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={`icon-btn${confirmingDelete ? ' icon-btn--danger-confirm' : ''}`}
              onClick={handleDeleteClick}
              aria-label={confirmingDelete ? 'Confirm delete' : 'Delete card'}
              title={confirmingDelete ? 'Click again to confirm' : 'Delete'}
            >
              {confirmingDelete ? (
                '✓'
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 4.5h10M6.5 4.5v-1a1 1 0 011-1h1a1 1 0 011 1v1M4.5 4.5l.6 8.4a1 1 0 001 .9h3.8a1 1 0 001-.9l.6-8.4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CardStatus };
