"""Database engine, session factory and base model for SQLAlchemy 2 + Neon."""

from __future__ import annotations

import re
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


def _normalize_database_url(url: str) -> str:
    """Normalize database connection string to ensure asyncpg or aiosqlite driver."""
    if not url:
        return url

    # If scheme starts with postgresql:// or postgres://, ensure postgresql+asyncpg://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql+psycopg://"):
        # If user supplied psycopg in DATABASE_URL, convert to asyncpg for async engine
        url = url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)

    # Ensure ssl=require rather than sslmode=require for asyncpg
    if "sslmode=require" in url:
        url = url.replace("sslmode=require", "ssl=require")

    return url


def _build_engine():
    """Create the async engine with Neon-optimised settings or SQLite dev fallback."""
    settings = get_settings()
    db_url = _normalize_database_url(settings.DATABASE_URL)

    # If running with SQLite in local tests/dev
    if "sqlite" in db_url:
        return create_async_engine(
            db_url,
            echo=(settings.ENVIRONMENT == "development"),
        )

    # If psycopg is somehow used
    is_asyncpg = "asyncpg" in db_url

    connect_args = {
        "timeout": 15,
    }

    if is_asyncpg:
        connect_args["ssl"] = "require"
        connect_args["statement_cache_size"] = 0  # Required for asyncpg + PgBouncer
        connect_args["server_settings"] = {
            "application_name": "haihuwa_lafiya",
        }
    else:
        # psycopg syntax
        connect_args["sslmode"] = "require"

    return create_async_engine(
        db_url,
        echo=(settings.ENVIRONMENT == "development"),
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_timeout=30,
        connect_args=connect_args,
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
