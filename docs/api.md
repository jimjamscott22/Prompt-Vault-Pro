# API Reference

Base URL: `http://localhost:8765/api/v1`

## Authentication

None. The API does not check `X-API-Key` or any other credential, so run it on `localhost` only.

## Response Envelope

All successful responses:
```json
{ "data": ..., "meta": { "page": 1, "per_page": 20, "total": 100 } }
```

All error responses:
```json
{ "error": { "code": "not_found", "message": "Entry not found" } }
```

Common error codes: `not_found` (404), `already_in_bundle` (409), `validation_error` (422),
plus import-specific codes such as `invalid_file_type` (see [import.md](import.md)).
Validation errors also include a `details` array with the raw per-field errors.

List endpoints take `page` (default 1) and `per_page` (default 20) query params.

## Entries

### `GET /entries`
Query params: `page`, `per_page`, `project_id`, `type`, `language`

### `POST /entries`
Body: `{ "title", "body", "type", "language?", "project_id?", "tags?": ["tag1"] }`

### `GET /entries/{id}`

### `PUT /entries/{id}`
Body: partial entry fields

### `DELETE /entries/{id}`
Returns 204. The entry is also removed from any bundles that contain it.

## Bundles

### `GET /bundles`
### `POST /bundles`
Body: `{ "name", "description?", "export_format?" }`

### `GET /bundles/{id}`
Returns bundle with entries

### `PUT /bundles/{id}`
### `DELETE /bundles/{id}`

### `POST /bundles/{id}/entries`
Body: `{ "entry_id", "position?" }`
Returns 404 if the bundle or entry does not exist, and 409 (`already_in_bundle`) if the entry is already in the bundle.

### `GET /bundles/{id}/export`
Query params: `format` (claude_md | markdown | json | plaintext). Defaults to the bundle's `export_format`.
Returns `text/plain`. Code fences in `markdown` and `claude_md` output are lengthened when an entry body itself contains backticks.

## Projects

### `GET /projects`
### `POST /projects`
Body: `{ "name", "slug", "description?", "path?" }`

### `GET /projects/{id}`
### `PUT /projects/{id}`
### `DELETE /projects/{id}`

## Search

### `GET /search`
Query params: `q` (required), `project` (project slug), `lang`, `type`, `page`, `per_page`

Uses SQLite FTS5 with BM25 ranking. If the query is not valid FTS5 syntax (for example an unbalanced quote), it falls back to a case-insensitive substring match.

## Import

### `POST /import/claude-skills`
See [import.md](import.md).
