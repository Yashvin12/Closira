"""SOP (Standard Operating Procedure) matching engine.

Defines 5 SOPs with name, keywords, and suggested_response. Matching logic
lowercases the message and checks if any keyword appears as a substring.
First match wins. No match → returns None (caller should auto-escalate).
"""

import logging
from typing import TypedDict

logger = logging.getLogger("closira")


class SOPDefinition(TypedDict):
    """Type definition for an SOP entry.

    Attributes:
        name: Human-readable SOP name.
        keywords: List of trigger keywords (matched case-insensitively).
        suggested_response: Pre-written response template for this SOP.
    """

    name: str
    keywords: list[str]
    suggested_response: str


class SOPMatchResult(TypedDict):
    """Result of a successful SOP match.

    Attributes:
        name: The matched SOP's name.
        suggested_response: The SOP's suggested response text.
    """

    name: str
    suggested_response: str


# ─── SOP Definitions ───────────────────────────────────────────────────────────

SOPS: list[SOPDefinition] = [
    {
        "name": "Pricing Inquiry",
        "keywords": ["price", "pricing", "cost", "rate", "fee", "charge", "quote"],
        "suggested_response": (
            "Thank you for your interest! Our pricing starts at $99/month for the "
            "Starter plan. I'd be happy to walk you through our plans and find the "
            "best fit for your needs. Would you like to schedule a quick call?"
        ),
    },
    {
        "name": "Booking & Appointment",
        "keywords": ["book", "booking", "appointment", "schedule", "reserve", "availability"],
        "suggested_response": (
            "I'd love to help you book an appointment! We have availability this week. "
            "Could you share your preferred date and time? I'll get that confirmed for "
            "you right away."
        ),
    },
    {
        "name": "Complaint Resolution",
        "keywords": ["complaint", "issue", "problem", "unhappy", "dissatisfied", "broken", "defect", "refund"],
        "suggested_response": (
            "I'm sorry to hear about your experience. Your satisfaction is our top priority. "
            "I've flagged this for our support team and you'll receive a detailed response "
            "within 2 hours. Can you share your order number so we can investigate immediately?"
        ),
    },
    {
        "name": "Product Information",
        "keywords": ["feature", "product", "service", "detail", "specification", "demo", "trial"],
        "suggested_response": (
            "Great question! I'd be happy to share more details about our product. We offer "
            "a comprehensive suite of features including real-time analytics, automated "
            "workflows, and 24/7 support. Would you like a personalized demo?"
        ),
    },
    {
        "name": "Partnership & Collaboration",
        "keywords": ["partner", "partnership", "collaborate", "collaboration", "wholesale", "reseller", "affiliate"],
        "suggested_response": (
            "Thank you for your interest in partnering with us! We have several partnership "
            "models available. I'll connect you with our Business Development team who can "
            "discuss the best arrangement. Expect a response within 24 hours."
        ),
    },
]


def match(message: str) -> SOPMatchResult | None:
    """Match a message against defined SOPs.

    Lowercases the message and checks if any SOP keyword appears as a
    substring. First match wins. Returns None if no SOP matches.

    Args:
        message: The customer's enquiry message text.

    Returns:
        A SOPMatchResult with name and suggested_response if matched,
        or None if no SOP keywords were found.
    """
    message_lower = message.lower()

    for sop in SOPS:
        for keyword in sop["keywords"]:
            if keyword in message_lower:
                logger.info(
                    "SOP matched",
                    extra={
                        "event": "sop_matched",
                        "enquiry_id": None,
                        "detail": f"Matched SOP '{sop['name']}' on keyword '{keyword}'",
                    },
                )
                return {
                    "name": sop["name"],
                    "suggested_response": sop["suggested_response"],
                }

    logger.warning(
        "No SOP match found",
        extra={
            "event": "sop_no_match",
            "enquiry_id": None,
            "detail": f"Message did not match any SOP keywords: {message[:100]}",
        },
    )
    return None
