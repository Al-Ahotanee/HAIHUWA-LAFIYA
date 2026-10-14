"""Main FastAPI application factory and routing configuration."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.appointments.router import router as appointments_router
from app.assessments.router import router as assessments_router
from app.auth.router import router as auth_router
from app.common.schemas import HealthResponse
from app.common.utils import utcnow
from app.config import get_settings
from app.deliveries.router import router as deliveries_router
from app.exceptions import AppException, app_exception_handler
from app.incentives.router import router as incentives_router
from app.mothers.router import router as mothers_router
from app.organisations.router import router as organisations_router
from app.pregnancies.router import router as pregnancies_router
from app.referrals.router import router as referrals_router
from app.reports.router import router as reports_router, dashboard_router


from app.database import Base, engine
import logging

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup: ensure tables and seed initial users in PostgreSQL."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema validated and tables verified.")

        from app.seeds import seed_reference_data
        await seed_reference_data()
        logger.info("Reference data and user accounts verified.")
    except Exception as e:
        logger.error(f"Error during schema initialization: {e}")
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Haihuwa Lafiya Initiative API",
        description="Maternal & Newborn Health Programme Management Platform",
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom exception handling
    app.add_exception_handler(AppException, app_exception_handler)

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
        from fastapi.responses import JSONResponse
        origin = request.headers.get("origin")
        headers = {}
        if origin and (origin in settings.cors_origin_list or "*" in settings.cors_origin_list):
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"

        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred", "code": "INTERNAL_SERVER_ERROR", "error": str(exc)},
            headers=headers,
        )

    # Health check
    @app.get("/health", tags=["Health"], response_model=HealthResponse)
    async def health_check() -> HealthResponse:
        return HealthResponse(
            status="healthy",
            environment=settings.ENVIRONMENT,
            timestamp=utcnow(),
        )

    # Mount v1 routes
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(mothers_router, prefix="/api/v1")
    app.include_router(pregnancies_router, prefix="/api/v1")
    app.include_router(appointments_router, prefix="/api/v1")
    app.include_router(assessments_router, prefix="/api/v1")
    app.include_router(referrals_router, prefix="/api/v1")
    app.include_router(deliveries_router, prefix="/api/v1")
    app.include_router(incentives_router, prefix="/api/v1")
    app.include_router(organisations_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")
    app.include_router(dashboard_router, prefix="/api/v1")

    return app


app = create_app()
