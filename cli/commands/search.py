"""pv search — full-text search for entries."""

from typing import Optional

import httpx
import typer
from rich.console import Console
from rich.table import Table

from config import get_base_url, get_api_key

console = Console()


def search(
    query: str = typer.Argument(..., help="Search query"),
    project: Optional[str] = typer.Option(None, help="Filter by project slug"),
    lang: Optional[str] = typer.Option(None, "--lang", help="Filter by language"),
    type: Optional[str] = typer.Option(None, help="Filter by type"),
):
    """Search entries using full-text search."""
    params = {"q": query}
    if project:
        params["project"] = project
    if lang:
        params["lang"] = lang
    if type:
        params["type"] = type

    headers = {}
    api_key = get_api_key()
    if api_key:
        headers["X-API-Key"] = api_key

    with httpx.Client() as client:
        resp = client.get(f"{get_base_url()}/search", params=params, headers=headers)

    if resp.status_code != 200:
        console.print(f"[red]Error {resp.status_code}:[/red] {resp.text}")
        raise typer.Exit(code=1)

    data = resp.json()
    entries = data["data"]

    if not entries:
        console.print("[yellow]No results found.[/yellow]")
        return

    table = Table(title=f"Results for '{query}'")
    table.add_column("ID", style="dim", max_width=8)
    table.add_column("Title", style="bold")
    table.add_column("Type")
    table.add_column("Lang")
    table.add_column("Tags")

    for entry in entries:
        tags = ", ".join(t["name"] for t in entry.get("tags", []))
        table.add_row(
            entry["id"][:8],
            entry["title"],
            entry["type"],
            entry.get("language", ""),
            tags,
        )

    console.print(table)
