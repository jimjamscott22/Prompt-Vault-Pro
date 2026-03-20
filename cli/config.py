"""Config loader for PromptVaultPro CLI (TOML)."""

from pathlib import Path
from typing import Any

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore[no-redef]

DEFAULT_CONFIG_PATH = Path.home() / ".config" / "promptvault" / "config.toml"
DEFAULT_BASE_URL = "http://localhost:8765/api/v1"


def load_config(path: Path | None = None) -> dict[str, Any]:
    """Load configuration from TOML file."""
    config_path = path or DEFAULT_CONFIG_PATH
    if config_path.exists():
        with open(config_path, "rb") as f:
            return tomllib.load(f)
    return {}


def get_base_url(config: dict | None = None) -> str:
    """Return the API base URL from config or default."""
    if config is None:
        config = load_config()
    return config.get("api", {}).get("base_url", DEFAULT_BASE_URL)


def get_api_key(config: dict | None = None) -> str | None:
    """Return the API key from config if set."""
    if config is None:
        config = load_config()
    return config.get("auth", {}).get("api_key")
