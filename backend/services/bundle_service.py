"""Business logic for bundle CRUD and export operations."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.bundle import Bundle, BundleEntry
from models.entry import Entry
from schemas.bundle import BundleCreate, BundleUpdate


async def list_bundles(
    session: AsyncSession,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[Bundle], int]:
    """Return paginated bundles."""
    query = select(Bundle).order_by(Bundle.updated_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await session.execute(query)
    bundles = list(result.scalars().all())

    count_result = await session.execute(select(func.count(Bundle.id)))
    total = count_result.scalar()

    return bundles, total


async def get_bundle(session: AsyncSession, bundle_id: str) -> Bundle | None:
    """Return a single bundle by ID with entries."""
    result = await session.execute(
        select(Bundle)
        .where(Bundle.id == bundle_id)
        .options(
            selectinload(Bundle.bundle_entries)
            .selectinload(BundleEntry.entry)
            .selectinload(Entry.tags)
        )
    )
    return result.scalar_one_or_none()


async def create_bundle(session: AsyncSession, data: BundleCreate) -> Bundle:
    """Create a new bundle."""
    bundle = Bundle(
        name=data.name,
        description=data.description,
        export_format=data.export_format,
    )
    session.add(bundle)
    await session.commit()
    await session.refresh(bundle)
    return bundle


async def update_bundle(session: AsyncSession, bundle_id: str, data: BundleUpdate) -> Bundle | None:
    """Update an existing bundle."""
    bundle = await get_bundle(session, bundle_id)
    if not bundle:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bundle, field, value)

    await session.commit()
    await session.refresh(bundle)
    return bundle


async def delete_bundle(session: AsyncSession, bundle_id: str) -> bool:
    """Delete a bundle by ID."""
    bundle = await get_bundle(session, bundle_id)
    if not bundle:
        return False
    await session.delete(bundle)
    await session.commit()
    return True


async def add_entry_to_bundle(
    session: AsyncSession, bundle_id: str, entry_id: str, position: int | None = None,
) -> bool:
    """Add an entry to a bundle."""
    bundle = await get_bundle(session, bundle_id)
    if not bundle:
        return False

    entry_result = await session.execute(select(Entry).where(Entry.id == entry_id))
    if not entry_result.scalar_one_or_none():
        return False

    if position is None:
        position = len(bundle.bundle_entries)

    be = BundleEntry(bundle_id=bundle_id, entry_id=entry_id, position=position)
    session.add(be)
    await session.commit()
    return True


async def export_bundle(session: AsyncSession, bundle_id: str, fmt: str | None = None) -> str | None:
    """Export a bundle in the specified format."""
    bundle = await get_bundle(session, bundle_id)
    if not bundle:
        return None

    export_format = fmt or bundle.export_format
    entries = sorted(bundle.bundle_entries, key=lambda be: be.position)

    if export_format == "json":
        import json

        data = []
        for be in entries:
            e = be.entry
            data.append({
                "title": e.title,
                "body": e.body,
                "type": e.type,
                "language": e.language,
                "tags": [t.name for t in e.tags],
            })
        return json.dumps(data, indent=2)

    if export_format == "plaintext":
        parts = []
        for be in entries:
            e = be.entry
            parts.append(f"# {e.title}\n\n{e.body}")
        return "\n\n---\n\n".join(parts)

    if export_format == "claude_md":
        parts = ["## Context\n"]
        for be in entries:
            e = be.entry
            lang = e.language or ""
            meta = f"type: {e.type}"
            if e.language:
                meta += f" | lang: {e.language}"
            if e.tags:
                meta += f" | tags: {', '.join(t.name for t in e.tags)}"
            parts.append(f"### {e.title}\n\n<!-- {meta} -->\n\n```{lang}\n{e.body}\n```")
        return "\n\n".join(parts)

    # Default: markdown
    parts = []
    for be in entries:
        e = be.entry
        lang = e.language or ""
        parts.append(f"## {e.title}\n\n```{lang}\n{e.body}\n```")
    return "\n\n".join(parts)
