"""pv add — save a new entry interactively or via flags."""

from typing import Optional

import httpx
import typer
from rich.console import Console

from config import get_base_url, get_api_key

console = Console()


def add(
    title: Optional[str] = typer.Option(None, help="Entry title"),
    body: Optional[str] = typer.Option(None, help="Entry body content"),
    type: str = typer.Option("prompt", help="Entry type: prompt, snippet, or context"),
    lang: Optional[str] = typer.Option(None, "--lang", help="Language (e.g. python, typescript)"),
    project: Optional[str] = typer.Option(None, help="Project ID to bind to"),
    tags: Optional[str] = typer.Option(None, help="Comma-separated tags"),
):
    """Save a new entry to PromptVaultPro."""
    if not title:
        title = typer.prompt("Title")
    if not body:
        console.print("[dim]Enter body (end with Ctrl+D or empty line):[/dim]")
        lines = []
        try:
            while True:
                line = input()
                if line == "":
                    break
                lines.append(line)
        except EOFError:
            pass
        body = "\n".join(lines)

    if not body.strip():
        console.print("[red]Body cannot be empty.[/red]")
        raise typer.Exit(code=1)

    tag_list = [t.strip() for t in tags.split(",")] if tags else []

    payload = {
        "title": title,
        "body": body,
        "type": type,
        "language": lang,
        "project_id": project,
        "tags": tag_list,
    }

    headers = {}
    api_key = get_api_key()
    if api_key:
        headers["X-API-Key"] = api_key

    with httpx.Client() as client:
        resp = client.post(f"{get_base_url()}/entries", json=payload, headers=headers)

    if resp.status_code == 201:
        entry = resp.json()["data"]
        console.print(f"[green]Created entry:[/green] {entry['id']} — {entry['title']}")
    else:
        console.print(f"[red]Error {resp.status_code}:[/red] {resp.text}")
        raise typer.Exit(code=1)
