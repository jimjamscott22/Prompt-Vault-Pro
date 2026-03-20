# Architecture

## Overview

PromptVaultPro is a local-first, single-user tool for managing AI prompts, code snippets, and context entries. It consists of three main components:

1. **Backend API** — FastAPI server with SQLite storage
2. **CLI** — Typer-based command-line interface (`pv`)
3. **Frontend** — React SPA for browsing and managing entries

## Design Decisions

- **SQLite only** — keeps the tool portable with zero infrastructure
- **FTS5** — provides fast full-text search with BM25 ranking without external dependencies
- **UUID primary keys** — avoids sequential IDs, supports future sync scenarios
- **TOML config** — simple, human-readable configuration at `~/.config/promptvault/config.toml`
- **No ORM migrations** — `CREATE TABLE IF NOT EXISTS` with a `schema_version` table for Phase 1
- **Async throughout** — all database operations use SQLAlchemy async sessions via aiosqlite
