"""Health check route.

GET /health — returns DB connectivity status with appropriate HTTP codes.
200 = healthy, 503 = degraded.
"""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.database import check_db_connection
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description=(
        "Returns the overall system health and database connectivity status. "
        "Returns HTTP 200 with status 'ok' when healthy, or HTTP 503 with "
        "status 'degraded' when the database is unreachable."
    ),
    openapi_extra={
        "responses": {
            "200": {
                "description": "System is healthy",
                "content": {
                    "application/json": {
                        "example": {"status": "ok", "db": "connected"}
                    }
                },
            },
            "503": {
                "description": "System is degraded",
                "content": {
                    "application/json": {
                        "example": {"status": "degraded", "db": "unreachable"}
                    }
                },
            },
        }
    },
)
def health_check() -> JSONResponse:
    """Check system health and database connectivity.

    Returns:
        JSONResponse with health status and appropriate HTTP status code.
    """
    db_connected = check_db_connection()

    if db_connected:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "ok", "db": "connected"},
        )

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "degraded", "db": "unreachable"},
    )
