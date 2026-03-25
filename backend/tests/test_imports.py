"""Tests for Claude skills markdown import — parser and endpoint."""

import io
import pytest

from services.import_service import parse_claude_skills_markdown, ParsedSkill


# ---------------------------------------------------------------------------
# Parser unit tests
# ---------------------------------------------------------------------------


class TestParseClaudeSkillsMarkdown:
    """Unit tests for the default Claude skills markdown parser."""

    def test_single_skill_full(self):
        """Parse a single skill with all common sections present."""
        md = """# Code Review Assistant

**Description:** Helps you review code for bugs, performance, and style.

**Triggers:** code review, review my code, check this code

## Instructions

When reviewing code, follow these steps:
1. Check for syntax errors.
2. Suggest performance improvements.
3. Review code style.
"""
        skills = parse_claude_skills_markdown(md)
        assert len(skills) == 1
        s = skills[0]
        assert s.title == "Code Review Assistant"
        assert "syntax errors" in s.body
        assert "code review" in s.tags
        assert "review my code" in s.tags
        assert "Helps you review code" in s.description

    def test_single_skill_heading_only(self):
        """Parse a skill with only a heading — no optional sections."""
        md = "# My Bare Skill\n\nDo something useful."
        skills = parse_claude_skills_markdown(md)
        assert len(skills) == 1
        assert skills[0].title == "My Bare Skill"
        # Body should contain the content even without a labelled section
        assert skills[0].body != ""

    def test_skill_prefix_stripped_from_title(self):
        """'Skill:' prefix in the heading should be stripped from the title."""
        md = "# Skill: My Prompt\n\n## Instructions\n\nDo the thing."
        skills = parse_claude_skills_markdown(md)
        assert skills[0].title == "My Prompt"

    def test_multi_skill_document(self):
        """Multiple top-level headings produce multiple ParsedSkill objects."""
        md = """# First Skill

## Description
The first skill.

## Instructions
Do first things.

---

# Second Skill

## Description
The second skill.

## Instructions
Do second things.
"""
        skills = parse_claude_skills_markdown(md)
        assert len(skills) == 2
        assert skills[0].title == "First Skill"
        assert skills[1].title == "Second Skill"
        assert "first things" in skills[0].body
        assert "second things" in skills[1].body

    def test_missing_description_and_tags(self):
        """Skills with no description or tags should still parse cleanly."""
        md = """# Silent Skill

## Instructions
Follow these rules carefully.
"""
        skills = parse_claude_skills_markdown(md)
        assert len(skills) == 1
        s = skills[0]
        assert s.description == ""
        assert s.tags == []
        assert "Follow these rules" in s.body

    def test_tags_parsed_correctly(self):
        """Tags separated by commas are split into a list."""
        md = """# Tag Test

**Tags:** alpha, Beta, GAMMA

## Instructions
Content here.
"""
        skills = parse_claude_skills_markdown(md)
        tags = skills[0].tags
        assert "alpha" in tags
        assert "beta" in tags
        assert "gamma" in tags

    def test_triggers_section_mapped_to_tags(self):
        """A 'Triggers' section should also produce tags."""
        md = """# Trigger Test

## Triggers
foo, bar, baz

## Instructions
Some content.
"""
        skills = parse_claude_skills_markdown(md)
        assert "foo" in skills[0].tags
        assert "bar" in skills[0].tags

    def test_alternative_body_label(self):
        """'Prompt' as the body section label should be recognised."""
        md = """# Alternative Body

## Prompt
This is the actual prompt text.
"""
        skills = parse_claude_skills_markdown(md)
        assert "actual prompt text" in skills[0].body

    def test_empty_string_raises(self):
        """Empty input should raise ValueError."""
        with pytest.raises(ValueError, match="empty"):
            parse_claude_skills_markdown("")

    def test_whitespace_only_raises(self):
        """Whitespace-only input should raise ValueError."""
        with pytest.raises(ValueError, match="empty"):
            parse_claude_skills_markdown("   \n\t\n")

    def test_raw_preserved(self):
        """raw attribute should contain the original block text."""
        md = "# Raw Skill\n\nSome content."
        skills = parse_claude_skills_markdown(md)
        assert "Raw Skill" in skills[0].raw

    def test_case_insensitive_section_labels(self):
        """Section labels should match regardless of case."""
        md = """# Case Test

## DESCRIPTION
Upper-case description.

## INSTRUCTIONS
Upper-case instructions.
"""
        skills = parse_claude_skills_markdown(md)
        assert "Upper-case description" in skills[0].description
        assert "Upper-case instructions" in skills[0].body

    def test_three_skills_parsed(self):
        """Three consecutive skill blocks are all returned."""
        md = """# Skill One
## Instructions
Content one.

# Skill Two
## Instructions
Content two.

# Skill Three
## Instructions
Content three.
"""
        skills = parse_claude_skills_markdown(md)
        assert len(skills) == 3

    def test_h2_top_heading_treated_as_skill(self):
        """H2 top-level headings should be treated as skill titles."""
        md = """## My H2 Skill

## Description
Short description.

## Instructions
Do things.
"""
        skills = parse_claude_skills_markdown(md)
        assert skills[0].title == "My H2 Skill"

    def test_malformed_no_heading(self):
        """Content with no headings should still produce a skill entry."""
        md = "Just some plain text without any headings at all."
        # Should not raise; produces one skill with body = the text
        skills = parse_claude_skills_markdown(md)
        assert len(skills) == 1
        assert skills[0].body != ""


