import os
import tempfile

# Point at a throwaway SQLite file for the whole test session, isolated from
# the dev database. Must happen before nookan_backend is imported, since
# config.py/database.py read DATABASE_URL at import time.
_tmp_dir = tempfile.mkdtemp(prefix="nookan-test-db-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmp_dir, 'test.db')}"

import pytest
from fastapi.testclient import TestClient

from nookan_backend import db
from nookan_backend.main import app


@pytest.fixture(autouse=True)
def _reset_db():
    """Start each test with an empty database."""
    db.reset()
    yield
    db.reset()


@pytest.fixture
def client():
    return TestClient(app)
