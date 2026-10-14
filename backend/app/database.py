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


import urllib.parse


def _normalize_database_url(url: str) -> tuple[str, dict]:
    """Normalize database connection string to ensure asyncpg or aiosqlite driver."""
    if not url:
        return url, {}

    if "sqlite" in url:
        return url, {}

    u = urllib.parse.urlsplit(url)
    q = urllib.parse.parse_qs(u.query)

    # Strip query parameters that cause psycopg/asyncpg driver confusion
    filtered_q = {
        k: v
        for k, v in q.items()
        if k.lower() not in ("ssl", "sslmode", "target_session_attrs")
    }
    new_query = urllib.parse.urlencode(filtered_q, doseq=True)

    # Ensure postgresql+asyncpg driver scheme
    new_u = u._replace(scheme="postgresql+asyncpg", query=new_query)
    clean_url = urllib.parse.urlunsplit(new_u)

    connect_args = {
        "ssl": "require",
        "timeout": 15,
        "statement_cache_size": 0,  # Required for asyncpg with Neon/PgBouncer
        "server_settings": {
            "application_name": "haihuwa_lafiya",
        },
    }

    return clean_url, connect_args


def _build_engine():
    """Create the async engine with Neon-optimised settings or SQLite dev fallback."""
    settings = get_settings()
    db_url, connect_args = _normalize_database_url(settings.DATABASE_URL)

    # If running with SQLite in local tests/dev
    if "sqlite" in db_url:
        return create_async_engine(
            db_url,
            echo=(settings.ENVIRONMENT == "development"),
        )

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
