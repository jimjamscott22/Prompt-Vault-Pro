# PromptVaultPro

AI Prompt & Snippet Library with Project Binding. A local-first, CLI-friendly personal knowledge base for saving prompts, code patterns, and AI-generated snippets — tagged by project, language, and topic. Includes a REST API and CLI for seeding AI sessions with relevant context.

---

## Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (async), SQLite with FTS5
- **Frontend:** React 18, Vite, Tailwind CSS (installed, but the UI is styled with CSS variables in `index.css` and inline styles)
- **CLI:** Python, Typer
- **Package manager:** uv (backend, CLI), npm (frontend)
- **Config:** TOML (`~/.config/promptvault/config.toml`) — read by the CLI only
- **Testing:** pytest (backend). There are no frontend tests, and no ESLint config yet

---

## Project Structure

```
promptvaultpro/
├── CLAUDE.md
├── README.md
├── .venv/                       # shared venv at project root (activate from here)
├── backend/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── database.py              # SQLAlchemy async engine + session
│   ├── models/
│   │   ├── entry.py             # Entry, Tag, EntryTag ORM models
│   │   ├── bundle.py            # Bundle, BundleEntry ORM models
│   │   └── project.py           # Project ORM model
│   ├── routers/
│   │   ├── entries.py           # /entries CRUD
│   │   ├── bundles.py           # /bundles CRUD + export
│   │   ├── projects.py          # /projects CRUD
│   │   ├── search.py            # /search FTS endpoint
│   │   └── imports.py           # /import/claude-skills multipart upload
│   ├── services/
│   │   ├── entry_service.py
│   │   ├── bundle_service.py
│   │   ├── search_service.py
│   │   └── import_service.py    # Claude skills markdown parser + bulk entry creator
│   ├── schemas/                 # Pydantic request/response models
│   ├── auth.py                  # API key middleware (NOT registered in main.py — no auth is enforced)
│   └── tests/                   # pytest suite (entries, search, bundles, import, health)
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
│   │   │   ├── EntryCard.tsx    # Entry display card with edit/delete actions
│   │   │   ├── EntryForm.tsx    # Entry create/edit modal form
│   │   │   └── ImportModal.tsx  # Import modal (paste markdown or file upload)
│   │   ├── pages/
│   │   │   ├── EntriesPage.tsx  # Entry list with full CRUD (create, edit, delete, import)
│   │   │   └── ResourcesPage.tsx # Curated prompt engineering resources / links
│   │   ├── hooks/
│   │   │   ├── useEntries.ts    # Entries fetch hook with refetch
│   │   │   └── useProjects.ts   # Projects ("folders") fetch/create/delete hook
│   │   └── api/                 # Typed API client (fetch wrappers)
│   │       ├── client.ts        # Base fetch wrapper (get, post, put, del, postForm)
│   │       ├── entries.ts       # Entry API functions + TypeScript types
│   │       ├── projects.ts      # Project API functions + TypeScript types
│   │       └── imports.ts       # Import API function (claude-skills)
│   └── vite.config.ts
└── docs/
    ├── architecture.md
    ├── api.md                   # REST endpoint reference
    ├── cli.md                   # CLI command reference
    └── import.md                # Claude skills import guide (UI + API + parser details)
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
- Auth: none enforced (`backend/auth.py` is an unregistered, unfinished middleware). Run on localhost only
- Successful responses: `{ data, meta }` envelope; errors: `{ error: { code, message } }` (validation errors also carry `details`). Handlers in `backend/main.py` enforce this shape
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
GET    /bundles/{id}
PUT    /bundles/{id}
DELETE /bundles/{id}
POST   /bundles/{id}/entries     # 409 if the entry is already in the bundle
GET    /bundles/{id}/export

GET    /projects
POST   /projects
GET    /projects/{id}
PUT    /projects/{id}
DELETE /projects/{id}

GET    /search?q=

POST   /import/claude-skills     # multipart/form-data: file= or content=
```

---

