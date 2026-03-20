"""API key middleware for PromptVaultPro."""

import os
from pathlib import Path

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[no-redef]


def _load_config() -> dict:
    """Load configuration from TOML file."""
    config_path = Path.home() / ".config" / "promptvault" / "config.toml"
    if config_path.exists():
        with open(config_path, "rb") as f:
            return tomllib.load(f)
    return {}


class APIKeyMiddleware(BaseHTTPMiddleware):
    """Validate the X-API-Key header unless in local-only mode."""

    async def dispatch(self, request: Request, call_next):
        config = _load_config()
        auth_config = config.get("auth", {})
        local_only = auth_config.get("local_only", True)

        if local_only:
            return await call_next(request)

        # Skip auth for health check
        if request.url.path == "/health":
            return await call_next(request)

        api_key = auth_config.get("api_key", os.environ.get("PROMPTVAULT_API_KEY"))
        if not api_key:
            return await call_next(request)

        provided_key = request.headers.get("X-API-Key")
        if provided_key != api_key:
            raise HTTPException(
                status_code=401,
                detail={"error": {"code": "unauthorized", "message": "Invalid API key"}},
            )

        return await call_next(request)
