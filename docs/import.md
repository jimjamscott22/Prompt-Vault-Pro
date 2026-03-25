# Importing Claude Skills Markdown

Prompt Vault Pro includes a built-in importer that converts Claude skills
markdown files (`.md`) into prompt entries.  Each skill in the file becomes
a separate entry of type `prompt`, automatically tagged with any triggers or
keywords found in the document.

---

## How to Import

### Via the Web UI

1. Open the **Entries** page.
2. Click the **Import** button (next to "New Entry" in the top-right corner).
3. Choose an input method:
   - **Paste Markdown** – paste the content of your `.md` file into the text area.
   - **Upload File** – click the drop zone (or drag and drop) to choose a `.md` file
     from your computer.
4. Click **Import**.
5. A success banner shows the number of prompts created.  New entries appear in
   the entry list immediately.

### Via the REST API

Send a `POST` request to `/api/v1/import/claude-skills` with a `multipart/form-data`
body.

**Upload a file:**

```bash
curl -X POST http://localhost:8765/api/v1/import/claude-skills \
  -F "file=@skills.md;type=text/markdown"
```

**Paste text:**

```bash
curl -X POST http://localhost:8765/api/v1/import/claude-skills \
  -F 'content=# My Skill

## Instructions
Do something useful.'
```

**Response:**

```json
{
  "data": {
    "imported": 2,
    "entries": [
      {
        "id": "...",
        "title": "My Skill",
        "body": "Do something useful.",
        "type": "prompt",
        "tags": [],
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

## Supported Markdown Format

The importer accepts any reasonable Claude skills markdown file.  There is no
single required schema — the parser is designed to be tolerant of common
formatting variations.

### Single-skill file

```markdown
# Skill title here

**Description:** A short summary of what this skill does.

**Triggers:** phrase one, phrase two, another phrase

## Instructions

Step-by-step instructions that become the body of the prompt entry.
```

### Multi-skill file

Separate skills with additional `#` headings.  Each top-level `#` heading
starts a new skill.

```markdown
# First Skill

## Description
What the first skill does.

## Instructions
First skill instructions.

---

# Second Skill

## Description
What the second skill does.

## Instructions
Second skill instructions.
```

---

## Field Mapping

| Markdown element | Prompt Vault Pro field |
|---|---|
| `#` heading text (with `Skill:` prefix stripped) | `title` |
| `## Description` / `## Summary` / `**Description:**` | stored in description; if no dedicated body section exists, description becomes the body |
| `## Instructions` / `## Prompt` / `## Content` / `**Instructions:**` | `body` |
| `## Triggers` / `## Tags` / `## Keywords` / `**Tags:**` | `tags` (comma-separated list) |
| Entry type | always `prompt` |

All field matching is **case-insensitive** (e.g., `## DESCRIPTION` and
`## description` are treated identically).

---

## Parser Behaviour and Limitations

- **Skill boundaries**: A `#` (H1) heading starts a new skill.  If the
  document has no H1 headings but has multiple H2 headings, H2 headings are
  used as skill boundaries instead.
- **Body fallback**: If no recognised body section is found, the parser falls
  back to preamble text (content before the first sub-heading), then to any
  unrecognised sections, then to a generic placeholder.
- **Tags**: Tags are split on commas, semicolons, and newlines, and lower-cased.
  Markdown list markers (`-`, `*`, `•`) are stripped.
- **File size limit**: Uploaded files must be ≤ 1 MB and UTF-8 encoded.
- **Supported file types**: `.md`, `text/markdown`, and `text/plain`.

### Known limitations

- Deeply nested heading structures (e.g., `####`) inside a skill body are
  treated as sections, not as body text.  The body is reconstructed from
  `## Instructions`-style sections.
- The parser does not attempt to resolve YAML front-matter — if present it
  will appear as body text.
- Only UTF-8 encoded files are supported.  Binary or non-UTF-8 files return a
  422 error.
- The import always creates entries of type `prompt`.  Snippet or context types
  must be set manually after import.
