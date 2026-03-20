# PromptVaultPro

AI Prompt & Snippet Library with Project Binding. A local-first, CLI-friendly personal knowledge base for saving prompts, code patterns, and AI-generated snippets — tagged by project, language, and topic. Includes a REST API and CLI for seeding AI sessions with relevant context.

---

## Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (async), SQLite with FTS5
- **Frontend:** React 18, Vite, Tailwind CSS
- **CLI:** Python, Typer
- **Package manager:** uv (backend), npm (frontend) — or pip + venv as alternative
- **Config:** TOML (`~/.config/promptvault/config.toml`)
- **Testing:** pytest (backend), Vitest (frontend)

---

## Project Structure

```
promptvaultpro/
├── CLAUDE.md
├── README.md
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── database.py              # SQLAlchemy async engine + session
│   ├── models/
│   │   ├── entry.py             # Entry, Tag, EntryTag ORM models
│   │   ├── bundle.py            # Bundle, BundleEntry ORM models
│   │   └── project.py          # Project ORM model
│   ├── routers/
│   │   ├── entries.py           # /entries CRUD
│   │   ├── bundles.py           # /bundles CRUD + export
│   │   ├── projects.py          # /projects CRUD
│   │   └── search.py            # /search FTS endpoint
│   ├── services/
│   │   ├── entry_service.py
│   │   ├── bundle_service.py
│   │   └── search_service.py
│   ├── schemas/                 # Pydantic request/response models
│   └── auth.py                  # API key middleware
├── cli/
│   ├── main.py                  # Typer app entrypoint (pv command)
│   ├── commands/
│   │   ├── add.py               # pv add
│   │   ├── search.py            # pv search
│   │   ├── export.py            # pv export
│   │   └── bundle.py            # pv bundle
│   └── config.py                # Config loader (TOML)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/                 # Typed API client (fetch wrappers)
│   └── vite.config.ts
└── docs/
    ├── architecture.md
    ├── api.md                   # REST endpoint reference
    └── cli.md                   # CLI command reference
```

---

## Database Schema

Core tables: `projects`, `entries`, `tags`, `entry_tags`, `bundles`, `bundle_entries`

- `entry.type` is an enum: `prompt | snippet | context`
- `entry.language` is free text (e.g. `python`, `typescript`, `bash`)
- `bundle.export_format` is an enum: `claude_md | markdown | json | plaintext`
- Use UUIDs for all primary keys
- Enable FTS5 virtual table on `entries(title, body)` for full-text search
- All timestamps are UTC ISO 8601

---

## API Conventions

- Base URL: `http://localhost:8765/api/v1`
- Auth: `X-API-Key` header (configurable, skip in local-only mode)
- All responses: `{ data, meta }` envelope; errors: `{ error: { code, message } }`
- Pagination: `?page=1&per_page=20` query params on list endpoints
- Search: `GET /search?q=<query>&project=<slug>&lang=<lang>&type=<type>`
- Export: `GET /bundles/{id}/export?format=claude_md`

Key endpoints:
```
GET    /entries
POST   /entries
GET    /entries/{id}
PUT    /entries/{id}
DELETE /entries/{id}

GET    /bundles
POST   /bundles
GET    /bundles/{id}/export

GET    /projects
POST   /projects

GET    /search?q=
```

---

## CLI Commands

```bash
pv add                        # Interactive prompt to save a new entry
pv add --type snippet --lang python --project myapp
pv search "react hooks"       # Full-text search, outputs formatted context block
pv search --project myapp --lang typescript
pv export --bundle <name>     # Export a bundle to stdout or file
pv export --bundle <name> --format claude_md --out ./CLAUDE.md
pv context                    # Auto-detect project from cwd, surface relevant entries
pv bundle create <name>       # Create a bundle interactively
pv bundle list
pv bundle add <bundle> <entry-id>
```

---

## Dev Commands

### Using `uv` (recommended)

```bash
# Backend
cd backend && uv venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
uv pip install -r requirements.txt
uvicorn main:app --reload --port 8765

# Frontend
cd frontend && npm install
npm run dev

# CLI (local install)
uv pip install -e ./cli

# Tests
uv run pytest backend/tests/
npm run test --run            # frontend

# Lint
uv run ruff check backend/
npm run lint                  # frontend (ESLint)
```

### Using `pip` + `venv` (alternative)

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8765

# Frontend
cd frontend && npm install
npm run dev

# CLI (local install)
pip install -e ./cli

# Tests
pytest backend/tests/

# Lint
ruff check backend/
npm run lint                  # frontend (ESLint)
```

---

## Code Conventions

- Use `async/await` throughout the FastAPI backend — no sync DB calls
- Pydantic v2 for all schemas; separate request/response models (never expose ORM models directly)
- SQLAlchemy 2.x style (`select()`, `session.execute()`) — not legacy Query API
- File names: `snake_case` (Python), `kebab-case` (frontend components use PascalCase filenames)
- No `any` in TypeScript — use proper types or `unknown`
- Write imperative docstrings: "Return the entry by ID" not "Returns the entry"
- Never commit `.env` files — use `config.toml` loaded via the config module
- Never hardcode the API key — always read from config or environment
- Do not modify files under `docs/` unless explicitly asked; treat them as source of truth

---

## Key Behaviours

- **Project auto-detection:** `pv context` reads the nearest `pyproject.toml`, `package.json`, or `.git` root to infer the active project slug, then surfaces matching entries
- **CLAUDE.md export:** `pv export --format claude_md` renders a `## Context` section with selected entries formatted as fenced code blocks with metadata headers, ready to paste or append to a CLAUDE.md
- **Local-only mode:** if `auth.local_only = true` in config, skip API key validation entirely — useful for single-machine personal setups
- **FTS5 search:** queries hit the SQLite FTS5 virtual table; results ranked by BM25; fallback to LIKE if FTS5 unavailable

---

## What Not To Do

- Do not add external databases (Postgres, Redis) — SQLite only, keep it portable
- Do not build user authentication or accounts — this is a single-user personal tool
- Do not add an ORM migration framework (Alembic) in Phase 1 — use plain `CREATE TABLE IF NOT EXISTS` with version tracking in a `schema_version` table
- Do not use `axios` in the frontend — use the native `fetch` API wrapped in `src/api/`
- Do not create `.env` files — configuration lives in `~/.config/promptvault/config.toml`

---

## Docs Reference

- `@docs/architecture.md` — system design decisions and rationale
- `@docs/api.md` — full REST endpoint reference with request/response examples
- `@docs/cli.md` — CLI usage guide and examples
