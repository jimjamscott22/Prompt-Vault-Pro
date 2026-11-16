"""Test entry CRUD endpoints."""

import pytest


@pytest.mark.asyncio
async def test_create_and_get_entry(client):
    """Create an entry and retrieve it."""
    payload = {
        "title": "Test Prompt",
        "body": "This is a test prompt body.",
        "type": "prompt",
        "tags": ["test", "python"],
    }
    resp = await client.post("/api/v1/entries", json=payload)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["title"] == "Test Prompt"
    assert len(data["tags"]) == 2

    entry_id = data["id"]
    resp = await client.get(f"/api/v1/entries/{entry_id}")
    assert resp.status_code == 200
    assert resp.json()["data"]["title"] == "Test Prompt"


@pytest.mark.asyncio
async def test_list_entries(client):
    """List entries returns paginated results."""
    resp = await client.get("/api/v1/entries")
    assert resp.status_code == 200
    assert "data" in resp.json()
    assert "meta" in resp.json()


@pytest.mark.asyncio
async def test_delete_entry(client):
    """Delete an entry."""
    payload = {"title": "To Delete", "body": "Will be deleted.", "type": "snippet"}
    resp = await client.post("/api/v1/entries", json=payload)
    entry_id = resp.json()["data"]["id"]

    resp = await client.delete(f"/api/v1/entries/{entry_id}")
    assert resp.status_code == 204

    resp = await client.get(f"/api/v1/entries/{entry_id}")
    assert resp.status_code == 404


async def test_list_rejects_invalid_pagination(client):
    for path in ("/api/v1/entries", "/api/v1/bundles", "/api/v1/projects", "/api/v1/search?q=x"):
        sep = "&" if "?" in path else "?"
        for query in ("page=0", "per_page=0", "per_page=101"):
            resp = await client.get(f"{path}{sep}{query}")
            assert resp.status_code == 422, (path, query)


async def test_entry_with_unknown_project_is_rejected(client):
    resp = await client.post(
        "/api/v1/entries",
        json={"title": "t", "body": "b", "type": "prompt", "project_id": "nope"},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"

    created = await client.post(
        "/api/v1/entries", json={"title": "t", "body": "b", "type": "prompt"}
    )
    entry_id = created.json()["data"]["id"]
    resp = await client.put(f"/api/v1/entries/{entry_id}", json={"project_id": "nope"})
    assert resp.status_code == 404
