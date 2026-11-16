"""Tests for bundle membership, export, and the API error envelope."""

import itertools

import pytest

_counter = itertools.count()


async def _entry(client, body="body", **extra):
    resp = await client.post(
        "/api/v1/entries", json={"title": f"entry-{next(_counter)}", "body": body, **extra}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


async def _bundle(client, fmt="markdown"):
    resp = await client.post(
        "/api/v1/bundles", json={"name": f"bundle-{next(_counter)}", "export_format": fmt}
    )
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


@pytest.mark.asyncio
async def test_add_same_entry_twice_returns_409(client):
    """Adding an entry that is already in the bundle is a conflict, not a crash."""
    entry_id = await _entry(client)
    bundle_id = await _bundle(client)

    first = await client.post(f"/api/v1/bundles/{bundle_id}/entries", json={"entry_id": entry_id})
    second = await client.post(f"/api/v1/bundles/{bundle_id}/entries", json={"entry_id": entry_id})

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "already_in_bundle"


@pytest.mark.asyncio
async def test_delete_entry_that_is_in_a_bundle(client):
    """Deleting an entry also removes it from bundles."""
    entry_id = await _entry(client)
    bundle_id = await _bundle(client)
    await client.post(f"/api/v1/bundles/{bundle_id}/entries", json={"entry_id": entry_id})

    resp = await client.delete(f"/api/v1/entries/{entry_id}")
    assert resp.status_code == 204

    detail = await client.get(f"/api/v1/bundles/{bundle_id}")
    assert detail.status_code == 200
    assert detail.json()["data"]["entries"] == []


@pytest.mark.asyncio
async def test_export_uses_longer_fence_when_body_has_backticks(client):
    """A body containing a code fence must not terminate the export fence early."""
    body = "before\n```python\nprint('hi')\n```\nafter"
    entry_id = await _entry(client, body=body)
    bundle_id = await _bundle(client)
    await client.post(f"/api/v1/bundles/{bundle_id}/entries", json={"entry_id": entry_id})

    for fmt in ("markdown", "claude_md"):
        resp = await client.get(f"/api/v1/bundles/{bundle_id}/export", params={"format": fmt})
        assert resp.status_code == 200
        assert f"````\n{body}\n````" in resp.text


@pytest.mark.asyncio
async def test_export_keeps_three_backtick_fence_for_plain_bodies(client):
    """Bodies without backticks still use the standard three-backtick fence."""
    entry_id = await _entry(client, body="plain text", language="python")
    bundle_id = await _bundle(client)
    await client.post(f"/api/v1/bundles/{bundle_id}/entries", json={"entry_id": entry_id})

    resp = await client.get(f"/api/v1/bundles/{bundle_id}/export")
    assert "```python\nplain text\n```" in resp.text


@pytest.mark.asyncio
async def test_not_found_uses_error_envelope(client):
    """404s are returned as {"error": {"code", "message"}} at the top level."""
    resp = await client.get("/api/v1/entries/does-not-exist")
    assert resp.status_code == 404
    assert resp.json() == {"error": {"code": "not_found", "message": "Entry not found"}}


@pytest.mark.asyncio
async def test_validation_error_uses_error_envelope(client):
    """Request validation errors share the same envelope and include a readable message."""
    resp = await client.post("/api/v1/entries", json={"title": "x", "body": "y", "type": "bogus"})
    assert resp.status_code == 422
    error = resp.json()["error"]
    assert error["code"] == "validation_error"
    assert "type" in error["message"]
    assert isinstance(error["details"], list)
