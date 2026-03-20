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