## CLI Commands

```bash
pv add                        # Prompts for title and body (or pass --title/--body)
pv add --type snippet --lang python --project <project-id>
pv search "react hooks"       # Full-text search, prints a results table
pv search "hooks" --project myapp --lang typescript   # --project here is a slug
pv export --bundle <bundle-id>                         # Export a bundle to stdout or file
pv export --bundle <bundle-id> --format claude_md --out ./CLAUDE.md
pv bundle create <name>
pv bundle list
pv bundle add <bundle-id> <entry-id>
```

There is no `pv context` command yet. `pv add --project`, `pv export --bundle`, and `pv bundle add` take full IDs, not names.

---

## Dev Commands

```bash
# Backend (uv creates the .venv at the repo root and installs from pyproject.toml / uv.lock)
cd backend && uv run uvicorn main:app --reload --port 8765

# Frontend
cd frontend && npm install
npm run dev

# CLI (inside an active virtualenv)
uv pip install -e ./cli       # or: pip install -e ./cli

# Tests (from the repo root)
uv run pytest backend/tests/

# Lint
uv run ruff check backend/    # has pre-existing findings; `--fix` resolves most
```

There is no `backend/requirements.txt`, no frontend test files, and no ESLint config
(`npm run lint` does not work yet). `npm run build` type-checks with `tsc` and builds
`frontend/dist/`, which the backend does not serve.

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

- **Project binding:** entries can be bound to a project via `project_id`; the frontend calls projects "folders". There is no automatic project detection from the current directory
- **CLAUDE.md export:** `pv export --format claude_md` renders a `## Context` section with selected entries formatted as fenced code blocks with metadata headers, ready to paste or append to a CLAUDE.md. Fences are lengthened when an entry body contains backticks
- **No auth enforcement:** the API-key middleware in `backend/auth.py` is not registered, so every request is accepted. Do not add `config.toml` auth options to docs until it is wired up
- **FTS5 search:** queries hit the SQLite FTS5 virtual table `entries_fts`, ranked by BM25. Triggers on `entries` keep the index in sync, and it is rebuilt on startup; any raw SQL that writes to `entries` is therefore indexed automatically. A malformed FTS query (e.g. an unbalanced quote) falls back to LIKE
- **Claude skills import:** `POST /import/claude-skills` accepts a multipart form with either a `.md` file upload (`file=`) or pasted text (`content=`); the parser splits on H1 headings, maps Description/Instructions/Tags sections to entry fields, and bulk-creates `prompt`-type entries; see `docs/import.md` for field mapping and parser behaviour

---

## Frontend UI Design System

The frontend uses a "Refined Terminal" dark aesthetic. Preserve these decisions when modifying or extending the UI:

- **Fonts:** Syne (display/headings, weights 600–800) · Plus Jakarta Sans (body/UI) · JetBrains Mono (code)
- **Palette (CSS vars in `index.css`):** deep slate base `#0b0d12`, sidebar `#0f1117`, card `#13161e`, amber accent `#F59E0B`
- **Entry type colors:** `prompt` → amber `#F59E0B` · `snippet` → emerald `#10b981` · `context` → violet `#8b5cf6`
  - Applied as a 3px left border on each `EntryCard`, a colored badge, and a hover glow
- **Layout:** sticky left sidebar (220px) + scrollable main content; no top navbar
- **Interactions:** cards lift `translateY(-1px)` + type-colored shadow on hover; amber focus rings on all inputs; amber CTA buttons with `#0b0d12` text
- **Do not** swap fonts back to Inter/Roboto/system-ui — the Syne + Jakarta Sans pairing is intentional
- **Do not** use purple gradient backgrounds or blue primary buttons — amber is the accent color
- All design tokens live in `frontend/src/index.css` as CSS custom properties (`--bg-*`, `--text-*`, `--type-*`, `--accent-*`)

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
- `@docs/import.md` — Claude skills import guide (UI walkthrough, REST API, field mapping, parser behaviour)
