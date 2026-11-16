"""Tests for full-text search staying in sync with entry changes."""

import pytest


async def _create(client, title, body, **extra):
    resp = await client.post("/api/v1/entries", json={"title": title, "body": body, **extra})
    assert resp.status_code == 201
    return resp.json()["data"]["id"]


async def _search_ids(client, q, **params):
    resp = await client.get("/api/v1/search", params={"q": q, **params})
    assert resp.status_code == 200
    return [e["id"] for e in resp.json()["data"]]


@pytest.mark.asyncio
async def test_search_finds_entry_created_via_api(client):
    """A newly created entry is immediately searchable."""
    entry_id = await _create(client, "Zebra helper", "contains quokkatoken1")
    assert entry_id in await _search_ids(client, "quokkatoken1")


@pytest.mark.asyncio
async def test_search_reflects_updates(client):
    """Editing an entry replaces its old terms with the new ones in the index."""
    entry_id = await _create(client, "Updatable", "oldterm2 body")
    assert entry_id in await _search_ids(client, "oldterm2")

    resp = await client.put(f"/api/v1/entries/{entry_id}", json={"body": "newterm2 body"})
    assert resp.status_code == 200

    assert entry_id not in await _search_ids(client, "oldterm2")
    assert entry_id in await _search_ids(client, "newterm2")


@pytest.mark.asyncio
async def test_search_forgets_deleted_entries(client):
    """Deleted entries no longer appear in search results."""
    entry_id = await _create(client, "Doomed", "ephemeraltoken3")
    assert entry_id in await _search_ids(client, "ephemeraltoken3")

    resp = await client.delete(f"/api/v1/entries/{entry_id}")
    assert resp.status_code == 204

    assert entry_id not in await _search_ids(client, "ephemeraltoken3")


@pytest.mark.asyncio
async def test_search_applies_filters(client):
    """The type filter narrows FTS results."""
    prompt_id = await _create(client, "A", "sharedtoken4", type="prompt")
    snippet_id = await _create(client, "B", "sharedtoken4", type="snippet")

    ids = await _search_ids(client, "sharedtoken4", type="snippet")
    assert ids == [snippet_id]
    assert prompt_id not in ids


@pytest.mark.asyncio
async def test_search_malformed_query_falls_back_to_like(client):
    """FTS5 syntax errors from user input fall back to LIKE instead of failing."""
    entry_id = await _create(client, "Quoted", 'has "unbalancedtoken5 quote')
    assert entry_id in await _search_ids(client, '"unbalancedtoken5')


async def test_like_fallback_escapes_wildcards(client):
    await _create(client, "percent", "100% done")
    await _create(client, "plain", "nothing special")
    # "%" is an FTS5 syntax error, forcing the LIKE fallback; "%" must match literally.
    ids = await _search_ids(client, "100%")
    assert len(ids) == 1
