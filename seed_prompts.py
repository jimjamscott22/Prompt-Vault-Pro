"""Seed the prompt library with test/benchmark prompts."""

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path.home() / ".config" / "promptvault" / "promptvault.db"

PROMPTS = [
    {
        "category": "Creative Writing",
        "prompt": "Write a short story (max 500 words) about a world where gravity reverses for 1 hour every day. Include: characters' daily adaptations, societal changes, and one unexpected consequence.",
    },
    {
        "category": "Logical Reasoning",
        "prompt": "Solve this WITHOUT using code: You have 8 identical coins. One is counterfeit (lighter weight). Using a balance scale only twice, identify the fake coin.",
    },
    {
        "category": "Memory & Context",
        "prompt": "Read this article extract: [PROVIDE 100-WORD ARTICLE ABOUT CLIMATE CHANGE IMPACTS]. Then answer: 1) What's the most crucial statistic? 2) Which sentence best represents the author's concern? 3) Summarize in 20 words.",
    },
    {
        "category": "Multi-Step Instruction",
        "prompt": "Plan a 4-course dinner party for 6 people with $100 budget. Constraints: 1 vegan, 1 gluten-free, use seasonal ingredients, include beverage pairings.",
    },
    {
        "category": "Technical Debugging",
        "prompt": "Identify and fix errors in this Python code: [PROVIDE 10-LINE CODE WITH 2 BUGS]. Explain why the original code failed and how your solution works.",
    },
    {
        "category": "Real-World Problem Solving",
        "prompt": "Propose 3 actionable solutions for a small town to reduce single-use plastic waste by 30% within 6 months, considering budget constraints and resident resistance.",
    },
    {
        "category": "Emotional Intelligence",
        "prompt": "Read this customer complaint: [PROVIDE 3-SENTENCE COMPLAINT ABOUT POOR SERVICE]. Draft a response that: 1) Acknowledges feelings 2) Offers solution 3) Restores trust",
    },
    {
        "category": "Cultural Adaptation",
        "prompt": "Write advertising copy (50 words) for a chai tea product, first for a US market, then adapted for Indian consumers. Highlight key differences in your approach.",
    },
    {
        "category": "Mathematical Reasoning",
        "prompt": "A train leaves Station A at 60 mph. 15 minutes later, another leaves Station B (100 miles away) towards each other at 80 mph. When and where will they meet?",
    },
    {
        "category": "Ethical Dilemma",
        "prompt": "You're an AI advisor to a hospital. A patient needs a life-saving drug, but giving it would violate patent law. Argue for/against administering the drug, considering all stakeholders.",
    },
    {
        "category": "Factual Recall",
        "prompt": "Explain the difference between mitosis and meiosis in 100 words, using an analogy that a 10-year-old would understand.",
    },
    {
        "category": "Instruction Following",
        "prompt": "Create a 5-day workout plan for someone recovering from knee surgery. Include: 1) Daily exercises 2) Modifications 3) Progression metrics 4) Warning signs",
    },
    {
        "category": "Abstract Reasoning",
        "prompt": "What would society look like if humans developed telepathic abilities tomorrow? Discuss: 1) Education 2) Privacy laws 3) Workplace communication",
    },
    {
        "category": "Information Synthesis",
        "prompt": "Combine these two sentences into one coherent statement: 'The alarm sounded at 3 AM.' 'Most residents didn't hear it through storm barriers.'",
    },
    {
        "category": "Creative Constraints",
        "prompt": "Write a haiku about loneliness using only words starting with L (except articles/prepositions).",
    },
    {
        "category": "Cross-Domain Application",
        "prompt": "Apply military strategy principles to redesign a grocery store's checkout system to reduce lines during peak hours.",
    },
]


def seed():
    conn = sqlite3.connect(DB_PATH)
    now = datetime.now(timezone.utc).isoformat()
    inserted = 0

    try:
        for item in PROMPTS:
            entry_id = str(uuid.uuid4())
            tag_name = item["category"]

            conn.execute(
                """
                INSERT INTO entries (id, title, body, type, language, project_id, created_at, updated_at)
                VALUES (?, ?, ?, 'prompt', NULL, NULL, ?, ?)
                """,
                (entry_id, tag_name, item["prompt"], now, now),
            )

            # Upsert tag
            row = conn.execute("SELECT id FROM tags WHERE name = ?", (tag_name,)).fetchone()
            if not row:
                tag_id_new = str(uuid.uuid4())
                conn.execute(
                    "INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)",
                    (tag_id_new, tag_name, now),
                )
            row = conn.execute("SELECT id FROM tags WHERE name = ?", (tag_name,)).fetchone()
            tag_id = row[0]

            conn.execute(
                "INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)",
                (entry_id, tag_id),
            )

            # Keep FTS in sync
            conn.execute(
                "INSERT INTO entries_fts (rowid, title, body) SELECT rowid, title, body FROM entries WHERE id = ?",
                (entry_id,),
            )

            inserted += 1

        conn.commit()
        print(f"Inserted {inserted} prompts successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed()
