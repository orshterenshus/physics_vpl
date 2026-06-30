# Quick Start — Docker

The shortest path to a running app with Docker Compose — no Node, Python, MongoDB, or Ollama install needed. For full explanations of every step (choosing a model, GPU setup, recovery if locked out, troubleshooting), see [`DOCKER.md`](DOCKER.md).

> Prefer to run it directly with Node? See [`QUICKSTART.md`](QUICKSTART.md) instead.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## Steps

```bash
git clone https://github.com/orshterenshus/physics_vpl.git
cd physics_vpl
cp .env.example .env
```

Open `.env` and set `AUTH_SECRET` to any long random string (no `openssl` required — see `DOCKER.md` for a PowerShell one-liner, or just type one yourself). Leave `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`OLLAMA_MODEL` as their defaults for now.

```bash
docker compose up -d --build
```

First run takes a while — it builds the app image and downloads the LLM model (a few GB). Watch progress with:

```bash
docker compose logs -f ollama-pull
```

Once it's done, the example problems and the first admin account (`admin`/`admin`) are already created automatically — nothing else to run.

Open [http://localhost:3000/login](http://localhost:3000/login), click **"Admin? Sign in with email & password,"** sign in with `admin`/`admin`, and set a real password when prompted.

You're running. Create student/teacher accounts from `/admin`, and see [`DOCKER.md`](DOCKER.md) for everything else.
