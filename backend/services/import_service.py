"""Claude skills markdown import service.

Default parser for Claude skills markdown documents.  Tolerates a variety of
common formats — heading levels, inline bold labels, and multi-skill files.
"""

import re
from dataclasses import dataclass


@dataclass
class ParsedSkill:
    """A single skill parsed from a Claude skills markdown document."""

    title: str
    description: str
    tags: list[str]
    body: str
    raw: str


# ---------------------------------------------------------------------------
# Label sets — extended to cover real-world naming variations
# ---------------------------------------------------------------------------

_DESC_LABELS: frozenset[str] = frozenset({
    "description", "summary", "about", "overview", "desc", "synopsis"
})

_TAG_LABELS: frozenset[str] = frozenset({
    "triggers", "tags", "keywords", "tag", "trigger", "labels",
    "use cases", "use case", "when to use",
})

_BODY_LABELS: frozenset[str] = frozenset({
    "instructions", "instruction", "prompt", "content", "body",
    "usage", "details", "behavior", "behaviour", "directions",
    "system prompt", "system", "template",
})


def _normalise_label(text: str) -> str:
    """Return a lowercase, punctuation-stripped version of *text* for matching."""
    return re.sub(r"[^a-z0-9 ]", "", text.lower()).strip()


# ---------------------------------------------------------------------------
# Step 1 — split document into per-skill raw blocks
# ---------------------------------------------------------------------------

# Only H1 headings delimit skills.  H2+ headings are sections inside a skill.
_H1_RE = re.compile(r"^# .+$", re.MULTILINE)
# Fallback: if no H1 headings exist, treat H2 headings as skill boundaries.
_H2_RE = re.compile(r"^## .+$", re.MULTILINE)


def _split_into_skill_blocks(markdown: str) -> list[str]:
    """Split a markdown document into one or more raw skill blocks.

    Rules:
    - H1 headings (``# …``) delimit skills; H2+ are sub-sections within a skill.
    - If no H1 headings exist but multiple H2 headings exist, treat H2 as the
      skill boundary instead.
    - A horizontal rule (``---``) between skills is stripped but not used as a
      primary splitter (the heading is the authoritative boundary).
    - If the document has only one top-level heading (or none), return it as a
      single-element list.
    """
    markdown = markdown.replace("\r\n", "\n").strip()
    if not markdown:
        return []

    h1_matches = list(_H1_RE.finditer(markdown))

    if len(h1_matches) >= 1:
        boundary_matches = h1_matches
    else:
        h2_matches = list(_H2_RE.finditer(markdown))
        if len(h2_matches) >= 2:
            boundary_matches = h2_matches
        else:
            # Single-skill document — return as-is
            return [markdown]

    blocks: list[str] = []
    for i, match in enumerate(boundary_matches):
        start = match.start()
        end = (
            boundary_matches[i + 1].start()
            if i + 1 < len(boundary_matches)
            else len(markdown)
        )
        chunk = markdown[start:end].strip()
        # Remove trailing/leading horizontal rules between blocks
        chunk = re.sub(r"\n-{3,}\s*$", "", chunk).strip()
        chunk = re.sub(r"^-{3,}\s*\n", "", chunk).strip()
        if chunk:
            blocks.append(chunk)

    return blocks if blocks else [markdown]


# ---------------------------------------------------------------------------
# Step 2 — parse a single skill block into labelled sections
# ---------------------------------------------------------------------------

# Inline bold label on its own line: **Label:** value text
_INLINE_LABEL_RE = re.compile(r"^\*{2}([^*]+)\*{2}\s*:?\s*(.*)$")

# Sub-heading inside a skill block (H2 or deeper)
_SUB_HEADING_RE = re.compile(r"^(#{2,6})\s+(.+)$")


