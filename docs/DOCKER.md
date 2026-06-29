# Running Physics VPL with Docker — A No-Coding-Experience Guide

This guide assumes you've never used a terminal, never written code, and don't know what "Docker" means. By the end, you'll have the whole app running on your computer, reachable in your web browser at `http://localhost:3000`.

If you already know what Docker, terminals, and environment variables are, you can skim — but every term here is explained the first time it's used, on purpose, so don't worry if something sounds obvious.

## What you're actually installing

This project ("Physics VPL") is a website where students solve physics problems by writing Python code, and a program grades them automatically using a local AI model. Normally, getting this running would mean installing five or six separate pieces of software yourself (a JavaScript runtime, a database, an AI model server, etc.) and making sure they all talk to each other correctly.

**Docker** avoids all of that. Think of it like a shipping container (that's literally where the name comes from): instead of installing each piece of software directly onto your computer, each piece runs inside its own sealed "container" — a self-contained little package that already has everything it needs inside it. Your computer just needs one program, **Docker Desktop**, that knows how to run these containers. You never install Python, databases, or anything else by hand.

## What you need before starting

Just one thing: **Docker Desktop**.

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) in your web browser.
2. Download the version for your operating system (Windows, Mac, or Linux) and run the installer like you would for any other program.
3. Once it's installed, open it (you'll see a whale icon). Leave it running in the background — you'll need it open the whole time you're using this app. The first time you open it, it might take a minute or two to fully start; you'll know it's ready when the whale icon in your system tray/menu bar stops animating or the Docker Desktop window shows "Engine running" somewhere.

That's the only software you need to install yourself.

## A few words you'll see below, explained once

- **Terminal**: a plain text window where you type commands and press Enter, instead of clicking icons. On Windows, the easiest one to use is **PowerShell**. To open it: click the Start menu, type `PowerShell`, and click the result called "Windows PowerShell." A black or blue window with text will open — that's it, that's the terminal.
- **Command**: a line of text you type into the terminal and press Enter to run. Every gray code box below is something you're meant to type (or copy and paste) into that terminal window.
- **Folder / directory**: same thing, just two names for it — a place on your computer where files are stored. "The project folder" means wherever you save this project's files.
- **`cd`**: short for "change directory." It's the command you use to tell the terminal which folder to work in. You'll use it once near the start.
- **Settings file (`.env`)**: a small plain-text file that holds a handful of values the program reads when it starts — things like "what should the admin's password be." You'll edit this once before starting anything. More on this below.

## Step 1 — Get the project's files onto your computer

If you have the project folder already (someone gave it to you, or you downloaded it as a ZIP and extracted it), skip to Step 2.

Otherwise, open a terminal (see above) and run:

```bash
git clone https://github.com/orshterenshus/physics_vpl.git
```

This copies the whole project onto your computer into a new folder named `physics_vpl`, created wherever your terminal currently is (usually your user folder, e.g. `C:\Users\YourName\physics_vpl`).

> If you don't have `git` installed and don't want to install it, you can instead go to the project's GitHub page in your browser, click the green "Code" button, choose "Download ZIP," and extract the ZIP file anywhere on your computer. Either way gets you the same files.

## Step 2 — Tell the terminal where the project folder is

Every command in this guide needs to be run **while the terminal is "inside" the project folder**. Right after cloning/extracting, type:

```bash
cd physics_vpl
```

(If you downloaded a ZIP and extracted it somewhere specific, use the actual path instead, e.g. `cd C:\Users\YourName\Downloads\physics_vpl`.)

**Important:** if you close the terminal and open a new one later, you'll need to run this `cd` command again before running any other command in this guide. The terminal doesn't remember where you were last time.

## Step 3 — Create your settings file

The project comes with a template settings file called `.env.example`. You need to make your own copy of it named `.env` (just `.env`, nothing else) — this copy is where your personal settings go, and it's never shared or uploaded anywhere.

```bash
cp .env.example .env
```

Now open the new `.env` file in any plain text editor (Notepad works fine — right-click the file in your project folder and choose "Open with" → Notepad, or just open it from inside VS Code if you have that).

Here's exactly what's in it and what each line means:

```env
AUTH_SECRET=

OLLAMA_MODEL=qwen2.5:3b

NEXTAUTH_URL=http://localhost:3000

ADMIN_NAME=Admin
ADMIN_EMAIL=admin
ADMIN_PASSWORD=admin
```

