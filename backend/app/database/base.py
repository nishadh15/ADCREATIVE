from datetime import datetime, timezone
from sqlalchemy import create_engine, DateTime, ForeignKey, JSON, String, Integer, Float, Boolean, Text, Date, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from ..config import settings

class Base(DeclarativeBase):
    pass

def _now(): return datetime.now(timezone.utc)

class Stamped:
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

class Sourced(Stamped):
    # real | demo | user | ai  -- every data row says where it came from
    source: Mapped[str] = mapped_column(String(10), default="demo", index=True)

def _url():
    u = settings.database_url or "sqlite:///./dev.db"
    return u.replace("postgres://", "postgresql+psycopg://", 1).replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
