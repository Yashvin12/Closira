"""Unit tests for the SOP matcher engine.

Covers all 8 SOPs with positive matches, edge cases (empty message,
no match), word-boundary correctness, and confidence scoring.
"""

import pytest

from app.services.sop_matcher import match, SOPS


class TestSOPMatching:
    """Tests for the SOP keyword matching engine."""

    # ── Positive Matches — each SOP should match its keywords ─────────────

    def test_pricing_inquiry_matches(self) -> None:
        """Pricing keywords like 'price', 'cost' should match Pricing Inquiry."""
        result = match("What is your pricing for enterprise?")
        assert result is not None
        assert result["name"] == "Pricing Inquiry"
        assert result["confidence"] >= 1

    def test_pricing_matches_discount_keyword(self) -> None:
        """'discount' is a pricing keyword."""
        result = match("Do you offer any discount on annual plans?")
        assert result is not None
        assert result["name"] == "Pricing Inquiry"

    def test_booking_appointment_matches(self) -> None:
        """'book appointment' should match Booking & Appointment."""
        result = match("I want to book an appointment for next Tuesday")
        assert result is not None
        assert result["name"] == "Booking & Appointment"

    def test_booking_matches_schedule(self) -> None:
        """'schedule' is a booking keyword."""
        result = match("Can we schedule a demo for Thursday?")
        assert result is not None
        assert result["name"] == "Booking & Appointment"

    def test_complaint_resolution_matches(self) -> None:
        """'complaint' and 'broken' should match Complaint Resolution."""
        result = match("I have a complaint about my broken product")
        assert result is not None
        assert result["name"] == "Complaint Resolution"

    def test_product_information_matches(self) -> None:
        """'product specification' should match Product Information."""
        result = match("Can you send me the product specification sheet?")
        assert result is not None
        assert result["name"] == "Product Information"

    def test_partnership_matches(self) -> None:
        """'partner' should match Partnership & Collaboration."""
        result = match("We're interested in becoming a partner for your products")
        assert result is not None
        assert result["name"] == "Partnership & Collaboration"

    def test_billing_payment_matches(self) -> None:
        """'billing' and 'charged' should match Billing & Payment SOP."""
        result = match("I've been charged twice on my billing statement")
        assert result is not None
        assert result["name"] == "Billing & Payment"

    def test_billing_matches_refund(self) -> None:
        """'refund' is a billing keyword."""
        result = match("I need a refund for the duplicate transaction")
        assert result is not None
        assert result["name"] == "Billing & Payment"

    def test_billing_matches_invoice(self) -> None:
        """'invoice' is a billing keyword."""
        result = match("Can you send me the invoice for last month?")
        assert result is not None
        assert result["name"] == "Billing & Payment"

    def test_technical_support_matches(self) -> None:
        """'not working' and 'error' should match Technical Support."""
        result = match("The app is not working and I keep getting an error")
        assert result is not None
        assert result["name"] == "Technical Support"

    def test_technical_support_matches_access_revoked(self) -> None:
        """'access revoked' should match Technical Support."""
        result = match("Our team's access has been revoked and we need it back")
        assert result is not None
        assert result["name"] == "Technical Support"

    def test_general_inquiry_matches(self) -> None:
        """'hello help' should match General Inquiry."""
        result = match("Hello, I need some help please")
        assert result is not None
        assert result["name"] == "General Inquiry"

    # ── Edge Cases ────────────────────────────────────────────────────────

    def test_empty_message_returns_none(self) -> None:
        """An empty message should not match any SOP."""
        result = match("")
        assert result is None

    def test_nonsense_returns_none(self) -> None:
        """Gibberish should not match any SOP."""
        result = match("asdfghjkl qwertyuiop zxcvbnm")
        assert result is None

    def test_purely_numeric_returns_none(self) -> None:
        """Pure numbers should not match any SOP."""
        result = match("1234567890")
        assert result is None

    # ── Word Boundary Tests ───────────────────────────────────────────────

    def test_price_does_not_match_surprise(self) -> None:
        """'price' should NOT match inside 'surprise' (word boundary check)."""
        result = match("What a surprise to see you here")
        # 'surprise' contains 'price' as a substring but should NOT match
        # because of word-boundary regex
        if result is not None:
            assert result["name"] != "Pricing Inquiry"

    def test_book_does_not_match_facebook(self) -> None:
        """'book' should NOT match inside 'facebook' (word boundary check)."""
        result = match("I saw your facebook page")
        if result is not None:
            assert result["name"] != "Booking & Appointment"

    # ── Confidence Scoring ────────────────────────────────────────────────

    def test_multiple_keywords_increase_confidence(self) -> None:
        """More keyword hits should produce higher confidence."""
        single = match("What is the price?")
        multi = match("What is the price for the subscription plan with a discount?")
        assert single is not None
        assert multi is not None
        assert multi["confidence"] > single["confidence"]

    def test_best_sop_wins_when_multiple_match(self) -> None:
        """When keywords from multiple SOPs are present, highest score wins."""
        # "billing invoice refund" has 3 Billing keywords
        result = match("I need a billing invoice and refund immediately")
        assert result is not None
        assert result["name"] == "Billing & Payment"
        assert result["confidence"] >= 3

    # ── Enquiry ID Pass-through ───────────────────────────────────────────

    def test_enquiry_id_does_not_affect_result(self) -> None:
        """Passing enquiry_id should not change the match result."""
        without_id = match("What is your pricing?")
        with_id = match("What is your pricing?", enquiry_id="test-123")
        assert without_id is not None
        assert with_id is not None
        assert without_id["name"] == with_id["name"]
        assert without_id["confidence"] == with_id["confidence"]

    # ── All SOPs Are Reachable ────────────────────────────────────────────

    def test_all_sops_have_keywords(self) -> None:
        """Every SOP definition must have at least one keyword."""
        for sop in SOPS:
            assert len(sop["keywords"]) > 0, f"SOP '{sop['name']}' has no keywords"

    def test_all_sops_have_suggested_response(self) -> None:
        """Every SOP must have a non-empty suggested_response."""
        for sop in SOPS:
            assert len(sop["suggested_response"]) > 0, (
                f"SOP '{sop['name']}' has no suggested_response"
            )
