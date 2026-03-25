"""Claude skills markdown import router."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from schemas.common import DataResponse
from schemas.entry import EntryCreate, EntryResponse
from services import entry_service
from services.import_service import parse_claude_skills_markdown

router = APIRouter(tags=["import"])

_MAX_UPLOAD_BYTES = 1 * 1024 * 1024  # 1 MB


@router.post("/import/claude-skills", status_code=201)
async def import_claude_skills(
    file: UploadFile | None = File(default=None),
    content: str | None = Form(default=None),
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Import a Claude skills markdown file and create prompt entries.

    Accept either:
    - A multipart file upload (``file`` field, must be ``.md`` or plain text).
    - Pasted markdown text in the ``content`` form field.

    Both can be provided; ``file`` takes precedence when both are present.

    Returns a summary of all imported entries.
    """
    # ------------------------------------------------------------------ #
    # 1. Resolve raw markdown text                                         #
    # ------------------------------------------------------------------ #
    markdown: str | None = None

    if file is not None:
        # Validate MIME type / extension
        filename = file.filename or ""
        if not (
            filename.endswith(".md")
            or (file.content_type or "").startswith("text/")
        ):
            raise HTTPException(
                status_code=422,
                detail={
                    "error": {
                        "code": "invalid_file_type",
                        "message": "Only .md (Markdown) files are supported.",
                    }
                },
            )

        # Reject oversized files early using the reported size when available,
        # then verify the actual byte count after reading to guard against
        # mis-reported Content-Length values.
        if file.size is not None and file.size > _MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": {
                        "code": "file_too_large",
                        "message": "File must be 1 MB or smaller.",
                    }
                },
            )

        raw_bytes = await file.read(_MAX_UPLOAD_BYTES + 1)
        if len(raw_bytes) > _MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": {
                        "code": "file_too_large",
                        "message": "File must be 1 MB or smaller.",
                    }
                },
            )
        try:
            markdown = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": {
                        "code": "encoding_error",
                        "message": "File must be UTF-8 encoded.",
                    }
                },
            )
    elif content:
        markdown = content

    if not markdown or not markdown.strip():
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "no_content",
                    "message": "Provide either a markdown file upload or paste markdown text.",
                }
            },
        )

    # ------------------------------------------------------------------ #
    # 2. Parse                                                             #
    # ------------------------------------------------------------------ #
    try:
        skills = parse_claude_skills_markdown(markdown)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": {"code": "parse_error", "message": str(exc)}},
        )

    # ------------------------------------------------------------------ #
    # 3. Persist as prompt entries                                         #
    # ------------------------------------------------------------------ #
    created_entries = []
    for skill in skills:
        entry_data = EntryCreate(
            title=skill.title,
            body=skill.body,
            type="prompt",
            tags=skill.tags if skill.tags else [],
        )
        entry = await entry_service.create_entry(session, entry_data)
        created_entries.append(EntryResponse.model_validate(entry))

    return DataResponse(
        data={
            "imported": len(created_entries),
            "entries": [e.model_dump() for e in created_entries],
        }
    )
