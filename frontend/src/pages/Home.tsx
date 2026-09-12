import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as backend from '../api/backend';
import { getRecentBoards, removeRecentBoard } from '../lib/recentBoards';
import type { RecentBoard } from '../lib/recentBoards';

function extractBoardId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/b\/([\w-]+)\/?$/);
  if (match) return match[1];
  if (/^[\w-]+$/.test(trimmed)) return trimmed;
  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinValue, setJoinValue] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentBoard[]>(() => getRecentBoards());

  async function handleCreate() {
    setCreating(true);
    try {
      const { id } = await backend.createBoard();
      navigate(`/b/${id}`);
    } finally {
      setCreating(false);
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = extractBoardId(joinValue);
    if (!id) {
      setJoinError("That doesn't look like a board link or ID.");
      return;
    }
    setJoinError(null);
    navigate(`/b/${id}`);
  }

  function handleForget(id: string) {
    removeRecentBoard(id);
    setRecent(getRecentBoards());
  }

  return (
    <div className="home">
      <div className="home__hero">
        <h1>Nookan</h1>
        <p>A lightweight kanban board. No sign-up — create a board and share the link.</p>
        <button
          type="button"
          className="glass-button glass-button--primary glass-button--large"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? 'Creating…' : 'Create a new board'}
        </button>
      </div>

      <form className="home__join" onSubmit={handleJoin}>
        <label htmlFor="join-input">Have a board link?</label>
        <div className="home__join-row">
          <input
            id="join-input"
            type="text"
            placeholder="Paste a board link or ID…"
            value={joinValue}
            onChange={(e) => setJoinValue(e.target.value)}
          />
          <button type="submit" className="glass-button">
            Go
          </button>
        </div>
        {joinError && <p className="home__join-error">{joinError}</p>}
      </form>

      {recent.length > 0 && (
        <div className="home__recent">
          <h2>Recent boards on this device</h2>
          <ul>
            {recent.map((b) => (
              <li key={b.id} className="glass-panel">
                <Link to={`/b/${b.id}`}>{b.title}</Link>
                <button type="button" className="icon-btn" onClick={() => handleForget(b.id)} title="Remove from list">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
