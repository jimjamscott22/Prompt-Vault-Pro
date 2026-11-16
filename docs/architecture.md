# Architecture

## Overview

PromptVaultPro is a local-first, single-user tool for managing AI prompts, code
snippets, and context entries. It consists of three main components:

1. **Backend API** — FastAPI server with SQLite storage
2. **CLI** — Typer-based command-line interface (`pv`) that calls the REST API
3. **Frontend** — React SPA for browsing and managing entries (served by the Vite
   dev server, which proxies `/api` to the backend)

## Design Decisions

- **SQLite by default** — keeps the tool portable with zero infrastructure. The
  database is `~/.config/promptvault/promptvault.db`, or the path in
  `PROMPTVAULT_DB_PATH`. `backend/database.py` also contains an optional
  MariaDB/MySQL mode (`PROMPTVAULT_DB_ENGINE=mysql|mariadb`). Its driver (`aiomysql`)
  is not installed by default; add it with `uv sync --extra mysql`. This mode has no
  automated tests, so treat it as experimental.
- **FTS5** — `entries_fts` is an external-content FTS5 table over `entries(title, body)`
  giving full-text search with BM25 ranking. Triggers on `entries` keep it in sync
  on insert, update, and delete, and it is rebuilt on every startup. Malformed
  queries fall back to a `LIKE` search.
- **UUID primary keys** — avoids sequential IDs, supports future sync scenarios
- **No ORM migrations** — tables are created with `Base.metadata.create_all`
  (`CREATE TABLE IF NOT EXISTS` semantics). A `schema_version` table is created
  but not yet used to track versions.
- **Async throughout** — all database operations use SQLAlchemy async sessions via
  aiosqlite
- **Uniform error envelope** — handled errors (404, 409, 422, …) are returned as
  `{ "error": { "code", "message" } }` (see [api.md](api.md)); unexpected 500s still
  use FastAPI's default response

## Configuration

`~/.config/promptvault/config.toml` is read by the **CLI only** (API base URL and
an optional API key). The backend does not read it.

## Authentication

None is enforced. `backend/auth.py` contains an API-key middleware, but it is not
registered in `backend/main.py`. Run the server on `localhost` only.
