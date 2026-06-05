# Physics VPL — Virtual Programming Lab

A web application for physics courses where students write Python code to solve simulation problems. Submissions are automatically graded by a local LLM that evaluates physics correctness, coding quality, and the quality of the student's physical reasoning in their comments.

---

## Features

- **In-browser Python editor** (Monaco) with live code execution and graph output
- **LLM-powered grading** via a local Ollama model — evaluates three independent categories
- **LaTeX problem statements** rendered with KaTeX, supporting full mathematical notation
- **Role-based access** — Admin, Teacher, and Student dashboards
- **Submission history** with per-category score breakdown and actionable feedback
- **Dark / light theme**

---

## Grading System

Each submission is scored across three categories, weighted as follows:

| Category | Weight | What is evaluated |
|---|---|---|
| Physics | 40% | Correct physical model, formulas, and constants |
| Coding | 40% | Correct numerical results and valid implementation |
| Reasoning | 20% | Quality of comments explaining the physical reasoning |

The reasoning score is based on how many of these 5 aspects the student's comments cover:

1. Physical assumptions
2. Forces and interactions
3. Mathematical model
4. Numerical method
5. Stopping / detection condition

**Scoring:** 5 aspects = 100, 4 = 80, 3 = 60, 2 = 40, 1 = 20, 0 = 0

The final grade is calculated programmatically from the three component scores — the LLM cannot inflate it.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | MongoDB Atlas via Mongoose |
| Auth | NextAuth v5 (JWT, email magic-code login) |
| LLM | Ollama (local, any compatible model) |
| Code editor | Monaco Editor |
| Graphs | Recharts |
| Math rendering | React Markdown + KaTeX |
| Code execution | Python (server-side via `child_process.spawn`) |
| Validation | Zod |

---

## Prerequisites

