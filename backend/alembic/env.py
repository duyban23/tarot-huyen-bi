from logging.config import fileConfig
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Load backend/.env so DATABASE_URL is available for migrations.
# env.py lives in backend/alembic/, so .env is at parent.parent/.env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Add the parent directory to sys.path so we can import app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base
from app.models import IdolApplication, Service, Booking, ContactMessage  # noqa: F401 — ensure models are loaded

# this is the Alembic Config object
config = context.config

# Override sqlalchemy.url from env — never hardcode cloud credentials in alembic.ini.
# Falls back to local docker Postgres when DATABASE_URL is unset.
db_url = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://tarot_user:tarot_pass@localhost:5432/tarot_db",
)
config.set_main_option("sqlalchemy.url", db_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
