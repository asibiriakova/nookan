# Nookan — Frontend

Frontend for the Mini Kanban Board described in [`_docs/specs.md`](../_docs/specs.md), built with React + TypeScript + Vite.

## Running it

```bash
npm install
npm run dev
```

Open the URL Vite prints. From the home page, click **Create a new board** to get a board at `/b/<token>`, share that URL, or use **Recent boards** to jump back into ones you've created on this device.

## No backend yet — it's mocked

There is no real server. Every backend call the app makes is centralized in **[`src/api/backend.ts`](src/api/backend.ts)** — one function per endpoint in the spec's REST API (`createBoard`, `getBoard`, `updateBoard`, `createCard`, `updateCard`, `deleteCard`). The mock implementation persists to `localStorage` (so state survives reloads and even syncs live across tabs) and adds artificial network latency, so the UI behaves like it's talking to a real API.

To wire up a real backend later: reimplement the bodies of those functions to call `fetch()` against `/api/v1/...` instead of touching `localStorage`, keeping the same signatures and return shapes. Nothing else in the app should need to change — `src/hooks/useBoard.ts` and every component only ever import from `src/api/backend.ts`.

## Structure

- `src/api/` — backend types and the centralized (mocked) client.
- `src/hooks/useBoard.ts` — loads a board, polls/refreshes it, and exposes optimistic mutations (add/edit/move/delete card, rename board).
- `src/components/` — `Column`, `CardItem`, `NewCardInput`, `BoardHeader`.
- `src/pages/` — `Home` (create/join a board) and `BoardPage` (the kanban board, with drag-and-drop via `@dnd-kit`).
- `src/lib/position.ts` — fractional-position helper used when reordering cards.
- `src/lib/resolveDrop.ts` — works out where a dropped card lands (status + position) from a dnd-kit drag event.
- `src/styles/liquid-glass.css` — the "liquid glass" visual system (tokens, `.glass-panel`/`.glass-card`/`.glass-button`) used for the board's columns, cards, and buttons; `src/index.css` layers app layout on top of it.

## Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Vitest + React Testing Library, covering:

- `src/lib/*.test.ts` — pure logic (fractional positioning, drop-target resolution, recent-boards storage).
- `src/api/backend.test.ts` — the mock backend's contract (every endpoint, including its error cases).
- `src/hooks/useBoard.test.tsx` — loading, optimistic updates, and rollback-on-failure, against a mocked backend.
- `src/components/*.test.tsx` — inline editing, delete-confirm, quick-move, board rename, copy-link.
- `src/pages/*.test.tsx` — `Home` (create/join/recent boards) and `BoardPage` end to end (add/edit/move/delete a card) against the real mock backend.

Actual pointer-drag gestures aren't simulated (impractical in jsdom); the drag math they'd exercise is covered directly via `resolveDrop.test.ts`, and the quick-move buttons cover the same `moveCard` path through the real UI.

## What's interactive

- Create a board, rename it inline, copy its share link.
- Add cards per column, edit their text inline, delete with a quick confirm.
- Drag and drop cards between and within columns (with keyboard and touch support), or use the ← / → quick-move buttons.
- Optimistic updates, background polling, refresh-on-focus, and cross-tab sync (open the same board in two tabs to see it).
