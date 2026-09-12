"""Tests for POST/GET/PATCH /api/v1/boards[/{board_id}], per openapi.yaml."""


class TestCreateBoard:
    def test_creates_a_board_with_default_title_and_share_url(self, client):
        resp = client.post("/api/v1/boards")
        assert resp.status_code == 201
        body = resp.json()
        assert len(body["id"]) == 21  # NanoID, ~128 bits entropy (spec §5)
        assert body["url"] == f"/b/{body['id']}"

        board = client.get(f"/api/v1/boards/{body['id']}").json()
        assert board["title"] == "Untitled Board"
        assert board["cards"] == []

    def test_creates_a_board_with_no_body_at_all(self, client):
        # requestBody is optional per the spec.
        resp = client.post("/api/v1/boards", headers={"Content-Type": "application/json"})
        assert resp.status_code == 201

    def test_uses_a_trimmed_custom_title(self, client):
        resp = client.post("/api/v1/boards", json={"title": "  Sprint 12  "})
        board_id = resp.json()["id"]
        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert board["title"] == "Sprint 12"

    def test_falls_back_to_default_title_for_blank_string(self, client):
        resp = client.post("/api/v1/boards", json={"title": "   "})
        board_id = resp.json()["id"]
        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert board["title"] == "Untitled Board"

    def test_each_board_gets_a_unique_id(self, client):
        a = client.post("/api/v1/boards").json()
        b = client.post("/api/v1/boards").json()
        assert a["id"] != b["id"]


class TestGetBoard:
    def test_404_for_unknown_board(self, client):
        resp = client.get("/api/v1/boards/does-not-exist")
        assert resp.status_code == 404
        assert resp.json() == {"error": "Board not found"}

    def test_returns_cards_sorted_by_position(self, client):
        board_id = client.post("/api/v1/boards").json()["id"]
        for title, position in [("Third", 300), ("First", 100), ("Second", 200)]:
            client.post(
                f"/api/v1/boards/{board_id}/cards",
                json={"title": title, "status": "BACKLOG", "position": position},
            )

        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert [c["title"] for c in board["cards"]] == ["First", "Second", "Third"]

    def test_includes_board_metadata(self, client):
        created = client.post("/api/v1/boards", json={"title": "Sprint 12"}).json()
        board = client.get(f"/api/v1/boards/{created['id']}").json()
        assert board["id"] == created["id"]
        assert board["title"] == "Sprint 12"
        assert "created_at" in board
        assert "updated_at" in board


class TestUpdateBoard:
    def test_renames_a_board(self, client):
        board_id = client.post("/api/v1/boards", json={"title": "Old name"}).json()["id"]
        resp = client.patch(f"/api/v1/boards/{board_id}", json={"title": "New name"})
        assert resp.status_code == 200
        assert resp.json()["title"] == "New name"

        board = client.get(f"/api/v1/boards/{board_id}").json()
        assert board["title"] == "New name"

    def test_blank_title_falls_back_to_default(self, client):
        board_id = client.post("/api/v1/boards", json={"title": "Old name"}).json()["id"]
        resp = client.patch(f"/api/v1/boards/{board_id}", json={"title": "   "})
        assert resp.json()["title"] == "Untitled Board"

    def test_omitted_title_leaves_it_unchanged(self, client):
        board_id = client.post("/api/v1/boards", json={"title": "Keep me"}).json()["id"]
        resp = client.patch(f"/api/v1/boards/{board_id}", json={})
        assert resp.json()["title"] == "Keep me"

    def test_bumps_updated_at(self, client):
        board_id = client.post("/api/v1/boards").json()["id"]
        before = client.get(f"/api/v1/boards/{board_id}").json()["updated_at"]
        after = client.patch(f"/api/v1/boards/{board_id}", json={"title": "x"}).json()["updated_at"]
        assert after >= before

    def test_404_for_unknown_board(self, client):
        resp = client.patch("/api/v1/boards/nope", json={"title": "x"})
        assert resp.status_code == 404
        assert resp.json() == {"error": "Board not found"}
