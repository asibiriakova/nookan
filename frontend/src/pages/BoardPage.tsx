import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { COLUMNS } from '../api/types';
import type { Card } from '../api/types';
import { BoardHeader } from '../components/BoardHeader';
import { Column } from '../components/Column';
import { useBoard } from '../hooks/useBoard';
import { positionBetween } from '../lib/position';
import { recordRecentBoard } from '../lib/recentBoards';
import { resolveDrop } from '../lib/resolveDrop';

export default function BoardPage() {
  const { boardId = '' } = useParams<{ boardId: string }>();
  const { board, cards, loading, notFound, sync, renameBoard, addCard, editCardTitle, moveCard, removeCard } =
    useBoard(boardId);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  useEffect(() => {
    if (board) recordRecentBoard(board.id, board.title);
    // Deliberately narrower than [board]: board.updated_at changes on every
    // poll (including from other users' edits) and shouldn't retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.id, board?.title]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const resolved = resolveDrop(cards, String(active.id), over);
    const card = cards.find((c) => c.id === active.id);
    if (!card || !resolved) return;
    if (card.status === resolved.status && card.position === resolved.position) return;
    // Live preview only: reflect the pending drop locally without a network call.
    moveCard(card.id, resolved.status, resolved.position, { silent: true });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const resolved = resolveDrop(cards, String(active.id), over);
    const card = cards.find((c) => c.id === active.id);
    if (!card || !resolved) return;
    moveCard(card.id, resolved.status, resolved.position);
  }

  function handleQuickMove(cardId: string, direction: -1 | 1) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    const idx = COLUMNS.findIndex((c) => c.status === card.status);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= COLUMNS.length) return;
    const targetStatus = COLUMNS[targetIdx].status;
    const targetList = cards.filter((c) => c.status === targetStatus).sort((a, b) => a.position - b.position);
    const lastPos = targetList.length ? targetList[targetList.length - 1].position : undefined;
    moveCard(cardId, targetStatus, positionBetween(lastPos, undefined));
  }

  if (notFound) {
    return (
      <div className="board-missing">
        <h1>Board not found</h1>
        <p>This board link is invalid, or the board doesn't exist on this device's mock backend.</p>
        <Link to="/">Create a new board</Link>
      </div>
    );
  }

  if (loading || !board) {
    return <div className="board-loading">Loading board…</div>;
  }

  return (
    <div className="board-page">
      <BoardHeader title={board.title} onRename={renameBoard} sync={sync} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="board-columns">
          {COLUMNS.map(({ status, label }) => (
            <Column
              key={status}
              status={status}
              label={label}
              cards={cards.filter((c) => c.status === status).sort((a, b) => a.position - b.position)}
              onAddCard={addCard}
              onEditCard={editCardTitle}
              onDeleteCard={removeCard}
              onMoveCard={handleQuickMove}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="card glass-panel card--overlay">
              <div className="card__body">
                <p className="card__title">{activeCard.title}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