**`AUTH_SECRET=`** — leave nothing here and the app won't start; it needs *some* long random text on this line. This value is used internally to keep login sessions secure — you'll never need to type it or remember it, it just needs to exist. The easiest way to fill it in:
- If you have a terminal handy, run `openssl rand -base64 32` and paste whatever it prints after the `=` sign.
- If that command doesn't exist on your computer, you can instead just mash your keyboard for 40-ish random characters (letters, numbers, symbols) — anything long and random works. For example: `AUTH_SECRET=kJ8x!mQ2pL9vR4tY7wZ3nB6cF1hD5sA0gE`

**`OLLAMA_MODEL=qwen2.5:3b`** — this picks which AI model grades the students' work. Leave it exactly as `qwen2.5:3b` unless you know your computer has a powerful graphics card (GPU). This default works on basically any computer, including ones with no dedicated graphics card at all — it'll just take a bit longer per submission. (See [Picking a different AI model](#picking-a-different-ai-model-optional) below if you do have a strong GPU and want better grading quality.)

**`NEXTAUTH_URL=http://localhost:3000`** — leave this exactly as-is. It just tells the app what its own web address is. ("localhost" means "this same computer.")

**`ADMIN_NAME=Admin`**, **`ADMIN_EMAIL=admin`**, **`ADMIN_PASSWORD=admin`** — these create your first teacher/administrator login automatically. Leave all three exactly as they are — yes, even though `admin`/`admin` looks like a weak password, it's safe here on purpose: the very first time you actually log in with it, the app will force you to immediately replace it with a real password before letting you do anything else. There's no benefit to picking something now.

Save the file and close your text editor.

## Step 4 — Start everything

Back in your terminal (making sure you've `cd`'d into the project folder — see Step 2 if you opened a new terminal window), run:

```bash
docker compose up -d --build
```

What this does, in plain terms: Docker reads the project's instructions and builds/downloads everything it needs — the website itself, the database, and the AI model server — then starts them all running in the background. You'll see a lot of text scroll by; that's normal.

**This first run takes a while** — anywhere from a few minutes to 15+ minutes depending on your internet speed, because it needs to download the AI model (a few gigabytes). Subsequent starts are much faster since everything's already downloaded.

To watch the AI model's download progress specifically:

```bash
docker compose logs -f ollama-pull
```

(This will keep printing updates. When it's done, press `Ctrl+C` to stop watching — that doesn't stop the actual program, just this progress display.)

## Step 5 — Check that your admin account was created

Run:

```bash
docker compose logs bootstrap-admin
```

You should see something like:

```
========================================================
First admin account created: Admin <admin>
Sign in at http://localhost:3000/login using "Admin? Sign in
with email & password" with that email and the ADMIN_PASSWORD
you set in .env. You'll be asked to set a new password the
first time you log in.
========================================================
```

If you see that, you're ready for the next step. If instead it says something about "Setup already completed," that's also fine — it just means this step already ran successfully before (e.g. you restarted the app).

## Step 6 — Open the app and log in

Open your web browser and go to:

```
http://localhost:3000
```

You'll land on a login page. Click the small link that says **"Admin? Sign in with email & password."** Type:

- Email/username: `admin`
- Password: `admin`

(Or whatever you set `ADMIN_EMAIL`/`ADMIN_PASSWORD` to in Step 3, if you changed them.)

The moment you sign in, the app will immediately ask you to set a real password — type one (at least 8 characters) and confirm it. From that point on, `admin`/`admin` stops working entirely, and you log in with your new password instead, for as long as you want, as many times as you want.

**You're done.** You're now signed in as an admin, which means you can create accounts for your students and teachers, create problems, and review submissions.

## Stopping and restarting later

When you're done for the day, you can leave it running, or stop it:

```bash
docker compose down
```

This stops everything but keeps all your data (accounts, problems, submissions) saved. Next time you want to use the app again, just run:

```bash
docker compose up -d
```

(No `--build` needed this time — that's only for the very first start, or after the project's code itself changes.)

---

## Everything below this line is for people who want more detail

The rest of this document goes deeper into how things work, for anyone curious or for fixing problems that go beyond "it's not starting." You don't need to read any of it to use the app day to day.

### Where exactly to type these commands

Every command in this guide goes in a **regular terminal on your own computer** — PowerShell, Command Prompt, or Git Bash on Windows; Terminal on macOS/Linux. This is different from the small terminal-like window *inside* the Docker Desktop app itself (the one you get by clicking a running container and then an "Exec" button) — that one is for looking inside one specific container, and the commands on this page won't work there.

### What's actually running

`docker compose up` starts several containers that can all talk to each other:

| Container | What it is |
|---|---|
| `app` | The website itself (reachable at `http://localhost:3000` in your browser) |
| `mongo` | The database that stores accounts, problems, and submissions |
| `ollama` | The AI model server that grades submissions |
| `ollama-pull` | Runs once at startup to download the AI model, then stops itself |
| `seed` | Runs once at startup to add the example physics problems, then stops itself |
| `bootstrap-admin` | Runs once at startup to create your first admin account from the `.env` file, then stops itself |

Two of these (`mongo` and `ollama`) keep their data saved on your computer even if you stop everything, so you don't lose your database or have to re-download the AI model.

### Picking a different AI model (optional)

| Your computer | Set `OLLAMA_MODEL` in `.env` to | Notes |
|---|---|---|
| No dedicated graphics card, or not sure | `qwen2.5:3b` (the default — leave it as-is) | Works everywhere, grading just takes a little longer per submission |
| A mid-range graphics card (8GB+ of video memory) | `qwen2.5:7b` | Better grading quality than the 3B model, without needing a top-tier graphics card |
| A strong graphics card (16GB+ of video memory) | `qwen2.5:14b` | The best grading quality, but needs real GPU power to run at a reasonable speed |

To switch models on a setup that's already running: edit the `OLLAMA_MODEL` line in `.env`, save the file, then run `docker compose up -d` again. You don't need to rebuild anything or repeat the earlier steps — it'll just download the new model and start using it.

#### Using your graphics card (NVIDIA only)

By default, the AI model runs using your computer's processor (CPU) rather than its graphics card, which is slower but guaranteed to work on any machine. If you have an NVIDIA graphics card and want faster grading:

1. Install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).
2. Open `docker-compose.yml` in a text editor, find the lines starting with `#` under the `ollama` section that mention `nvidia`, and remove the `#` from the start of each of those lines (this is called "uncommenting" them).
3. Run `docker compose up -d` again.

There's no equivalent for AMD graphics cards or Apple computers today — those always use the CPU.

### Common commands, explained

```bash
docker compose ps              # shows what's currently running
docker compose logs -f app      # shows the website's own activity log, updating live
docker compose down             # stops everything (your data is kept safe)
docker compose down -v          # stops everything AND erases the database + downloaded AI model — only use this if you genuinely want to start completely fresh
```

### If you ever get locked out of every account

This shouldn't normally happen, but here's the fix for each scenario:

**A student or teacher's one-time code was already used, and no admin can log in to give them a new one.** Run this, replacing the email and making up any code you like:

```bash
docker compose exec mongo mongosh physics-lab --quiet --eval \
  "db.users.updateOne({email: 'the-persons-email@example.com'}, {\$set: {loginCode: 'NEWCODE1'}})"
```

Then that person can log in with `NEWCODE1` (or whatever you chose) at the login page.

**Every admin account is locked out and nobody can sign in at all.** Run this, replacing the email and choosing a new password:

```bash
docker compose run --rm bootstrap-admin node scripts/docker-reset-admin-password.mjs you@example.com a-new-password
```

You'll be asked to set yet another new password the moment you actually log in with it — that's expected, same as the very first `admin`/`admin` login.

### If something doesn't work

| What you're seeing | What's likely going on |
|---|---|
| The website won't load at `http://localhost:3000` at all | Give it another minute — the database might still be starting up. Check `docker compose ps` to see if everything says "healthy" |
| Grading a submission takes a long time, or the page says it's "still working" | Normal on computers without a strong graphics card. It can take a minute or more — the page will keep checking and update itself when it's done, you don't need to refresh |
| `docker compose up` fails immediately with an error about a connection or a pipe | Docker Desktop itself isn't fully started yet — open it, wait for the whale icon to settle, then try again |
| The AI model download seems stuck | Check your internet connection — the model is a few gigabytes, so a slow connection will just take longer. Watch progress with `docker compose logs -f ollama-pull` |
