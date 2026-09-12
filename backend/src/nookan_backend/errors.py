"""Shared error types."""

from __future__ import annotations


class NotFoundError(Exception):
    """Raised when a board or card id doesn't exist.

    Carries a human-readable message matching the `Error` schema in
    openapi.yaml, e.g. "Board not found" / "Card not found".
    """

    def __init__(self, what: str) -> None:
        self.message = f"{what} not found"
        super().__init__(self.message)
