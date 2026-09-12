import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card, CardStatus } from '../api/types';
import { CardItem } from './CardItem';
import { NewCardInput } from './NewCardInput';

interface Props {
  status: CardStatus;
  label: string;
  cards: Card[];
  onAddCard: (status: CardStatus, title: string) => void;
  onEditCard: (cardId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: -1 | 1) => void;
}

export function Column({ status, label, cards, onAddCard, onEditCard, onDeleteCard, onMoveCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status, isColumn: true } });

  return (
    <div className="column glass-panel">
      <div className="column__header">
        <h2>{label}</h2>
        <span className="column__count">{cards.length}</span>
      </div>

      <div ref={setNodeRef} className={`column__body${isOver ? ' column__body--over' : ''}`}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onMove={onMoveCard}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && <div className="column__empty">No cards yet</div>}
      </div>

      <NewCardInput onAdd={(title) => onAddCard(status, title)} />
    </div>
  );
}