# ---------------------------------------------------------------------------
# Endpoint integration tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_import_via_content_field(client):
    """Import using the ``content`` form field."""
    md = "# My Imported Skill\n\n## Instructions\n\nDo something great."
    resp = await client.post(
        "/api/v1/import/claude-skills",
        data={"content": md},
    )
    assert resp.status_code == 201
    body = resp.json()["data"]
    assert body["imported"] == 1
    assert body["entries"][0]["title"] == "My Imported Skill"
    assert body["entries"][0]["type"] == "prompt"


@pytest.mark.asyncio
async def test_import_via_file_upload(client):
    """Import using a multipart file upload."""
    md = "# File Upload Skill\n\n## Instructions\n\nUploaded via file."
    resp = await client.post(
        "/api/v1/import/claude-skills",
        files={"file": ("skills.md", io.BytesIO(md.encode()), "text/markdown")},
    )
    assert resp.status_code == 201
    body = resp.json()["data"]
    assert body["imported"] == 1
    assert body["entries"][0]["title"] == "File Upload Skill"


@pytest.mark.asyncio
async def test_import_multi_skill(client):
    """Multiple skills in one markdown produce multiple entries."""
    md = """# Skill Alpha
## Instructions
Alpha content.

# Skill Beta
## Instructions
Beta content.
"""
    resp = await client.post(
        "/api/v1/import/claude-skills",
        data={"content": md},
    )
    assert resp.status_code == 201
    body = resp.json()["data"]
    assert body["imported"] == 2
    titles = [e["title"] for e in body["entries"]]
    assert "Skill Alpha" in titles
    assert "Skill Beta" in titles


@pytest.mark.asyncio
async def test_import_with_tags(client):
    """Tags from the markdown should be attached to created entries."""
    md = """# Tagged Skill

**Tags:** python, fastapi, backend

## Instructions
Build something.
"""
    resp = await client.post(
        "/api/v1/import/claude-skills",
        data={"content": md},
    )
    assert resp.status_code == 201
    entry = resp.json()["data"]["entries"][0]
    tag_names = [t["name"] for t in entry["tags"]]
    assert "python" in tag_names
    assert "fastapi" in tag_names
    assert "backend" in tag_names


@pytest.mark.asyncio
async def test_import_empty_content_returns_422(client):
    """Empty content field should return 422 with a clear error."""
    resp = await client.post(
        "/api/v1/import/claude-skills",
        data={"content": ""},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_import_no_body_returns_422(client):
    """No file and no content should return 422."""
    resp = await client.post("/api/v1/import/claude-skills")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_import_wrong_file_type_returns_422(client):
    """Uploading a non-markdown file should return 422."""
    resp = await client.post(
        "/api/v1/import/claude-skills",
        files={"file": ("skills.pdf", io.BytesIO(b"binary data"), "application/pdf")},
    )
    assert resp.status_code == 422
    error = resp.json()["detail"]["error"]
    assert error["code"] == "invalid_file_type"


@pytest.mark.asyncio
async def test_imported_entries_appear_in_list(client):
    """Entries created via import should appear in the main entries list."""
    md = "# Listable Skill\n\n## Instructions\n\nAppears in list."
    await client.post(
        "/api/v1/import/claude-skills",
        data={"content": md},
    )
    resp = await client.get("/api/v1/entries")
    assert resp.status_code == 200
    titles = [e["title"] for e in resp.json()["data"]]
    assert "Listable Skill" in titles
