"""Bundle and BundleEntry ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class BundleEntry(Base):
    """Association between a bundle and its entries with ordering."""

    __tablename__ = "bundle_entries"

    bundle_id = Column(String(36), ForeignKey("bundles.id"), primary_key=True)
    entry_id = Column(String(36), ForeignKey("entries.id"), primary_key=True)
    position = Column(Integer, default=0)

    bundle = relationship("Bundle", back_populates="bundle_entries")
    entry = relationship("Entry", back_populates="bundle_entries")


class Bundle(Base):
    """A named collection of entries for export."""

    __tablename__ = "bundles"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    export_format = Column(String(20), default="markdown")  # claude_md | markdown | json | plaintext
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    bundle_entries = relationship("BundleEntry", back_populates="bundle", cascade="all, delete-orphan")
