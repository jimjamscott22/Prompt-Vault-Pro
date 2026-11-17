"""Entry, Tag, and EntryTag ORM models."""

import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

if TYPE_CHECKING:
    from models.bundle import BundleEntry
    from models.project import Project


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(UTC)


class EntryTag(Base):
    """Association table between entries and tags."""

    __tablename__ = "entry_tags"

    entry_id: Mapped[str] = mapped_column(String(36), ForeignKey("entries.id"), primary_key=True)
    tag_id: Mapped[str] = mapped_column(String(36), ForeignKey("tags.id"), primary_key=True)


class Tag(Base):
    """Tag model for categorizing entries."""

    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    entries: Mapped[list["Entry"]] = relationship(secondary="entry_tags", back_populates="tags")


class Entry(Base):
    """Prompt, snippet, or context entry."""

    __tablename__ = "entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(20), default="prompt")  # prompt | snippet | context
    language: Mapped[str | None] = mapped_column(String(50))
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("projects.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    project: Mapped["Project | None"] = relationship(back_populates="entries")
    tags: Mapped[list[Tag]] = relationship(secondary="entry_tags", back_populates="entries")
    bundle_entries: Mapped[list["BundleEntry"]] = relationship(
        back_populates="entry", cascade="all, delete-orphan"
    )
