"""Tests for POST /enquiry/{id}/followup endpoint."""

from fastapi.testclient import TestClient


class TestFollowUp:
    """Test suite for POST /enquiry/{id}/followup."""

    def test_schedule_followup_success(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """POST /enquiry/{id}/followup should return 200 with confirmation."""
        enquiry_id = sample_enquiry["job_id"]
        response = client.post(
            f"/enquiry/{enquiry_id}/followup",
            json={"delay_minutes": 30},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["enquiry_id"] == enquiry_id
        assert body["delay_minutes"] == 30
        assert body["status"] == "followed_up"

    def test_schedule_followup_with_template(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """Follow-up should accept an optional message_template."""
        enquiry_id = sample_enquiry["job_id"]
        response = client.post(
            f"/enquiry/{enquiry_id}/followup",
            json={
                "delay_minutes": 15,
                "message_template": "Hi {customer_name}, following up.",
            },
        )
        assert response.status_code == 200

    def test_schedule_followup_invalid_delay(
        self,
        client: TestClient,
        sample_enquiry: dict,
    ) -> None:
        """Follow-up should return 422 for delay_minutes < 1."""
        enquiry_id = sample_enquiry["job_id"]
        response = client.post(
            f"/enquiry/{enquiry_id}/followup",
            json={"delay_minutes": 0},
        )
        assert response.status_code == 422

    def test_schedule_followup_not_found(self, client: TestClient) -> None:
        """Follow-up should return 404 for non-existent enquiry."""
        response = client.post(
            "/enquiry/nonexistent-id/followup",
            json={"delay_minutes": 30},
        )
        assert response.status_code == 404
