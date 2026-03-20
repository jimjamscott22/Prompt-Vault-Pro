# Prompt-Vault-Pro

AI Prompt & Snippet Library with Project Binding. A local-first, CLI-friendly personal knowledge base for saving prompts, code patterns, and AI-generated snippets — tagged by project, language, and topic. Includes a REST API and CLI for seeding AI sessions with relevant context.

## Quick Start

### Prerequisites
- Python 3.11 or later
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip + venv

### Setup

#### Option 1: Using `uv` (Recommended)

```bash
# Backend setup
cd backend
uv venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
uv pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8765
```

In another terminal:

```bash
# Frontend setup
cd frontend
npm install
npm run dev
```

#### Option 2: Using `pip` + `venv`

```bash
# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --port 8765
```

In another terminal:

```bash
# Frontend setup
cd frontend
npm install
npm run dev
```

### CLI Installation

```bash
# Using uv
uv pip install -e ./cli

# Or using pip
pip install -e ./cli
```

Then run: `pv --help`

---

For detailed documentation, see [CLAUDE.md](CLAUDE.md). 
