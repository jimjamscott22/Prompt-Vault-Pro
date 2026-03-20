# API Reference

Base URL: `http://localhost:8765/api/v1`

## Authentication

- Header: `X-API-Key: <your-key>`
- Skipped when `auth.local_only = true` in config

## Response Envelope

All successful responses:
```json
{ "data": ..., "meta": { "page": 1, "per_page": 20, "total": 100 } }
```

All error responses:
```json
{ "error": { "code": "not_found", "message": "Entry not found" } }
```

## Entries

### `GET /entries`
Query params: `page`, `per_page`, `project_id`, `type`, `language`

### `POST /entries`
Body: `{ "title", "body", "type", "language?", "project_id?", "tags?": ["tag1"] }`

### `GET /entries/{id}`

### `PUT /entries/{id}`
Body: partial entry fields

### `DELETE /entries/{id}`
Returns 204

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

### `GET /bundles/{id}/export`
Query params: `format` (claude_md | markdown | json | plaintext)

## Projects

### `GET /projects`
### `POST /projects`
Body: `{ "name", "slug", "description?", "path?" }`

### `GET /projects/{id}`
### `PUT /projects/{id}`
### `DELETE /projects/{id}`

## Search

### `GET /search`
Query params: `q` (required), `project`, `lang`, `type`, `page`, `per_page`
