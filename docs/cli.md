# CLI Reference

## Installation

```bash
pip install -e ./cli
```

## Commands

### `pv add`
Save a new entry interactively or via flags.

```bash
pv add                                          # Interactive
pv add --title "My Prompt" --body "..." --type prompt
pv add --type snippet --lang python --project myapp --tags "util,helper"
```

### `pv search`
Full-text search across entries.

```bash
pv search "react hooks"
pv search --project myapp --lang typescript "state management"
```

### `pv export`
Export a bundle to stdout or file.

```bash
pv export --bundle my-bundle
pv export --bundle my-bundle --format claude_md --out ./CLAUDE.md
```

### `pv bundle`
Manage bundles.

```bash
pv bundle create my-bundle --description "React patterns"
pv bundle list
pv bundle add <bundle-id> <entry-id>
```

## Configuration

Config file: `~/.config/promptvault/config.toml`

```toml
[api]
base_url = "http://localhost:8765/api/v1"

[auth]
local_only = true
# api_key = "your-key-here"
```
