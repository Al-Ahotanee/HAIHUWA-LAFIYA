"""Database engine, session factory and base model for SQLAlchemy 2 + Neon."""

from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


def _build_engine():
    """Create the async engine with Neon-optimised settings or SQLite dev fallback."""
    settings = get_settings()

    # If running with SQLite in local tests/dev
    if "sqlite" in settings.DATABASE_URL:
        return create_async_engine(
            settings.DATABASE_URL,
            echo=(settings.ENVIRONMENT == "development"),
        )

    # Neon PostgreSQL configuration
    return create_async_engine(
        settings.DATABASE_URL,
        echo=(settings.ENVIRONMENT == "development"),
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_timeout=30,
        connect_args={
            "ssl": "require",
            "timeout": 15,
            "statement_cache_size": 0,  # Required for asyncpg + PgBouncer
            "server_settings": {
                "application_name": "haihuwa_lafiya",
            },
        },
    )


engine = _build_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
