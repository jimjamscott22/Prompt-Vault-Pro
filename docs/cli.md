# CLI Reference

The `pv` command is a thin client for the REST API, so the backend must be running
(see the [README](../README.md)).

## Installation

```bash
pip install -e ./cli      # or, inside an active virtualenv: uv pip install -e ./cli
pv --help
```

## Commands

### `pv add`
Save a new entry interactively or via flags. Without `--title` / `--body` it prompts;
end the body with an empty line or Ctrl+D.

```bash
pv add                                          # Interactive
pv add --title "My Prompt" --body "..." --type prompt
pv add --type snippet --lang python --project <project-id> --tags "util,helper"
```

`--project` takes a project **ID** (not a slug). Types are `prompt`, `snippet`, `context`.

### `pv search`
Full-text search across entries.

```bash
pv search "react hooks"
pv search "state management" --project myapp --lang typescript --type snippet
```

Here `--project` takes a project **slug**. Results are shown in a table.

### `pv bundle`
Manage bundles.

```bash
pv bundle create my-bundle --description "React patterns" --format claude_md
pv bundle list
pv bundle add <bundle-id> <entry-id>
```

`pv bundle add` reports an error (HTTP 409) if the entry is already in the bundle.

### `pv export`
Export a bundle to stdout or a file.

```bash
pv export --bundle <bundle-id>
pv export --bundle <bundle-id> --format claude_md --out ./CLAUDE.md
```

`--bundle` takes a bundle **ID**; names are not resolved. Formats: `claude_md`,
`markdown`, `json`, `plaintext` (default: the bundle's own format).

> **Note:** the ID columns in `pv search` and `pv bundle list` are truncated to 8
> characters, but `pv bundle add` and `pv export` need the full ID. Get full IDs
> from the API (`GET /api/v1/bundles`, `GET /api/v1/entries`) or the interactive
> docs at `http://localhost:8765/docs`.

## Configuration

Optional config file: `~/.config/promptvault/config.toml`

```toml
[api]
base_url = "http://localhost:8765/api/v1"   # default

[auth]
# api_key = "your-key-here"   # sent as X-API-Key; the server does not currently check it
```