- **Node.js** v18+
- **Python** (accessible as `python` or `python3` in your PATH)
- **Ollama** running locally — download from [ollama.com](https://ollama.com)
- **MongoDB Atlas** account (free tier works)

### Recommended Ollama models

| Machine | Recommended model |
|---|---|
| Strong PC (16GB+ VRAM) | `qwen2.5:14b` |
| Laptop / lower RAM | `qwen2.5:3b` |

Pull your chosen model before starting:
```bash
ollama pull qwen2.5:14b
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/orshterenshus/physics_vpl.git
cd physics_vpl
npm install
```

### 2. Install Python dependencies

```bash
python -m pip install numpy
```

### 3. Create `.env.local`

Create a file called `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
AUTH_SECRET=<any-random-secret-string>
AUTH_RESEND_KEY=<your-resend-api-key>
NEXTAUTH_URL=http://localhost:3000
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:14b
PYTHON_CMD=python
```

> **Note:** Use `127.0.0.1` not `localhost` for `OLLAMA_BASE_URL` — Ollama binds to IPv4 only.

### 4. Seed the database (first run only)

```bash
node scripts/seed.mjs
```

This creates an initial admin user. Check the script for the default credentials.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
physics_vpl/
├── app/
│   ├── (admin)/          # Admin dashboard — manage users
│   ├── (teacher)/        # Teacher dashboard — create/edit problems, view submissions
│   ├── (student)/        # Student dashboard — browse problems, submit solutions
│   ├── api/
│   │   ├── run-code/     # Executes student Python code server-side (10s timeout)
│   │   ├── submissions/  # Submit code and poll for grade results
│   │   ├── problems/     # CRUD for problems
│   │   └── admin/        # Admin-only user and problem management
│   └── login/            # Email magic-code login page
├── components/
│   ├── editor/
│   │   ├── ProblemSolver.tsx   # Main student view: editor + run + submit
│   │   ├── ProblemEditor.tsx   # Teacher problem creation/editing form
│   │   └── GraphPanel.tsx      # Recharts graph output panel
│   └── ui/               # Theme toggle, sign-out button
├── lib/
│   ├── evaluate.ts       # LLM evaluation engine (Ollama integration + grading logic)
│   ├── auth.ts           # NextAuth full config (with DB)
│   ├── auth.config.ts    # Lean NextAuth config (no DB, used in middleware)
│   ├── session.ts        # Session-only auth import (avoids mongoose on page load)
│   └── db.ts             # MongoDB connection
├── models/
│   ├── User.ts           # Roles: student | teacher | admin
│   ├── Problem.ts        # Chapter, problem number, description, starter code, teacher solution
│   └── Submission.ts     # Grade, feedback, physicsScore, codingScore, reasoningScore, deductionReasons
├── scripts/
│   └── seed.mjs          # Database seed script
└── Q1 examples for grading.md   # Sample solutions showing expected scores for Q1
```

---

## User Roles

### Student
- Browse problems organised by chapter
- Write and run Python code in the browser
- Submit for grading — results appear within seconds
- View score breakdown (physics / coding / reasoning) and feedback

### Teacher
- Create and edit problems with LaTeX descriptions, starter code, and a reference solution
- Add evaluation hints that guide the LLM grader
- View all student submissions and grades

### Admin
- All teacher permissions
- Create and manage user accounts
- Generate login codes for students

---

## How Code Execution Works

When a student clicks **Run**:

1. The browser sends the code to `/api/run-code`
2. The server spawns a Python process (10-second timeout)
3. The student's code is wrapped in a try/except and `print` is captured
4. A `physics` helper object and a `set_graph(x, y, label)` function are injected automatically
5. Output and graph data are returned to the browser

```python
# These are available in every submission without importing:
physics.euler_step(position, velocity, acceleration, dt)
physics.kinetic_energy(mass, velocity)
physics.potential_energy(mass, g, height)
# ...

set_graph(x_list, y_list, label="My Graph")  # renders a chart in the UI
```

> **Tip:** Avoid `dt` values smaller than `1e-4` for simulations over 10 seconds — this creates millions of iterations and will timeout.

---

## How Grading Works

When a student clicks **Submit**:

1. The submission is saved to MongoDB with `grade: null`
2. Grading runs asynchronously in the background
3. The frontend polls until a grade appears
4. The LLM is called via Ollama with a structured prompt (see `lib/evaluate.ts`)
5. The JSON response is validated with Zod
6. The grade is recalculated programmatically from the three component scores

**Programmatic reasoning overrides** (applied after the LLM responds):
- No comments at all → reasoning score forced to 0
- Only block comments (`"""..."""`) → reasoning score capped at 25
- Inline `#` comments → LLM score is trusted

---

## Grading Examples (Q1 — Particle Trajectory)

The table below shows the four reference examples from [`Q1 examples for grading.md`](Q1%20examples%20for%20grading.md), which demonstrate the full range of expected scores.

| Example | Physics | Coding | Reasoning | **Final Grade** | Key issues |
|---|---|---|---|---|---|
| 1 — Perfect | 100 | 100 | 100 | **100** | None — correct formula, correct Euler, all 5 comment aspects |
| 2 — Good | ~75 | 100 | 60 | **~82** | Sign error in `ay` formula; only 3/5 comment aspects |
| 3 — Failing | ~45 | ~40 | 20 | **~38** | Constant acceleration (evaluated only at t=0); wrong distance formula; wrong stopping condition |
| 4 — Very poor | ~45 | ~50 | 0 | **~38** | Wrong physical model (`-ω²x` instead of given formula); wrong Euler order; float equality check that never triggers; no comments |

### Reasoning aspect checklist (for Q1)

| Aspect | What to look for in the comments |
|---|---|
| 1. Physical assumptions | Mentions units of A (m/s) and ω (rad/s), or notes values are arbitrary |
| 2. Forces and interactions | References Newton's second law, F=ma, or explains what the acceleration represents |
| 3. Mathematical model | Writes out or references the ax / ay equations |
| 4. Numerical method | Names "Forward Euler" and/or explains the v and x update rules |
| 5. Stopping condition | Explains that vy=0 means tangent parallel to x-axis; describes the sign-change detection |

> Full annotated code for all four examples is in [`Q1 examples for grading.md`](Q1%20examples%20for%20grading.md).

---

## Physics Deduction Reference

| Error | Points deducted from Physics |
|---|---|
| Completely wrong physical model | 30 – 40 |
| Key formula incorrect | 20 – 30 |
| Required physical effect missing | 10 – 20 |
| Wrong physical constant | 8 – 15 |
| Unit handling error | 5 – 12 |
| Minor approximation with small effect | 2 – 8 |

## Coding Deduction Reference

| Error | Points deducted from Coding |
|---|---|
| Code produces numerically wrong results | 25 – 35 |
| Wrong numerical method causing significant error | 15 – 25 |
| Step size or loop bounds cause significant numerical error | 8 – 18 |
| Off-by-one or incorrect loop ranges | 5 – 12 |

> Style, variable naming, data structure choice, and step size choice **never** cause coding deductions.

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AUTH_SECRET` | Random secret for NextAuth JWT signing |
| `AUTH_RESEND_KEY` | Resend API key for magic-code emails |
| `NEXTAUTH_URL` | Full URL of the app (e.g. `http://localhost:3000`) |
| `OLLAMA_BASE_URL` | Ollama API base URL — use `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Model name (e.g. `qwen2.5:14b`) |
| `PYTHON_CMD` | Python binary name — `python` on Windows, `python3` on Linux/Mac |
