"""FastAPI application factory.

Configures the app with:
- CORS middleware
- Global exception handlers (422, 404, 409, 500)
- All route modules (auth + protected CRM routes)
- Database table creation on startup
- OpenAPI metadata
"""

import logging
import traceback

from fastapi import Depends, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import enquiry, escalation, followup, health
from app.api.routes import auth as auth_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.deps import get_current_user
from app.core.logging import setup_logging
from app.services.enquiry_service import BusinessRuleError, NotFoundError

# Initialize structured logging at startup
logger = setup_logging(settings.log_level)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Closira CRM API — manages customer enquiries with automated SOP matching, "
            "escalation workflows, and follow-up scheduling."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ──────────────────────────────────────────────────

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        """Handle Pydantic validation errors with field-level detail."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": " → ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })
        logger.warning(
            "Validation error",
            extra={"event": "validation_error", "enquiry_id": None, "detail": str(errors)},
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"errors": errors},
        )

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": f"Enquiry {exc.enquiry_id} not found"},
        )

    @app.exception_handler(BusinessRuleError)
    async def business_rule_handler(request: Request, exc: BusinessRuleError) -> JSONResponse:
        logger.warning(
            "Business rule violation",
            extra={"event": "business_rule_violation", "enquiry_id": None, "detail": exc.message},
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"error": exc.message},
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Unhandled exception",
            extra={
                "event": "unhandled_exception",
                "enquiry_id": None,
                "detail": traceback.format_exc(),
            },
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error"},
        )

    # ── Routes ──────────────────────────────────────────────────────────────
    # Public: health + auth
    app.include_router(health.router)
    app.include_router(auth_router.router)

    # Protected: all CRM routes require a valid JWT
    _auth = [Depends(get_current_user)]
    app.include_router(enquiry.router, dependencies=_auth)
    app.include_router(followup.router, dependencies=_auth)
    app.include_router(escalation.router, dependencies=_auth)

    # ── Startup ─────────────────────────────────────────────────────────────

    @app.on_event("startup")
    def on_startup() -> None:
        """Create database tables on application startup."""
        import app.models  # noqa: F401

        Base.metadata.create_all(bind=engine)

        logger.info(
            "Application started",
            extra={
                "event": "app_startup",
                "enquiry_id": None,
                "detail": f"{settings.app_name} v{settings.app_version}",
            },
        )

    return app


# Module-level app instance for uvicorn
app = create_app()
