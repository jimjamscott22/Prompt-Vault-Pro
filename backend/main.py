"""FastAPI app entrypoint for PromptVaultPro."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import init_db
from routers import bundles, entries, imports, projects, search
from services.entry_service import ProjectNotFoundError


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    await init_db()
    yield


app = FastAPI(
    title="PromptVaultPro",
    description="AI Prompt & Snippet Library with Project Binding",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Return HTTP errors as ``{"error": {"code", "message"}}``."""
    detail = exc.detail
    if isinstance(detail, dict) and "error" in detail:
        body = detail
    else:
        body = {"error": {"code": "http_error", "message": str(detail)}}
    return JSONResponse(status_code=exc.status_code, content=body, headers=exc.headers)


@app.exception_handler(ProjectNotFoundError)
async def project_not_found_handler(request: Request, exc: ProjectNotFoundError) -> JSONResponse:
    """Return a 404 when an entry references an unknown project."""
    return JSONResponse(
        status_code=404,
        content={"error": {"code": "not_found", "message": "Project not found"}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return request validation errors as ``{"error": {"code", "message", "details"}}``."""
    errors = jsonable_encoder(exc.errors(), custom_encoder={Exception: str})
    message = "; ".join(
        f"{'.'.join(str(p) for p in err['loc'] if p != 'body')}: {err['msg']}" for err in errors
    )
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": message, "details": errors}},
    )


app.include_router(entries.router, prefix="/api/v1")
app.include_router(bundles.router, prefix="/api/v1")
app.include_router(imports.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")


@app.get("/health")
async def health():
    """Return a simple health check."""
    return {"status": "ok"}
