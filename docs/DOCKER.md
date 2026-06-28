# Running Physics VPL with Docker Compose

This is the "send it to someone and they run one command" path. It bundles **everything** — the Next.js app, Python + NumPy, MongoDB, and Ollama itself — into containers, so the only thing a recipient needs pre-installed is [Docker Desktop](https://www.docker.com/products/docker-desktop/). No Node, no Python, no MongoDB Atlas account, no manually installing Ollama.

The one thing this **can't** fully paper over is the LLM model choice: different machines can realistically run different model sizes (a 14B-parameter model needs a strong GPU to be fast; a 3B model runs tolerably on CPU alone). That's handled with one environment variable, explained below — not a rebuild.

## Quick start

```bash
git clone https://github.com/orshterenshus/physics_vpl.git
cd physics_vpl
cp .env.example .env
```

Open `.env` and set `AUTH_SECRET` to a random string (e.g. run `openssl rand -base64 32` and paste the result in). Leave `OLLAMA_MODEL` as the default unless you know your machine has a strong GPU (see [Choosing a model](#choosing-a-model) below).

```bash
docker compose up -d --build
```

First run will take a while — it builds the app image, downloads the `mongo` and `ollama` base images, and downloads the model itself (a few GB). Watch progress with:

```bash
docker compose logs -f ollama-pull
```

Once that finishes, open [http://localhost:3000](http://localhost:3000). You'll land on `/login` — the database is empty, so create the first admin account exactly as in the non-Docker setup:

```bash
curl -X POST http://localhost:3000/api/setup \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Your Name\", \"email\": \"you@example.com\"}"
```

That returns a one-time login code — paste it into the login page and you're in. From there, use the `/admin` page to create every other account.

## What's actually running

`docker compose up` starts four containers on a private network Compose creates automatically, where each one can reach the others by service name:

| Service | What it is | Reachable at |
|---|---|---|
| `app` | This repo, built from the `Dockerfile` (Next.js + a Python3/NumPy runtime for grading code execution) | `http://localhost:3000` from your browser |
| `mongo` | Official `mongo:7` image | `mongo:27017` from inside the network only — not exposed to your host |
| `ollama` | Official `ollama/ollama` image — the actual LLM inference server | `http://localhost:11434` (exposed mainly so you can run `ollama` CLI commands against it directly if you want) |
| `ollama-pull` | Not a long-running service — runs once, downloads the model named in `OLLAMA_MODEL`, then exits | — |

Two named volumes (`mongo_data`, `ollama_data`) persist the database and the downloaded model(s) across restarts, so you only download the model once.

## Choosing a model

| Your machine | Set `OLLAMA_MODEL` to | Notes |
|---|---|---|
| No dedicated GPU / unsure | `qwen2.5:3b` (the default) | Runs on CPU. Grading will take longer per submission than a GPU setup, but it works on essentially any machine. |
| Has a strong NVIDIA GPU (16GB+ VRAM) | `qwen2.5:14b` | Significantly better grading quality. Requires the extra GPU setup below — without it, a 14B model on CPU alone will be very slow. |

To change the model on a machine that's already running: edit `OLLAMA_MODEL` in `.env`, then run `docker compose up -d` again. Compose detects that the `ollama-pull` and `app` services' configuration changed and recreates only those two — it pulls the new model and restarts the app pointed at it. **No `--build` and no image rebuild needed** — the model name is a runtime setting, never baked into any image.

### Enabling GPU acceleration (NVIDIA only)

By default, Ollama runs on CPU inside the container — this is what makes the setup work on literally any machine, with the tradeoff of slower inference. If the host has an NVIDIA GPU:

1. Install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) on the host (on Windows, this means using Docker Desktop with the WSL2 backend, which has GPU passthrough support built in once the toolkit is installed in your WSL2 distro).
2. In `docker-compose.yml`, uncomment the `deploy.resources.reservations.devices` block under the `ollama` service.
3. `docker compose up -d` again.

There's no AMD/Apple Silicon GPU passthrough equivalent for Docker containers today — on those machines, CPU inference (the default) is the only option inside a container, regardless of model size chosen.

## Why `AUTH_TRUST_HOST` is set

You'll notice `docker-compose.yml` sets `AUTH_TRUST_HOST=true` for the `app` service. NextAuth refuses requests from a Host header it doesn't explicitly trust once running in production mode (`next start`, which is what happens inside the container) — this restriction doesn't show up with `npm run dev`, only here. This is documented, expected behavior for a self-hosted single-machine deployment like this one, not a workaround for a bug.

## Common commands

```bash
docker compose ps              # see what's running
docker compose logs -f app      # tail the Next.js app's logs
docker compose down             # stop everything (data is preserved in volumes)
docker compose down -v          # stop everything AND delete the database + downloaded models
```

## Troubleshooting

| Symptom | Cause |
|---|---|
| `app` container keeps restarting, logs show a Mongo connection error | `mongo` hasn't finished its healthcheck yet — Compose's `depends_on: condition: service_healthy` should already wait for this, but on a very slow first boot give it another minute and check `docker compose ps` |
| Grading never finishes / `ollama-pull` logs show download stuck | Slow internet — the model is several GB. Check progress with `docker compose logs -f ollama-pull` |
| `docker compose up` fails immediately with an API/pipe connection error | Docker Desktop itself isn't running yet — start it and wait for it to fully launch before retrying |
| Grading is extremely slow (minutes per submission) | Expected on CPU-only inference with no GPU passthrough configured, especially with the 14B model. Switch to `qwen2.5:3b`, or set up GPU passthrough — see above |
