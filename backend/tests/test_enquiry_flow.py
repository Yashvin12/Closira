"""Integration tests for the full enquiry lifecycle.

Tests the complete flow:
1. POST /enquiry with SOP-matching keywords → status=qualified
2. POST /enquiry with no SOP keywords → status=escalated
3. POST /enquiry/{id}/resolve → status=resolved
4. POST /enquiry/{id}/complete-followup → status=resolved
5. GET /enquiries → lists all enquiries with correct statuses
6. GET /enquiry/{id}/history → returns timeline events
"""

import time

from fastapi.testclient import TestClient


class TestEnquiryCreation:
    """Tests for POST /enquiry — synchronous SOP matching."""

    def test_pricing_enquiry_is_qualified(self, client: TestClient) -> None:
        """A pricing-related enquiry should match the Pricing SOP and be qualified."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "whatsapp",
                "customer_name": "Test Customer",
                "message": "What is the price of your enterprise plan?",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "qualified"
        assert body["sop_matched"] == "Pricing Inquiry"
        assert body["suggested_response"] is not None
        assert body["enquiry_id"] is not None

    def test_booking_enquiry_is_qualified(self, client: TestClient) -> None:
        """A booking-related enquiry should match the Booking SOP."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Jane Doe",
                "message": "I want to book an appointment for a consultation next week.",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "qualified"
        assert body["sop_matched"] == "Booking & Appointment"

    def test_complaint_enquiry_is_qualified(self, client: TestClient) -> None:
        """A complaint should match the Complaint Resolution SOP."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "call",
                "customer_name": "Emily Chen",
                "message": "I have a serious complaint about my broken product.",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "qualified"
        assert body["sop_matched"] == "Complaint Resolution"

    def test_billing_enquiry_is_qualified(self, client: TestClient) -> None:
        """A billing enquiry should match the Billing & Payment SOP."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Liam Foster",
                "message": "I've been charged twice on my billing invoice. Please refund.",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "qualified"
        assert body["sop_matched"] == "Billing & Payment"

    def test_technical_support_enquiry_is_qualified(self, client: TestClient) -> None:
        """A technical issue should match the Technical Support SOP."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "call",
                "customer_name": "Anika Weber",
                "message": "The app is not working and our access has been revoked.",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "qualified"
        assert body["sop_matched"] == "Technical Support"

    def test_unknown_message_is_escalated(self, client: TestClient) -> None:
        """A message with no SOP keywords should auto-escalate."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "whatsapp",
                "customer_name": "Random Person",
                "message": "asdfjkl qwerty zxcvbnm 12345",
            },
        )
        assert response.status_code == 201
        body = response.json()
        assert body["status"] == "escalated"
        assert body["sop_matched"] is None

    def test_invalid_channel_returns_422(self, client: TestClient) -> None:
        """An invalid channel should be rejected by Pydantic validation."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "telegram",
                "customer_name": "Test",
                "message": "Hello",
            },
        )
        assert response.status_code == 422

    def test_empty_message_returns_422(self, client: TestClient) -> None:
        """An empty message should be rejected (min_length=1)."""
        response = client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Test",
                "message": "",
            },
        )
        assert response.status_code == 422


class TestEnquiryList:
    """Tests for GET /enquiries."""

    def test_list_enquiries_returns_200(self, client: TestClient) -> None:
        """GET /enquiries should return 200 with data array."""
        response = client.get("/enquiries")
        assert response.status_code == 200
        body = response.json()
        assert "data" in body
        assert "total" in body
        assert isinstance(body["data"], list)

    def test_list_enquiries_after_creation(self, client: TestClient) -> None:
        """After creating an enquiry, it should appear in the list."""
        # Create
        client.post(
            "/enquiry",
            json={
                "channel": "whatsapp",
                "customer_name": "List Test",
                "message": "I need pricing information",
            },
        )
        # List
        response = client.get("/enquiries")
        body = response.json()
        assert body["total"] >= 1
        names = [e["customer_name"] for e in body["data"]]
        assert "List Test" in names

    def test_list_enquiries_with_status_filter(self, client: TestClient) -> None:
        """GET /enquiries?status=qualified should only return qualified items."""
        # Create a qualified enquiry
        client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Filter Test",
                "message": "What are your pricing plans?",
            },
        )
        # Filter
        response = client.get("/enquiries?status=qualified")
        body = response.json()
        for item in body["data"]:
            assert item["status"] == "qualified"


class TestEnquiryHistory:
    """Tests for GET /enquiry/{id}/history."""

    def test_history_returns_timeline(self, client: TestClient) -> None:
        """History should include created, sop_matched, and qualified events."""
        # Create
        create_resp = client.post(
            "/enquiry",
            json={
                "channel": "whatsapp",
                "customer_name": "History Test",
                "message": "I want to book an appointment",
            },
        )
        enquiry_id = create_resp.json()["enquiry_id"]

        # Get history
        response = client.get(f"/enquiry/{enquiry_id}/history")
        assert response.status_code == 200
        body = response.json()
        assert body["enquiry"]["status"] == "qualified"
        event_types = [e["event_type"] for e in body["timeline"]]
        assert "created" in event_types
        assert "sop_matched" in event_types
        assert "qualified" in event_types


class TestResolveEndpoint:
    """Tests for POST /enquiry/{id}/resolve."""

    def test_resolve_escalated_enquiry(self, client: TestClient) -> None:
        """Resolving an escalated enquiry should set status to 'resolved'."""
        # Create an auto-escalated enquiry
        create_resp = client.post(
            "/enquiry",
            json={
                "channel": "call",
                "customer_name": "Resolve Test",
                "message": "asdfjkl random nonsense",
            },
        )
        enquiry_id = create_resp.json()["enquiry_id"]
        assert create_resp.json()["status"] == "escalated"

        # Resolve it
        resolve_resp = client.post(f"/enquiry/{enquiry_id}/resolve")
        assert resolve_resp.status_code == 200
        body = resolve_resp.json()
        assert body["status"] == "resolved"

    def test_resolve_non_escalated_returns_error(self, client: TestClient) -> None:
        """Resolving a non-escalated enquiry should fail."""
        # Create a qualified enquiry
        create_resp = client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Resolve Fail Test",
                "message": "What is the pricing?",
            },
        )
        enquiry_id = create_resp.json()["enquiry_id"]
        assert create_resp.json()["status"] == "qualified"

        # Try to resolve — should fail with 400/409/500 (depends on error handler)
        resolve_resp = client.post(f"/enquiry/{enquiry_id}/resolve")
        assert resolve_resp.status_code >= 400


class TestCompleteFollowupEndpoint:
    """Tests for POST /enquiry/{id}/complete-followup."""

    def test_complete_followup(self, client: TestClient) -> None:
        """Completing a followed-up enquiry should set status to 'resolved'."""
        # Create and qualify an enquiry
        create_resp = client.post(
            "/enquiry",
            json={
                "channel": "email",
                "customer_name": "Followup Test",
                "message": "I want to book an appointment",
            },
        )
        enquiry_id = create_resp.json()["enquiry_id"]

        # Schedule a follow-up
        followup_resp = client.post(
            f"/enquiry/{enquiry_id}/followup",
            json={"delay_minutes": 30},
        )
        assert followup_resp.status_code == 200

        # Complete it
        complete_resp = client.post(f"/enquiry/{enquiry_id}/complete-followup")
        assert complete_resp.status_code == 200
        body = complete_resp.json()
        assert body["status"] == "resolved"
