# Running Physics VPL with Docker Compose

This is the "send it to someone and they run one command" path. It bundles **everything** — the Next.js app, Python + NumPy, MongoDB, and Ollama itself — into containers, so the only thing a recipient needs pre-installed is [Docker Desktop](https://www.docker.com/products/docker-desktop/). No Node, no Python, no MongoDB Atlas account, no manually installing Ollama.

The one thing this **can't** fully paper over is the LLM model choice: different machines can realistically run different model sizes (a 14B-parameter model needs a strong GPU to be fast; a 3B model runs tolerably on CPU alone). That's handled with one environment variable, explained below — not a rebuild.

## Where to run these commands

Every command on this page (`docker compose up`, `docker compose logs ...`, etc.) goes in a **regular terminal on your own machine** — PowerShell, Command Prompt, or Git Bash on Windows, Terminal on macOS/Linux. Open it and `cd` into the folder where you cloned the project first.

This isn't a one-time thing — **every single `docker compose ...` command on this page must be executed while your terminal's current directory is that project folder** (the one containing `docker-compose.yml`), not just the first one. If you open a new terminal window/tab later, or `cd` somewhere else in between, `cd` back into the project folder before running the next `docker compose` command — otherwise it won't find `docker-compose.yml` and will either fail outright or (if you have other compose projects) target the wrong one entirely.

This is **not** the same as the terminal *inside* Docker Desktop's UI (the `>_` "Exec" button you get by clicking on a running container). That one opens a shell *inside one specific container* — useful for poking around inside it directly (e.g. running `mongosh` by hand), but `docker compose` itself isn't installed inside any container; it's a tool on your host machine that starts and orchestrates all of them from outside. Don't run the commands below in that container Exec terminal — they won't work there.

## Quick start

```bash
git clone https://github.com/orshterenshus/physics_vpl.git
cd physics_vpl
cp .env.example .env
```

Open `.env` and set `AUTH_SECRET` to a random string (e.g. run `openssl rand -base64 32` and paste the result in). Leave `ADMIN_EMAIL`/`ADMIN_PASSWORD` as the default `admin`/`admin` — you'll be forced to replace it with a real password the first time you actually log in, so there's no need to pick one now (see below). Leave `OLLAMA_MODEL` as the default too unless you know your machine has a strong GPU (see [Choosing a model](#choosing-a-model) below).

```bash
docker compose up -d --build
```

First run will take a while — it builds the app image, downloads the `mongo` and `ollama` base images, and downloads the model itself (a few GB). Watch progress with:

```bash
docker compose logs -f ollama-pull
```

The example problems (Particle Trajectory, Bouncing Ball, etc.) are inserted automatically by the `seed` service, and a first admin account is created automatically by the `bootstrap-admin` service — neither needs a manual command. Its sign-in details come straight from `.env`: `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Confirm it worked with:

```bash
docker compose logs bootstrap-admin
```

which prints something like:

```
========================================================
First admin account created: Admin <admin>
Sign in at http://localhost:3000/login using "Admin? Sign in
with email & password" with that email and the ADMIN_PASSWORD
you set in .env. You'll be asked to set a new password the
first time you log in.
========================================================
```

This account is **admin** (the highest of the three roles — `student` / `teacher` / `admin`), not "teacher." Admin includes every teacher capability (creating/editing problems, viewing all submissions) plus user management, so you can do everything a teacher can right away, and also create teacher, student, and additional admin accounts from the `/admin` page.

Open [http://localhost:3000/login](http://localhost:3000/login), click "Admin? Sign in with email & password," and sign in with `admin` / `admin` (or whatever you set `ADMIN_EMAIL`/`ADMIN_PASSWORD` to). The username field accepts a plain word like `admin`, not just real email addresses. The moment you sign in, every page redirects you to set a real password (8+ characters) before you can do anything else — the original `admin`/`admin` stops working as soon as you save the new one. After that, log in with the new password as many times as you want; unlike student/teacher login codes, it doesn't expire on use. Change it again any time from the Users page ("Set new password"), including for your own account.

If you ever re-run `docker compose up` after an admin already exists, `bootstrap-admin`'s logs will just say so and exit — it won't create a second account or touch the existing one (see [Locked out?](#locked-out) if you need to reset a password instead).

## What's actually running

`docker compose up` starts containers on a private network Compose creates automatically, where each one can reach the others by service name:

| Service | What it is | Reachable at |
|---|---|---|
| `app` | This repo, built from the `Dockerfile` (Next.js + a Python3/NumPy runtime for grading code execution) | `http://localhost:3000` from your browser |
| `mongo` | Official `mongo:7` image | `mongo:27017` from inside the network; also `localhost:27017` from your host (bound to `127.0.0.1` only) so you can inspect it with `mongosh`/Compass if you want |
| `ollama` | Official `ollama/ollama` image — the actual LLM inference server | `http://localhost:11434` (exposed mainly so you can run `ollama` CLI commands against it directly if you want) |
| `ollama-pull` | One-shot — runs once, downloads the model named in `OLLAMA_MODEL`, then exits | — |
| `seed` | One-shot — runs once, inserts the example problems, then exits. Safe to re-run (it clears those chapters first, so it never duplicates) | — |
| `bootstrap-admin` | One-shot — waits for `app` to be healthy, then creates the first admin account from `ADMIN_NAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` | — |

Two named volumes (`mongo_data`, `ollama_data`) persist the database and the downloaded model(s) across restarts, so you only download the model once.

There's no Mongo username/password configured — `mongo` isn't reachable from anywhere except this machine and the other containers, so for a local single-user setup like this, authentication adds little real protection. If you ever deploy this somewhere more exposed than your own machine, add one.

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

# Look up every user's role and (for students/teachers) current login code:
docker compose exec mongo mongosh physics-lab --quiet --eval \
  'db.users.find({}, {name:1, email:1, role:1, loginCode:1}).forEach(u => print(JSON.stringify(u)))'
```

## Locked out?

Recall: students/teachers use a one-time **code**; admins use an **email + password** that doesn't expire on use (deliberately — an admin locked out with nobody else around to issue them a fresh code would otherwise have no way back in at all). What "locked out" means — and the fix — differs depending on which one got stuck.

### A student/teacher's code was already used (and no admin is around to issue a new one)

Their `loginCode` is `null` in the database the instant they log in once. Normally an admin would click "New code" for them on the Users page — but if nobody can currently log in to do that, set one directly:

```bash
docker compose exec mongo mongosh physics-lab --quiet --eval \
  "db.users.updateOne({email: 'the-locked-out-user@example.com'}, {\$set: {loginCode: 'NEWCODE1'}})"
```

Replace the email, and `NEWCODE1` with anything you want (it's uppercased automatically on login regardless of case). Then log in with it at `/login` like normal.

### An admin can't log in (forgot the password, or it was never set correctly)

A password can't be reset with a plain `mongosh $set` the way a code can — it's stored as a bcrypt hash, not the plaintext, so there's no "just set the field to something" shortcut. Use the dedicated reset script instead, which reuses the same image `bootstrap-admin` is already built from:

```bash
docker compose run --rm bootstrap-admin node scripts/docker-reset-admin-password.mjs you@example.com a-new-password
```

This works even if `bootstrap-admin` already ran and exited earlier — `docker compose run` starts a fresh one-off container from that service's image regardless. If you're not sure of the email, look it up first with the command above (`role: "admin"` rows). Like every other way of setting an admin's password, this also forces a password change on next login — you'll land on `/change-password` immediately after signing in with the password you just set here, and need to replace it before doing anything else.

### Nobody — not even one user — exists at all

This shouldn't normally happen once `bootstrap-admin` has run successfully once, but if the database was wiped (`docker compose down -v`) without a subsequent `docker compose up`, just bring the stack up again — `bootstrap-admin` creates the first admin automatically from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `app` container keeps restarting, logs show a Mongo connection error | `mongo` hasn't finished its healthcheck yet — Compose's `depends_on: condition: service_healthy` should already wait for this, but on a very slow first boot give it another minute and check `docker compose ps` |
| Grading never finishes / `ollama-pull` logs show download stuck | Slow internet — the model is several GB. Check progress with `docker compose logs -f ollama-pull` |
| `docker compose up` fails immediately with an API/pipe connection error | Docker Desktop itself isn't running yet — start it and wait for it to fully launch before retrying |
| Grading is extremely slow (a minute or more per submission) | Expected on CPU-only inference with no GPU passthrough configured, especially with the 14B model. Switch to `qwen2.5:3b`, or set up GPU passthrough — see above. The submit page polls for up to 5 minutes and shows a "still working" message past 60 seconds, so this no longer looks stuck at "Pending..." the way it used to — if you're still on an older build where it does, pull the latest. |
