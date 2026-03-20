"""Typer app entrypoint for the `pv` CLI command."""

import typer

from commands import add, search, export, bundle

app = typer.Typer(
    name="pv",
    help="PromptVaultPro CLI — manage prompts, snippets, and context entries.",
    no_args_is_help=True,
)

app.command()(add.add)
app.command()(search.search)
app.command()(export.export)
app.add_typer(bundle.app, name="bundle")

if __name__ == "__main__":
    app()
