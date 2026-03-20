"""Entry, Tag, and EntryTag ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EntryTag(Base):
    """Association table between entries and tags."""

    __tablename__ = "entry_tags"

    entry_id = Column(String(36), ForeignKey("entries.id"), primary_key=True)
    tag_id = Column(String(36), ForeignKey("tags.id"), primary_key=True)


class Tag(Base):
    """Tag model for categorizing entries."""

    __tablename__ = "tags"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    entries = relationship("Entry", secondary="entry_tags", back_populates="tags")


class Entry(Base):
    """Prompt, snippet, or context entry."""

    __tablename__ = "entries"

    id = Column(String(36), primary_key=True, default=_uuid)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    type = Column(String(20), nullable=False, default="prompt")  # prompt | snippet | context
    language = Column(String(50), nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    project = relationship("Project", back_populates="entries")
    tags = relationship("Tag", secondary="entry_tags", back_populates="entries")
    bundle_entries = relationship("BundleEntry", back_populates="entry")
