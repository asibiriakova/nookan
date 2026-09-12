// Shared domain types, mirroring the relational schema in _docs/specs.md §4.1.

export type CardStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export const COLUMNS: { status: CardStatus; label: string }[] = [
  { status: 'BACKLOG', label: 'Backlog' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'REVIEW', label: 'Review' },
  { status: 'DONE', label: 'Done' },
];

export interface Board {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  board_id: string;
  title: string;
  status: CardStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BoardWithCards extends Board {
  cards: Card[];
}
