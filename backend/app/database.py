from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# `connect_timeout` is a psycopg2 connect arg; the sqlite3 driver used by CI
# rejects it, so only pass it for Postgres.
_IS_POSTGRES = DATABASE_URL.startswith("postgresql")

engine = create_engine(
    DATABASE_URL,
    # Serverless: one lambda handles one request at a time, and providers
    # (Neon/pgbouncer) close idle connections while the function is frozen.
    pool_pre_ping=True,
    pool_size=1,
    max_overflow=0,
    pool_recycle=280,
    **({"connect_args": {"connect_timeout": 5}} if _IS_POSTGRES else {}),
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
