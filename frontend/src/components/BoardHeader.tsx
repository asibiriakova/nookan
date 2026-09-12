import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SyncState } from '../hooks/useBoard';

interface Props {
  title: string;
  onRename: (title: string) => void;
  sync: SyncState;
}

export function BoardHeader({ title, onRename, sync }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [copied, setCopied] = useState(false);
  const [syncedTitle, setSyncedTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft aligned with the board's title as it changes remotely
  // (another tab renaming it), unless the user is actively editing —
  // adjusted during render per https://react.dev/learn/you-might-not-need-an-effect.
  if (title !== syncedTitle && !editing) {
    setSyncedTitle(title);
    setDraft(title);
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    else setDraft(title);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard API can fail (permissions, insecure context); fall back silently.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <header className="board-header">
      <Link to="/" className="glass-button glass-button--small board-header__home">
        ← Home
      </Link>

      <div className="board-header__title">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <h1 onClick={() => setEditing(true)} title="Click to rename">
            {title}
          </h1>
        )}
        <span className={`sync-indicator sync-indicator--${sync}`}>
          {sync === 'syncing' && 'Syncing…'}
          {sync === 'idle' && 'Synced'}
          {sync === 'error' && 'Offline — retrying'}
        </span>
      </div>

      <button type="button" className="glass-button glass-button--small" onClick={copyLink}>
        {copied ? 'Link copied!' : 'Copy share link'}
      </button>
    </header>
  );
}
