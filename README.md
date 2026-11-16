# Prompt-Vault-Pro

AI Prompt & Snippet Library with Project Binding. A local-first, CLI-friendly personal knowledge base for saving prompts, code patterns, and AI-generated snippets — tagged by project, language, and topic. Includes a REST API and CLI for seeding AI sessions with relevant context.

## Quick Start

### Prerequisites
- Python 3.11 or later
- Node.js 18+
- [uv](https://docs.astral.sh/uv/)

### Install Python dependencies

From the repo root:

```bash
uv sync
```

This creates `.venv` at the repo root and installs the backend, the CLI, and the dev tools (pytest, ruff) exactly as pinned in `uv.lock`. All Python commands below are run from the repo root with `uv run`; you never need to activate the virtualenv. Dependencies are declared in `backend/pyproject.toml` and `cli/pyproject.toml`; add one with `uv add --package promptvaultpro-backend <name>`.

### Run the backend

```bash
uv run --directory backend uvicorn main:app --reload --port 8765
```

`--directory backend` is required because the backend imports its modules by top-level name. Interactive API docs are at <http://localhost:8765/docs>.

### Run the frontend

The frontend is a JavaScript project, so it uses npm (uv only manages Python).

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server proxies `/api` to the backend on port 8765.

### Data location

The SQLite database lives at `~/.config/promptvault/promptvault.db` and is created on first start. Set `PROMPTVAULT_DB_PATH` to use a different file.

To load sample prompts, start the backend once (so the database exists), then run `uv run python seed_prompts.py` from the repo root.

### Tests

```bash
uv run pytest backend/tests/
```

There are no frontend tests yet.

### CLI

```bash
uv run pv --help                     # from the repo root, no install step needed
uv tool install --editable ./cli     # optional: put `pv` on your PATH
```

After `uv tool install`, run `uv tool update-shell` once if `pv` is not found. The CLI talks to the backend, so keep it running. See [docs/cli.md](docs/cli.md).

## Limitations

- **No authentication.** The API does not check API keys. Run it on `localhost` only, and do not bind it to `0.0.0.0` or otherwise expose it to a network you don't trust.
- **No single-process production mode.** `npm run build` writes the frontend to `frontend/dist/`, but the backend does not serve it. Use the two dev servers above.
- **CORS** allows only the Vite dev origin (`http://localhost:5173`).

---

For detailed documentation, see [CLAUDE.md](CLAUDE.md) and the [docs/](docs/) folder.
