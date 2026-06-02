"""SOP (Standard Operating Procedure) matching engine.

Defines 8 SOPs with name, keywords, and suggested_response. Matching uses
word-boundary-aware regex to avoid false positives (e.g. "price" in "surprise").
Scores each SOP by keyword hit count and picks the highest-confidence match.
No match → returns None (caller should auto-escalate).

Industry-grade improvements over v1:
- Word-boundary matching prevents substring false positives
- Confidence scoring picks best SOP, not just first match
- 8 SOPs cover all common CRM interaction categories
- Logging includes enquiry_id for end-to-end traceability
"""

import logging
import re
from typing import TypedDict

logger = logging.getLogger("closira")


class SOPDefinition(TypedDict):
    """Type definition for an SOP entry.

    Attributes:
        name: Human-readable SOP name.
        keywords: List of trigger keywords (matched case-insensitively with word boundaries).
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
        confidence: Number of keyword hits (higher = more confident).
    """

    name: str
    suggested_response: str
    confidence: int


# ─── SOP Definitions ───────────────────────────────────────────────────────────

SOPS: list[SOPDefinition] = [
    {
        "name": "Pricing Inquiry",
        "keywords": [
            "price", "pricing", "cost", "rate", "fee", "charge", "quote",
            "subscription", "plan", "tier", "discount", "coupon", "promo",
            "budget", "afford", "expensive", "cheap", "license",
        ],
        "suggested_response": (
            "Thank you for your interest! Our pricing starts at $99/month for the "
            "Starter plan. I'd be happy to walk you through our plans and find the "
            "best fit for your needs. Would you like to schedule a quick call?"
        ),
    },
    {
        "name": "Booking & Appointment",
        "keywords": [
            "book", "booking", "appointment", "schedule", "reserve",
            "availability", "calendar", "slot", "meeting", "consultation",
            "demo", "session", "reschedule",
        ],
        "suggested_response": (
            "I'd love to help you book an appointment! We have availability this week. "
            "Could you share your preferred date and time? I'll get that confirmed for "
            "you right away."
        ),
    },
    {
        "name": "Complaint Resolution",
        "keywords": [
            "complaint", "issue", "problem", "unhappy", "dissatisfied",
            "broken", "defect", "damaged", "frustrated", "unacceptable",
            "terrible", "worst", "disappointed",
        ],
        "suggested_response": (
            "I'm sorry to hear about your experience. Your satisfaction is our top priority. "
            "I've flagged this for our support team and you'll receive a detailed response "
            "within 2 hours. Can you share your order number so we can investigate immediately?"
        ),
    },
    {
        "name": "Product Information",
        "keywords": [
            "feature", "product", "service", "detail", "specification",
            "trial", "capability", "integrate", "integration",
            "how does", "what does", "tell me about", "information",
        ],
        "suggested_response": (
            "Great question! I'd be happy to share more details about our product. We offer "
            "a comprehensive suite of features including real-time analytics, automated "
            "workflows, and 24/7 support. Would you like a personalized demo?"
        ),
    },
    {
        "name": "Partnership & Collaboration",
        "keywords": [
            "partner", "partnership", "collaborate", "collaboration",
            "wholesale", "reseller", "affiliate", "agency", "white label",
            "referral", "commission", "joint venture",
        ],
        "suggested_response": (
            "Thank you for your interest in partnering with us! We have several partnership "
            "models available. I'll connect you with our Business Development team who can "
            "discuss the best arrangement. Expect a response within 24 hours."
        ),
    },
    {
        "name": "Billing & Payment",
        "keywords": [
            "bill", "billing", "invoice", "payment", "charged", "charge",
            "refund", "overcharged", "double charged", "transaction",
            "receipt", "credit card", "bank", "statement", "subscription",
        ],
        "suggested_response": (
            "I understand billing concerns need immediate attention. I've flagged this to "
            "our finance team who will review your account and process any necessary "
            "adjustments within 1-2 business days. Can you share your account email or "
            "invoice number so we can look into this right away?"
        ),
    },
    {
        "name": "Technical Support",
        "keywords": [
            "bug", "error", "crash", "not working", "doesn't work",
            "login", "password", "access", "revoked", "locked out",
            "outage", "down", "slow", "glitch", "fix", "troubleshoot",
            "reset", "update", "install", "setup",
        ],
        "suggested_response": (
            "I'm sorry you're experiencing technical difficulties. Let me help you "
            "troubleshoot this right away. Could you describe exactly what's happening "
            "and any error messages you're seeing? I'll escalate to our technical team "
            "if needed to get this resolved as quickly as possible."
        ),
    },
    {
        "name": "General Inquiry",
        "keywords": [
            "hello", "hi", "hey", "help", "question", "ask", "know",
            "curious", "wondering", "inquiry", "enquiry", "contact",
            "reach", "talk", "speak", "support", "assist",
        ],
        "suggested_response": (
            "Thank you for reaching out! I'm here to help. Could you share a bit more "
            "about what you're looking for? Whether it's product information, pricing, "
            "booking, or support — I'll make sure you get the right assistance."
        ),
    },
]

# Pre-compile keyword patterns for performance.
# Each pattern uses word boundaries (\b) to avoid substring false positives.
_COMPILED_PATTERNS: list[list[re.Pattern[str]]] = []
for sop in SOPS:
    patterns = []
    for keyword in sop["keywords"]:
        # For multi-word keywords, match the exact phrase
        # For single words, use word boundaries
        escaped = re.escape(keyword)
        patterns.append(re.compile(rf"\b{escaped}\b", re.IGNORECASE))
    _COMPILED_PATTERNS.append(patterns)


def match(message: str, enquiry_id: str | None = None) -> SOPMatchResult | None:
    """Match a message against defined SOPs using word-boundary regex.

    Scores each SOP by counting keyword hits and returns the one with the
    highest confidence (most keyword matches). Ties are broken by SOP
    definition order (earlier SOPs are more specific and preferred).

    Args:
        message: The customer's enquiry message text.
        enquiry_id: Optional enquiry ID for structured logging.

    Returns:
        A SOPMatchResult with name, suggested_response, and confidence
        if matched, or None if no SOP keywords were found.
    """
    best_match: SOPMatchResult | None = None
    best_score = 0

    for i, sop in enumerate(SOPS):
        score = 0
        matched_keywords: list[str] = []

        for j, pattern in enumerate(_COMPILED_PATTERNS[i]):
            if pattern.search(message):
                score += 1
                matched_keywords.append(sop["keywords"][j])

        # A match requires at least 1 keyword hit.
        # Prefer higher scores; on tie, prefer earlier (more specific) SOP.
        if score > best_score:
            best_score = score
            best_match = {
                "name": sop["name"],
                "suggested_response": sop["suggested_response"],
                "confidence": score,
            }
            logger.debug(
                "SOP candidate found",
                extra={
                    "event": "sop_candidate",
                    "enquiry_id": enquiry_id,
                    "detail": (
                        f"SOP '{sop['name']}' scored {score} on keywords: "
                        f"{', '.join(matched_keywords)}"
                    ),
                },
            )

    if best_match is not None:
        logger.info(
            "SOP matched",
            extra={
                "event": "sop_matched",
                "enquiry_id": enquiry_id,
                "detail": (
                    f"Best match: '{best_match['name']}' with confidence "
                    f"{best_match['confidence']}"
                ),
            },
        )
        return best_match

    logger.warning(
        "No SOP match found",
        extra={
            "event": "sop_no_match",
            "enquiry_id": enquiry_id,
            "detail": f"Message did not match any SOP keywords: {message[:100]}",
        },
    )
    return None
