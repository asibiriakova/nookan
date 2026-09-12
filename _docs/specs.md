# Mini Kanban Board — Product & Technical Specification (MVP)

**Document Version:** 1.0  
**Target Phase:** Minimum Viable Product (MVP)  
**Status:** Approved Specification  

---

## 1. Executive Summary & Objective

The **Mini Kanban Board** is a lightweight, cloud-backed collaborative task-tracking application. It provides instant, frictionless task management for teams or individuals without sign-up overhead, utilizing link-based board sharing and a focused minimal interface.

---

## 2. Core Architectural Principles & Scope Decisions

| Dimension | Selected Scope | Architectural Rationale |
| :--- | :--- | :--- |
| **Application Type** | Full-Stack Web Application | Accessible via any modern web browser without local setup. |
| **Persistence Model** | Multi-User Cloud Database | Centralized source of truth supporting shared state. |
| **Board Columns** | Fixed Default Columns (`Backlog`, `In Progress`, `Review`, `Done`) | Eliminates column management overhead; simplifies relational schema. |
| **Card Detail Level** | Minimal Text Cards (Title / Plain Text) | Optimizes data entry speed and interaction velocity; zero modal fatigue. |
| **Sync Strategy** | REST Request/Response + Polling | Predictable stateless architecture; no complex socket/CRDT lifecycle in MVP. |
| **Access Control** | Shared Board via Unique Secret URL (Token-in-URL) | Zero-friction onboarding; no passwords or account registries required. |

---

## 3. Functional Requirements

### 3.1 Board Lifecycle & Sharing
- **Board Creation:** Single click generates a new board with a cryptographically secure, unguessable identifier (e.g., UUIDv4 or NanoID).
- **Board Access:** Anyone with the URL (`https://<domain>/b/<board_token>`) has full collaborative read/write access.
- **Board Metadata:** Stores creation timestamp, last active timestamp, and optional board title.

### 3.2 Column Workflow
- Pre-defined fixed 4-stage Kanban pipeline:
  1. `BACKLOG`
  2. `IN_PROGRESS`
  3. `REVIEW`
  4. `DONE`
- Columns cannot be renamed, reordered, or deleted in MVP.

### 3.3 Card Management
- **Create:** Fast inline input at the top or bottom of any column.
- **Read / Display:** Cards render title text, drag handle, and relative position.
- **Update (Text):** Inline edit title text via click/double-click.
- **Move (Column / Order):**
  - Drag-and-drop between columns.
  - Drag-and-drop within the same column to reorder.
  - Optional fallback: Clickable quick-actions (Move Left / Move Right).
- **Delete:** Single-action removal (with optional quick undo or confirmation).

### 3.4 Multi-User Synchronization
- Standard REST API mutations update database state immediately.
- Frontend triggers optimistic UI updates for instant local feedback.
- Background polling (e.g., every 5–10 seconds) or window focus sync pulls the latest board state to keep multiple open tabs/browsers updated.

---

## 4. Technical Architecture & Data Model

### 4.1 Relational Data Schema

#### Table: `boards`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / VARCHAR(36) | PRIMARY KEY | Unique board identifier (URL token) |
| `title` | VARCHAR(255) | NOT NULL, DEFAULT 'Untitled Board' | Display name |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Board creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last activity timestamp |

#### Table: `cards`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID / VARCHAR(36) | PRIMARY KEY | Unique card identifier |
| `board_id` | UUID / VARCHAR(36) | NOT NULL, FOREIGN KEY (`boards.id`) | Owning board reference |
| `title` | TEXT | NOT NULL | Card content/title |
| `status` | VARCHAR(32) | NOT NULL | Enum: `BACKLOG`, `IN_PROGRESS`, `REVIEW`, `DONE` |
| `position` | DOUBLE PRECISION / INT | NOT NULL | Ordering index within the column |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Card creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Card last updated time |

> **Note on Ordering:** Using fractional positioning (floating-point ranks) avoids bulk database updates when reordering cards between existing positions.

---

### 4.2 REST API Specification

```
POST   /api/v1/boards                  -> Create a new board (returns { id, url })
GET    /api/v1/boards/{board_id}        -> Get board metadata and all cards
PATCH  /api/v1/boards/{board_id}        -> Update board title

POST   /api/v1/boards/{board_id}/cards  -> Create a new card
PATCH  /api/v1/cards/{card_id}          -> Update card (title, status, position)
DELETE /api/v1/cards/{card_id}          -> Delete a card
```

---

## 5. Non-Functional & Quality Attributes

- **Security & Privacy:** Board tokens must have at least 128 bits of entropy (e.g., UUIDv4 or NanoID 21 chars) to prevent enumeration attacks.
- **Latency & Performance:** API response times under 100ms for card operations. Payload sizes kept minimal.
- **Resilience:** Graceful handling of network timeouts with client-side retry indicators.
- **Browser Compatibility:** Works across all modern evergreen browsers (Chrome, Safari, Firefox, Edge) and mobile touch screens.

---

## 6. MVP Roadmap & Out of Scope

### In Scope (MVP)
- Shareable URL-based boards.
- Fixed 4 columns with minimal text cards.
- Drag-and-drop movement and position sorting.
- RESTful CRUD API with periodic sync.

### Out of Scope (Future Phases)
- User authentication, passwords, or team workspaces.
- Custom columns, WIP limits, or swimlanes.
- Rich text, file attachments, assignees, or due dates.
- WebSocket / SSE bi-directional streaming.
