import pytest
from fastapi.testclient import TestClient

from nookan_backend import db
from nookan_backend.main import app


@pytest.fixture(autouse=True)
def _reset_db():
    """Start each test with an empty mock database."""
    db.reset()
    yield
    db.reset()


@pytest.fixture
def client():
    return TestClient(app)
