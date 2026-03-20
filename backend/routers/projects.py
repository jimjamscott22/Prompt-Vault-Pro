"""Project CRUD router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.project import Project
from schemas.common import DataResponse, Meta
from schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(tags=["projects"])


@router.get("/projects")
async def list_projects(
    page: int = 1,
    per_page: int = 20,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Return paginated projects."""
    query = select(Project).order_by(Project.name).offset((page - 1) * per_page).limit(per_page)
    result = await session.execute(query)
    projects = list(result.scalars().all())

    count_result = await session.execute(select(func.count(Project.id)))
    total = count_result.scalar()

    return DataResponse(
        data=[ProjectResponse.model_validate(p) for p in projects],
        meta=Meta(page=page, per_page=per_page, total=total),
    )


@router.post("/projects", status_code=201)
async def create_project(
    data: ProjectCreate,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Create a new project."""
    project = Project(
        name=data.name,
        slug=data.slug,
        description=data.description,
        path=data.path,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return DataResponse(data=ProjectResponse.model_validate(project))


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Return a single project by ID."""
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Project not found"}})
    return DataResponse(data=ProjectResponse.model_validate(project))


@router.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
) -> DataResponse:
    """Update an existing project."""
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Project not found"}})

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    await session.commit()
    await session.refresh(project)
    return DataResponse(data=ProjectResponse.model_validate(project))


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete a project by ID."""
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": "Project not found"}})
    await session.delete(project)
    await session.commit()
