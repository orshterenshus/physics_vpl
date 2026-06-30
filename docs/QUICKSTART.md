# Quick Start — Manual Setup (no Docker)

The shortest path to a running app without Docker. For full explanations of every step, see [`README.md`](../README.md) and [`GUIDE.md`](GUIDE.md).

> Prefer one command and nothing else to install? See [`DOCKER.md`](DOCKER.md) instead.

## Prerequisites

- Node.js 20.9+
- Python 3.9+ with NumPy (`python -m pip install numpy`)
- [Ollama](https://ollama.com) running locally, with a model pulled (e.g. `ollama pull qwen2.5:14b`)
- A MongoDB connection string (MongoDB Atlas free tier works)

## Steps

```bash
git clone https://github.com/orshterenshus/physics_vpl.git
cd physics_vpl
npm install
```

Copy the template and fill in your own values:

```bash
cp .env.local.example .env.local
```

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
AUTH_SECRET=<any-random-secret-string>
NEXTAUTH_URL=http://localhost:3000
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:14b
PYTHON_CMD=python
```

`AUTH_SECRET` just needs to be long and random — type it yourself, or generate one (no `openssl` required, see README for a PowerShell one-liner).

```bash
npm run dev
```

In a separate terminal, create the first admin (defaults to `admin`/`admin`):

```bash
node scripts/bootstrap-admin.mjs
```

Optionally, seed the example problems:

```bash
node scripts/seed.mjs
```

Open [http://localhost:3000/login](http://localhost:3000/login), click **"Admin? Sign in with email & password,"** sign in with `admin`/`admin`, and set a real password when prompted.

You're running. Create student/teacher accounts from `/admin`, and see [`README.md`](../README.md) and [`GUIDE.md`](GUIDE.md) for everything else — features, troubleshooting, and how the code works.
