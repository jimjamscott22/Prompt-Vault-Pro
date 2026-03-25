"""Business logic for entry CRUD operations."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.entry import Entry, Tag
from schemas.entry import EntryCreate, EntryUpdate


async def _get_or_create_tags(session: AsyncSession, tag_names: list[str]) -> list[Tag]:
    """Get existing tags or create new ones."""
    tags = []
    for name in tag_names:
        name = name.strip().lower()
        result = await session.execute(select(Tag).where(Tag.name == name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=name)
            session.add(tag)
            await session.flush()
        tags.append(tag)
    return tags


async def list_entries(
    session: AsyncSession,
    page: int = 1,
    per_page: int = 20,
    project_id: str | None = None,
    entry_type: str | None = None,
    language: str | None = None,
) -> tuple[list[Entry], int]:
    """Return paginated entries with optional filters."""
    query = select(Entry).options(selectinload(Entry.tags))
    count_query = select(func.count(Entry.id))

    if project_id:
        query = query.where(Entry.project_id == project_id)
        count_query = count_query.where(Entry.project_id == project_id)
    if entry_type:
        query = query.where(Entry.type == entry_type)
        count_query = count_query.where(Entry.type == entry_type)
    if language:
        query = query.where(Entry.language == language)
        count_query = count_query.where(Entry.language == language)

    query = query.order_by(Entry.updated_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await session.execute(query)
    entries = list(result.scalars().all())

    count_result = await session.execute(count_query)
    total = count_result.scalar()

    return entries, total


async def get_entry(session: AsyncSession, entry_id: str) -> Entry | None:
    """Return a single entry by ID."""
    result = await session.execute(
        select(Entry).where(Entry.id == entry_id).options(selectinload(Entry.tags))
    )
    return result.scalar_one_or_none()


async def create_entry(session: AsyncSession, data: EntryCreate) -> Entry:
    """Create a new entry with tags."""
    entry = Entry(
        title=data.title,
        body=data.body,
        type=data.type,
        language=data.language,
        project_id=data.project_id,
    )
    session.add(entry)
    await session.flush()

    if data.tags:
        tags = await _get_or_create_tags(session, data.tags)
        # Eagerly load the tags collection before assignment to avoid a lazy-load
        # in a non-greenlet context (e.g. async test runners).
        await session.refresh(entry, ["tags"])
        entry.tags = tags

    await session.commit()
    await session.refresh(entry, ["tags"])
    return entry


async def update_entry(session: AsyncSession, entry_id: str, data: EntryUpdate) -> Entry | None:
    """Update an existing entry."""
    entry = await get_entry(session, entry_id)
    if not entry:
        return None

    update_data = data.model_dump(exclude_unset=True)
    tags_data = update_data.pop("tags", None)

    for field, value in update_data.items():
        setattr(entry, field, value)

    if tags_data is not None:
        tags = await _get_or_create_tags(session, tags_data)
        await session.refresh(entry, ["tags"])
        entry.tags = tags

    await session.commit()
    await session.refresh(entry, ["tags"])
    return entry


async def delete_entry(session: AsyncSession, entry_id: str) -> bool:
    """Delete an entry by ID."""
    entry = await get_entry(session, entry_id)
    if not entry:
        return False
    await session.delete(entry)
    await session.commit()
    return True
