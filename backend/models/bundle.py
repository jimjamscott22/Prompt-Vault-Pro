"""Bundle and BundleEntry ORM models."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.entry import Entry


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(UTC)


class BundleEntry(Base):
    """Association between a bundle and its entries with ordering."""

    __tablename__ = "bundle_entries"

    bundle_id: Mapped[str] = mapped_column(String(36), ForeignKey("bundles.id"), primary_key=True)
    entry_id: Mapped[str] = mapped_column(String(36), ForeignKey("entries.id"), primary_key=True)
    position: Mapped[int | None] = mapped_column(Integer, default=0)

    bundle: Mapped["Bundle"] = relationship(back_populates="bundle_entries")
    entry: Mapped["Entry"] = relationship(back_populates="bundle_entries")


class Bundle(Base):
    """A named collection of entries for export."""

    __tablename__ = "bundles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    # claude_md | markdown | json | plaintext
    export_format: Mapped[str | None] = mapped_column(String(20), default="markdown")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    bundle_entries: Mapped[list[BundleEntry]] = relationship(
        back_populates="bundle", cascade="all, delete-orphan"
    )
