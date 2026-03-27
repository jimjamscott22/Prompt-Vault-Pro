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

### Running in Production (Local Use)

Once you're done developing, you can build the frontend and serve everything from a single process:

```bash
# Build the frontend
cd frontend
npm run build

# Run the backend (serves API + built frontend)
cd ../backend
uvicorn main:app --port 8765
```

To access from other devices on your network:

```bash
uvicorn main:app --host 0.0.0.0 --port 8765
```
# Other Methods Below

**Process manager** — If you want to keep them separate, use something like:

**pm2** — **pm2** start "uvicorn main:app" --name backend (manages both, auto-restarts)
**Honcho** / **foreman** — define a Procfile with both commands
A simple shell script that starts both
3. **systemd services** (Linux) — if you want them to auto-start on boot on your Pi, create a .service file for each. Most "set and forget" option.

> **Tip:** Drop `--reload` for production use — it's a dev-only feature that watches for file changes.

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
