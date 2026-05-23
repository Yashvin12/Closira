"""Tests for GET /health endpoint."""

from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Test suite for the health check endpoint."""

    def test_health_returns_200_when_db_connected(self, client: TestClient) -> None:
        """Health endpoint should return 200 with status ok when DB is available."""
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["db"] == "connected"