def _parse_sections(block: str) -> dict[str, str]:
    """Parse a skill block into a dict of normalised-label → content.

    Special keys:
    - ``_heading``: the first line (skill title heading)
    - ``_preamble``: free text before the first sub-section
    """
    lines = block.splitlines()
    if not lines:
        return {}

    sections: dict[str, str] = {"_heading": lines[0].strip()}

    current_key: str | None = None
    buffer: list[str] = []

    def _flush() -> None:
        if current_key is not None:
            existing = sections.get(current_key, "")
            addition = "\n".join(buffer).strip()
            sections[current_key] = (existing + "\n" + addition).strip() if existing else addition

    for line in lines[1:]:
        # Sub-heading → start a new section
        sub_match = _SUB_HEADING_RE.match(line)
        if sub_match:
            _flush()
            buffer = []
            current_key = _normalise_label(sub_match.group(2))
            continue

        # Inline bold label: **Label:** rest of line
        inline_match = _INLINE_LABEL_RE.match(line)
        if inline_match:
            label = _normalise_label(inline_match.group(1))
            value = inline_match.group(2).strip()
            # If there is already a sub-section open, flush it first
            _flush()
            buffer = []
            current_key = None
            # Store as a one-line section immediately
            existing = sections.get(label, "")
            sections[label] = (existing + "\n" + value).strip() if existing else value
            continue

        # Accumulate content into the current section (or preamble)
        if current_key is None:
            current_key = "_preamble"
        buffer.append(line)

    _flush()
    return sections


# ---------------------------------------------------------------------------
# Step 3 — extract structured fields from sections
# ---------------------------------------------------------------------------

def _match_section(sections: dict[str, str], labels: frozenset[str]) -> str | None:
    """Return the first section value whose normalised key is in *labels*."""
    for key, value in sections.items():
        if _normalise_label(key) in labels:
            stripped = value.strip()
            return stripped if stripped else None
    return None


def _extract_tags(raw: str | None) -> list[str]:
    """Split a comma/semicolon/newline-separated tag string into a list."""
    if not raw:
        return []
    parts = re.split(r"[,;\n]+", raw)
    result: list[str] = []
    for part in parts:
        tag = re.sub(r"^[\-\*•]\s*", "", part).strip().lower()
        if tag:
            result.append(tag)
    return result


def _build_body(sections: dict[str, str], title: str) -> str:
    """Construct the main instruction body from parsed sections.

    Priority order:
    1. A section whose label is in ``_BODY_LABELS``.
    2. ``_preamble`` text (free text before any sub-section).
    3. All unlabelled/unknown sections concatenated.
    4. Hard fallback: ``Skill: <title>``
    """
    # 1. Named body section
    named = _match_section(sections, _BODY_LABELS)
    if named:
        return named

    # 2. Preamble
    preamble = sections.get("_preamble", "").strip()
    if preamble:
        return preamble

    # 3. Collect unknown sections (not meta, not heading/preamble)
    _meta_keys = _DESC_LABELS | _TAG_LABELS | {"_heading", "_preamble"}
    parts = [
        v.strip()
        for k, v in sections.items()
        if _normalise_label(k) not in _meta_keys and v.strip()
    ]
    if parts:
        return "\n\n".join(parts)

    # 4. Final fallback
    return f"Skill: {title}"


# ---------------------------------------------------------------------------
# Step 4 — assemble ParsedSkill
# ---------------------------------------------------------------------------

def _parse_skill_block(block: str) -> ParsedSkill | None:
    """Convert a raw skill block string into a ``ParsedSkill``.

    Return None for empty blocks.
    """
    block = block.strip()
    if not block:
        return None

    sections = _parse_sections(block)
    heading = sections.get("_heading", "")

    # Extract clean title from heading
    title = re.sub(r"^#+\s*", "", heading).strip()
    title = re.sub(r"^(?:skill|name|title)\s*:\s*", "", title, flags=re.IGNORECASE).strip()
    if not title:
        title = "Untitled Skill"

    description = _match_section(sections, _DESC_LABELS) or ""
    raw_tags = _match_section(sections, _TAG_LABELS)
    tags = _extract_tags(raw_tags)
    body = _build_body(sections, title)

    return ParsedSkill(
        title=title,
        description=description,
        tags=tags,
        body=body,
        raw=block,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_claude_skills_markdown(markdown: str) -> list[ParsedSkill]:
    """Parse a Claude skills markdown document into ``ParsedSkill`` objects.

    Handles single and multi-skill documents.  Tolerates missing optional
    sections, varying heading levels, inline bold labels, and minor format
    differences.

    Raises ``ValueError`` if *markdown* is blank or yields no parseable content.
    """
    if not markdown or not markdown.strip():
        raise ValueError("Markdown content is empty.")

    blocks = _split_into_skill_blocks(markdown)
    if not blocks:
        raise ValueError("No skill blocks found in the provided markdown.")

    skills: list[ParsedSkill] = []
    for block in blocks:
        skill = _parse_skill_block(block)
        if skill is not None:
            skills.append(skill)

    if not skills:
        raise ValueError("Could not parse any skills from the provided markdown.")

    return skills
