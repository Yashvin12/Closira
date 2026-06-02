"""Tests for POST /enquiry/{id}/escalate endpoint."""

from fastapi.testclient import TestClient


class TestEscalation:
    """Test suite for POST /enquiry/{id}/escalate."""

    def test_escalate_success(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """POST /enquiry/{id}/escalate should return 200 on first escalation."""
        enquiry_id = sample_enquiry["enquiry_id"]
        response = client.post(
            f"/enquiry/{enquiry_id}/escalate",
            json={"reason": "VIP customer needs immediate attention."},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["enquiry_id"] == enquiry_id
        assert body["status"] == "escalated"
        assert body["reason"] == "VIP customer needs immediate attention."

    def test_escalate_idempotent_409(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """Escalating an already-escalated enquiry should return 409."""
        enquiry_id = sample_enquiry["enquiry_id"]

        # First escalation
        client.post(
            f"/enquiry/{enquiry_id}/escalate",
            json={"reason": "First reason"},
        )

        # Second escalation — should be 409
        response = client.post(
            f"/enquiry/{enquiry_id}/escalate",
            json={"reason": "Second reason"},
        )
        assert response.status_code == 409
        body = response.json()
        assert "already escalated" in body["error"].lower()

    def test_escalate_empty_reason(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """Escalation with empty reason should return 422."""
        enquiry_id = sample_enquiry["enquiry_id"]
        response = client.post(
            f"/enquiry/{enquiry_id}/escalate",
            json={"reason": ""},
        )
        assert response.status_code == 422

    def test_escalate_not_found(self, client: TestClient) -> None:
        """Escalation of non-existent enquiry should return 404."""
        response = client.post(
            "/enquiry/nonexistent-id/escalate",
            json={"reason": "Test reason"},
        )
        assert response.status_code == 404
