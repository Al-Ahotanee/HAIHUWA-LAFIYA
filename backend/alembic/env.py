"""Alembic environment configuration connecting via Neon direct URL."""

import os
import re
import sys
from logging.config import fileConfig

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alembic import context
from sqlalchemy import create_engine, pool

from app.models import Base

# Alembic Config object
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_direct_url() -> str:
    """Get direct PostgreSQL URL without connection pooler for schema DDL operations."""
    url = os.getenv("DATABASE_URL_DIRECT") or os.getenv("DIRECT_URL")
    if not url:
        raw_url = os.getenv("DATABASE_URL", "")
        # Fallback: strip -pooler from neon host if present
        url = re.sub(r"-pooler(\.[a-z0-9-]+\.aws\.neon\.tech)", r"\1", raw_url)

    if not url:
        # Fallback for local testing or dev
        url = "postgresql+psycopg://postgres:postgres@localhost:5432/haihuwa_dev"

    # Replace asyncpg with sync driver for Alembic CLI operations
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)

    return url


def run_migrations_offline() -> None:
    url = get_direct_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(
        get_direct_url(),
        poolclass=pool.NullPool,
        connect_args={"connect_timeout": 15},
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
