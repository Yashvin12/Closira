"""Tests for POST /enquiry and GET /enquiry/{id}/history endpoints."""

from fastapi.testclient import TestClient


class TestCreateEnquiry:
    """Test suite for POST /enquiry."""

    def test_create_enquiry_returns_201(self, client: TestClient) -> None:
        """POST /enquiry should return 201 Created with an enquiry_id and SOP match."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "whatsapp",
                "customer_name": "Sarah Mitchell",
                "message": "What are your pricing plans?",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert "enquiry_id" in body
        assert body["status"] in ("qualified", "escalated")
        assert "message" in body

    def test_create_enquiry_with_email_channel(self, client: TestClient) -> None:
        """POST /enquiry should accept 'email' as a valid channel."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Raj Patel",
                "message": "I'd like to book a demo.",
            },
        )
        assert response.status_code == 201

    def test_create_enquiry_with_call_channel(self, client: TestClient) -> None:
        """POST /enquiry should accept 'call' as a valid channel."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "call",
                "customer_name": "Emily Chen",
                "message": "I have a complaint about my order.",
            },
        )
        assert response.status_code == 201

    def test_create_enquiry_invalid_channel(self, client: TestClient) -> None:
        """POST /enquiry should return 422 for invalid channel values."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "telegram",
                "customer_name": "Test User",
                "message": "Hello",
            },
        )
        assert response.status_code == 422

    def test_create_enquiry_missing_fields(self, client: TestClient) -> None:
        """POST /enquiry should return 422 when required fields are missing."""
        response = client.post("/enquiry", json={"channel": "whatsapp"})
        assert response.status_code == 422

    def test_create_enquiry_empty_name(self, client: TestClient) -> None:
        """POST /enquiry should return 422 for empty customer_name."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "whatsapp",
                "customer_name": "",
                "message": "Hello",
            },
        )
        assert response.status_code == 422


class TestEnquiryHistory:
    """Test suite for GET /enquiry/{id}/history."""

    def test_history_returns_structured_response(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """GET /enquiry/{id}/history should return enquiry details and timeline."""
        enquiry_id = sample_enquiry["enquiry_id"]
        response = client.get(f"/enquiry/{enquiry_id}/history")
        assert response.status_code == 200

        body = response.json()
        assert "enquiry" in body
        assert "timeline" in body
        assert body["enquiry"]["id"] == enquiry_id
        assert len(body["timeline"]) >= 1  # At least 'created' event

    def test_history_not_found(self, client: TestClient) -> None:
        """GET /enquiry/{id}/history should return 404 for non-existent ID."""
        response = client.get("/enquiry/nonexistent-id/history")
        assert response.status_code == 404
        body = response.json()
        assert "not found" in body["error"].lower()
