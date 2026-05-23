"""Structured JSON logging configuration.

Every log line is a valid JSON object with keys: timestamp, level, event,
enquiry_id (where applicable), and detail. No print() statements anywhere
in the codebase — all output goes through this logger.
"""

import json
import logging
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects.

    Output schema:
        {
            "timestamp": "2025-01-15T10:30:00.000Z",
            "level": "INFO",
            "event": "enquiry_created",
            "enquiry_id": "abc-123" | null,
            "detail": "free-form detail string"
        }
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format a log record as a JSON string.

        Args:
            record: The log record to format.

        Returns:
            A single-line JSON string representing the log entry.
        """
        log_entry: dict[str, str | None] = {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
            "level": record.levelname,
            "event": getattr(record, "event", record.getMessage()),
            "enquiry_id": getattr(record, "enquiry_id", None),
            "detail": getattr(record, "detail", None),
        }
        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configure the application logger with JSON formatting.

    Args:
        level: The logging level name (DEBUG, INFO, WARNING, ERROR, CRITICAL).

    Returns:
        The configured root application logger.
    """
    logger = logging.getLogger("closira")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Avoid duplicate handlers on repeated calls
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    # Prevent propagation to root logger (avoids double output)
    logger.propagate = False

    return logger


# Module-level logger instance, ready for import
logger = setup_logging()
