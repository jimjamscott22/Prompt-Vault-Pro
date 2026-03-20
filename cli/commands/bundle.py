"""pv bundle — manage bundles."""

from typing import Optional

import httpx
import typer
from rich.console import Console
from rich.table import Table

from config import get_base_url, get_api_key

console = Console()
app = typer.Typer(help="Manage bundles.")


def _headers() -> dict:
    headers = {}
    api_key = get_api_key()
    if api_key:
        headers["X-API-Key"] = api_key
    return headers


@app.command()
def create(
    name: str = typer.Argument(..., help="Bundle name"),
    description: Optional[str] = typer.Option(None, help="Bundle description"),
    format: str = typer.Option("markdown", help="Export format"),
):
    """Create a new bundle."""
    payload = {"name": name, "description": description, "export_format": format}
    with httpx.Client() as client:
        resp = client.post(f"{get_base_url()}/bundles", json=payload, headers=_headers())

    if resp.status_code == 201:
        bundle = resp.json()["data"]
        console.print(f"[green]Created bundle:[/green] {bundle['id']} — {bundle['name']}")
    else:
        console.print(f"[red]Error {resp.status_code}:[/red] {resp.text}")
        raise typer.Exit(code=1)


@app.command("list")
def list_bundles():
    """List all bundles."""
    with httpx.Client() as client:
        resp = client.get(f"{get_base_url()}/bundles", headers=_headers())

    if resp.status_code != 200:
        console.print(f"[red]Error {resp.status_code}:[/red] {resp.text}")
        raise typer.Exit(code=1)

    bundles = resp.json()["data"]
    if not bundles:
        console.print("[yellow]No bundles found.[/yellow]")
        return

    table = Table(title="Bundles")
    table.add_column("ID", style="dim", max_width=8)
    table.add_column("Name", style="bold")
    table.add_column("Format")
    table.add_column("Description")

    for b in bundles:
        table.add_row(b["id"][:8], b["name"], b["export_format"], b.get("description", ""))

    console.print(table)


@app.command("add")
def add_entry(
    bundle_id: str = typer.Argument(..., help="Bundle ID"),
    entry_id: str = typer.Argument(..., help="Entry ID to add"),
):
    """Add an entry to a bundle."""
    payload = {"entry_id": entry_id}
    with httpx.Client() as client:
        resp = client.post(
            f"{get_base_url()}/bundles/{bundle_id}/entries",
            json=payload,
            headers=_headers(),
        )

    if resp.status_code == 201:
        console.print(f"[green]Added entry {entry_id[:8]} to bundle {bundle_id[:8]}[/green]")
    else:
        console.print(f"[red]Error {resp.status_code}:[/red] {resp.text}")
        raise typer.Exit(code=1)
