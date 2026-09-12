"""Tests for card endpoints, per openapi.yaml."""

import pytest


@pytest.fixture
def board_id(client):
    return client.post("/api/v1/boards").json()["id"]


class TestCreateCard:
    def test_creates_a_card_scoped_to_its_board(self, client, board_id):
        resp = client.post(
            f"/api/v1/boards/{board_id}/cards",
            json={"title": "Write tests", "status": "BACKLOG", "position": 1000},
        )
        assert resp.status_code == 201
        card = resp.json()
        assert card["board_id"] == board_id
        assert card["title"] == "Write tests"
        assert card["status"] == "BACKLOG"
        assert card["position"] == 1000
        assert "id" in card and "created_at" in card and "updated_at" in card

        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert len(board["cards"]) == 1

    def test_404_for_unknown_board(self, client):
        resp = client.post(
            "/api/v1/boards/nope/cards",
            json={"title": "x", "status": "BACKLOG", "position": 1000},
        )
        assert resp.status_code == 404
        assert resp.json() == {"error": "Board not found"}

    def test_422_when_required_fields_missing(self, client, board_id):
        resp = client.post(f"/api/v1/boards/{board_id}/cards", json={"title": "x"})
        assert resp.status_code == 422

    def test_422_for_invalid_status(self, client, board_id):
        resp = client.post(
            f"/api/v1/boards/{board_id}/cards",
            json={"title": "x", "status": "NOT_A_STATUS", "position": 1},
        )
        assert resp.status_code == 422

    def test_each_card_gets_a_unique_id(self, client, board_id):
        make = lambda title: client.post(  # noqa: E731
            f"/api/v1/boards/{board_id}/cards",
            json={"title": title, "status": "BACKLOG", "position": 1},
        ).json()
        a, b = make("A"), make("B")
        assert a["id"] != b["id"]


class TestUpdateCard:
    def _create_card(self, client, board_id, **overrides):
        payload = {"title": "Draft", "status": "BACKLOG", "position": 1000, **overrides}
        return client.post(f"/api/v1/boards/{board_id}/cards", json=payload).json()

    def test_partially_updates_status_only(self, client, board_id):
        card = self._create_card(client, board_id)
        resp = client.patch(f"/api/v1/cards/{card['id']}", json={"status": "IN_PROGRESS"})
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["status"] == "IN_PROGRESS"
        assert updated["title"] == "Draft"  # untouched
        assert updated["position"] == 1000  # untouched

    def test_partially_updates_title_only(self, client, board_id):
        card = self._create_card(client, board_id, status="IN_PROGRESS")
        resp = client.patch(f"/api/v1/cards/{card['id']}", json={"title": "Final"})
        updated = resp.json()
        assert updated["title"] == "Final"
        assert updated["status"] == "IN_PROGRESS"  # untouched

    def test_partially_updates_position_only(self, client, board_id):
        card = self._create_card(client, board_id)
        resp = client.patch(f"/api/v1/cards/{card['id']}", json={"position": 1500})
        assert resp.json()["position"] == 1500

    def test_updates_multiple_fields_at_once(self, client, board_id):
        card = self._create_card(client, board_id)
        resp = client.patch(
            f"/api/v1/cards/{card['id']}",
            json={"title": "Done deal", "status": "DONE", "position": 5000},
        )
        updated = resp.json()
        assert updated["title"] == "Done deal"
        assert updated["status"] == "DONE"
        assert updated["position"] == 5000

    def test_404_for_unknown_card(self, client):
        resp = client.patch("/api/v1/cards/nope", json={"title": "x"})
        assert resp.status_code == 404
        assert resp.json() == {"error": "Card not found"}


class TestDeleteCard:
    def test_deletes_a_card(self, client, board_id):
        card = client.post(
            f"/api/v1/boards/{board_id}/cards",
            json={"title": "Temp", "status": "BACKLOG", "position": 1000},
        ).json()

        resp = client.delete(f"/api/v1/cards/{card['id']}")
        assert resp.status_code == 204
        assert resp.content == b""

        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert board["cards"] == []

    def test_404_for_unknown_card(self, client):
        resp = client.delete("/api/v1/cards/nope")
        assert resp.status_code == 404
        assert resp.json() == {"error": "Card not found"}

    def test_deleting_one_card_does_not_affect_others(self, client, board_id):
        c1 = client.post(
            f"/api/v1/boards/{board_id}/cards",
            json={"title": "Keep", "status": "BACKLOG", "position": 1},
        ).json()
        c2 = client.post(
            f"/api/v1/boards/{board_id}/cards",
            json={"title": "Remove", "status": "BACKLOG", "position": 2},
        ).json()

        client.delete(f"/api/v1/cards/{c2['id']}")

        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert [c["id"] for c in board["cards"]] == [c1["id"]]
