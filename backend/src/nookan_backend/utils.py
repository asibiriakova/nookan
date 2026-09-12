"""Small helpers shared across routers."""

from __future__ import annotations

from datetime import UTC, datetime

from nanoid import generate as _nanoid

DEFAULT_TITLE = "Untitled Board"

# Matches the frontend mock's use of nanoid's default alphabet/size (21
# chars, ~128 bits of entropy — spec §5).
_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"


def new_id() -> str:
    return _nanoid(_ALPHABET, 21)


def now() -> str:
    return datetime.now(UTC).isoformat()


def normalize_title(title: str | None) -> str:
    """Trim, falling back to the default when blank/whitespace-only/omitted."""
    if title is None:
        return DEFAULT_TITLE
    trimmed = title.strip()
    return trimmed or DEFAULT_TITLE
