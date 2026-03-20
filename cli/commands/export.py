"""pv export — export a bundle to stdout or file."""

from typing import Optional

import httpx
import typer
from rich.console import Console

from config import get_base_url, get_api_key

console = Console()


def export(
    bundle: str = typer.Option(..., help="Bundle name or ID"),
    format: Optional[str] = typer.Option(None, help="Export format: claude_md, markdown, json, plaintext"),
    out: Optional[str] = typer.Option(None, help="Output file path"),
):
    """Export a bundle to stdout or a file."""
    headers = {}
    api_key = get_api_key()
    if api_key:
        headers["X-API-Key"] = api_key

    params = {}
    if format:
        params["format"] = format

    with httpx.Client() as client:
        resp = client.get(
            f"{get_base_url()}/bundles/{bundle}/export",
            params=params,
            headers=headers,
        )

    if resp.status_code != 200:
        console.print(f"[red]Error {resp.status_code}:[/red] {resp.text}")
        raise typer.Exit(code=1)

    content = resp.text

    if out:
        with open(out, "w", encoding="utf-8") as f:
            f.write(content)
        console.print(f"[green]Exported to {out}[/green]")
    else:
        console.print(content)
