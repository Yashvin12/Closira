"""Pydantic v2 schemas for the health check endpoint.

GET /health returns DB connectivity status with appropriate HTTP codes.
"""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response body for GET /health.

    Attributes:
        status: Overall system health ('ok' or 'degraded').
        db: Database connectivity ('connected' or 'unreachable').
    """

    status: str = Field(
        ...,
        description="Overall system health status",
        examples=["ok"],
    )
    db: str = Field(
        ...,
        description="Database connectivity status",
        examples=["connected"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"status": "ok", "db": "connected"},
                {"status": "degraded", "db": "unreachable"},
            ]
        }
    }
