# Turnout

Turnout is a corporate volunteerism portal — multi-tenant SaaS built with Next.js, Postgres, and Clerk. This README covers getting a local dev environment running on Windows, Mac, or Linux.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Clone & Install](#clone--install)
- [Local Postgres](#local-postgres)
- [Environment Files](#environment-files)
- [Migrations & Seeding](#migrations--seeding)
- [Running the App](#running-the-app)
- [First Login (Getting a Working Admin Session)](#first-login-getting-a-working-admin-session)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)

## Prerequisites

You'll need:

- **Git**
- **Node.js** — version pinned in `.nvmrc` (currently `24`, matching `package.json`'s `engines.node`). Managed via **nvm** (nvm-windows on Windows, standard nvm on Mac/Linux) — never install Node standalone, always `nvm use` so it stays in sync with the pin.
- **pnpm** — via Corepack (bundled with Node), not a standalone install. Version is pinned via `packageManager` in `package.json`; `corepack enable` will pick it up automatically.
- **Docker Desktop** — for local Postgres (WSL2 backend required on Windows)

### Mac/Linux

```bash
# nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

nvm install   # reads .nvmrc
nvm use       # reads .nvmrc

corepack enable   # reads packageManager from package.json
```

Install Docker Desktop for Mac, or Docker Engine directly on Linux.

### Windows

Two options — recommend WSL2 since Docker Desktop requires it anyway:

- **Recommended:** Install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) + a Linux distro (Ubuntu), then follow the Mac/Linux steps above *inside* WSL2.
- **Alternative (native):** [nvm-windows](https://github.com/coreybutler/nvm-windows) instead of nvm — note nvm-windows doesn't read `.nvmrc` automatically, so run `nvm install 24` and `nvm use 24` explicitly. Then `corepack enable` in PowerShell.

```powershell
nvm install 24
nvm use 24
corepack enable
```

Install Docker Desktop for Windows with the WSL2 backend enabled.

## Clone & Install

```bash
git clone https://github.com/mwroberts78/turnout.git
cd turnout

nvm use          # or `nvm install 24 && nvm use 24` on Windows (nvm-windows)
corepack enable
pnpm install
```

This step is identical on Windows and Mac/Linux (run it inside WSL2 or PowerShell) — the only OS-specific difference is the `nvm` invocation, already covered in Prerequisites.

## Local Postgres

Postgres runs in Docker, on port `5433` (not the default `5432`, to avoid clashing with a native Postgres install).

```bash
docker compose up -d
```

This starts a single Postgres 17 container (`turnout-postgres`) and creates two databases:
- `turnout_dev` — your main local dev database, owned by the `turnout` superuser role (credentials in `docker-compose.yml`)
- `turnout_test` — created automatically by `docker/init-db.sh` on first boot, used by the test suite

**Important:** the `turnout` role from `docker-compose.yml` is a superuser used only for running migrations. The app itself connects as a separate `authenticated` Postgres role with restricted, RLS-scoped privileges — but that role doesn't exist yet at this point. It gets created by a migration (see the next section), so **you must run migrations before `pnpm dev` will be able to connect.**

Command is identical on Windows (WSL2) and Mac/Linux — `docker compose` behaves the same everywhere once Docker Desktop is running. On Windows, just make sure Docker Desktop's WSL2 integration is enabled for your distro, or `docker compose` won't be found inside WSL2.

To reset the local database entirely: `docker compose down -v` (drops the volume, next `up -d` starts clean).

## Environment Files

There are three separate env files, each for a different context. The reason there are three (not one) is that `db/index.ts` imports the shared `env.ts` validator, which checks *every* declared var (Clerk, Resend, Blob, PostHog, etc.) at import time — even for scripts that only touch the database. So which file you use depends on what you're running, not just which database you're pointing at.

Copy `.env.example` as a starting point for each.

### `.env.local` — used by `pnpm dev`

Connects to Postgres as the restricted `authenticated` role (RLS-enforced) plus a `webhook_service` role for the Clerk webhook route. Needs the full set of secrets since the running app actually uses all of them:
- Clerk keys — from your Clerk dashboard (create a dev instance/application)
- `PLATFORM_ADMIN_ORG_ID` — the Clerk Organization ID standing in for "Turnout Internal" (platform admins). Ask a maintainer, or create your own org in your dev Clerk instance and use its ID.
- `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, PostHog keys — from their respective dashboards

### `.env.local.migrate` — used by all `db:*` scripts (not `:test`/`:prod`)

Same secrets as `.env.local` (required only because of the shared validator above, not because migrations/seeds actually use them), but `DATABASE_URL` connects as the `turnout` superuser instead — needed because migrations create roles and grant permissions, which the restricted `authenticated` role can't do.

### `.env.test` — used by the test suite and `db:*:test` scripts

Connects as `turnout` against the separate `turnout_test` database. Sets `SKIP_ENV_VALIDATION=true`, which short-circuits the validator entirely — so this file only needs `DATABASE_URL`, `WEBHOOK_SERVICE_DATABASE_URL`, and `PLATFORM_ADMIN_ORG_ID`, none of the third-party keys.

### `.env.neon.production`

Only used for manually running migrations against Neon from a local machine (`db:*:prod` scripts) — never used by the deployed app itself, which gets its own env vars from the Vercel dashboard.

No OS-specific differences here — env files work identically on Windows and Mac/Linux.

## Migrations & Seeding

Migrations must run before `pnpm dev` will work — this is what creates the `authenticated` and `webhook_service` Postgres roles and their RLS grants (see Environment Files above):

```bash
pnpm db:migrate
```

Optional fixture data — useful for Drizzle Studio browsing and as test data, **not for logging in as that user** (see First Login below for why):

```bash
pnpm db:seed                              # creates a sample tenant + a couple of users
pnpm db:seed:opportunities -- <tenantId>  # adds sample opportunities to a tenant
```

`db:seed:opportunities` takes a tenant ID as an argument rather than creating its own. Use **your own real tenant's ID** (see [First Login](#first-login-getting-a-working-admin-session) for how to get one) — `db:seed`'s tenant uses a fake Clerk org ID disconnected from any real account, so seeding opportunities onto it won't help you click through the app as a logged-in user. Note the `--` before the argument; that's required for pnpm to forward it through to the script rather than treating it as a pnpm flag.

The test database needs its own migration, though you rarely need to run this by hand — `pnpm test` does it automatically before every run:

```bash
pnpm db:migrate:test
pnpm db:seed:test
```

To browse or edit data directly, `pnpm db:studio` opens Drizzle Studio in the browser (against `.env.local.migrate`, i.e. the dev database).

No OS-specific differences — identical everywhere.

## Running the App

```bash
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000). No OS-specific differences.

This gets the server running, but you won't have a usable session yet — Clerk auth itself will work, but the app won't recognize you as a tenant member until the webhook chain described next has run. Continue to First Login.

## First Login (Getting a Working Admin Session)

Signing in through Clerk alone isn't enough — the app only recognizes you as a tenant member once Clerk's `organization.created` and `organizationMembership.created` webhooks have fired and created matching `tenants`/`users` rows. Until then, the app returns a `pending-sync` status and won't render anything tenant-scoped, even with a valid Clerk session.

**Set this up before creating your Clerk Organization, not after** — these webhooks only fire once, at creation time:

1. Get a public URL pointing at your local `pnpm dev` server. The `pnpm tunnel` script (`cloudflared tunnel run turnout-dev`) does this via a named Cloudflare Tunnel, but that tunnel is tied to a specific Cloudflare account/tunnel name that isn't part of this repo. Either:
   - get added to the existing tunnel, or
   - create your own: `cloudflared tunnel login`, `cloudflared tunnel create <name>`, point its config at `localhost:3000`.

2. In the Clerk dashboard, set your webhook endpoint to `https://<your-tunnel-hostname>/api/webhooks/clerk`, subscribed to at least `organization.created` and `organizationMembership.created`.

3. With `pnpm dev` and your tunnel both running, sign up for a new account through the app's real UI, then create a Clerk Organization. Clerk automatically makes its creator `org:admin`, which the webhook maps to this app's `admin` role — so this one flow gives you both a `tenants` row and an `admin`-role `users` row.

4. Reload the app — you should land as an active admin rather than stuck on a pending/sync screen. You can confirm the rows directly via `pnpm db:studio`.

Once you have a real tenant, grab its `id` from `pnpm db:studio` and pass it to `pnpm db:seed:opportunities -- <tenantId>` (see [Migrations & Seeding](#migrations--seeding)) to populate sample opportunities you can actually click through.

**This is not the same as `pnpm db:seed`** — that script's tenant/user rows use fake Clerk IDs disconnected from any real account. Fine for Drizzle Studio browsing or as test fixtures, but you can't log in as that seeded user.

**`PLATFORM_ADMIN_ORG_ID` is a separate mechanism** — it bypasses the `tenants`/`users` tables entirely and only applies to accounts belonging to the specific "Turnout Internal" Clerk org referenced by that env var. It's not something a new contributor gets from seeding or a normal sign-up.

No OS-specific differences — this flow is identical on Windows and Mac/Linux.

## Tests

```bash
pnpm test
```

Runs pending migrations against `turnout_test` first, then the full suite once (`vitest run`). Tests load `.env.test` directly (via `vitest.config.ts`), independent of the `dotenv-cli` wrapper used elsewhere.

```bash
pnpm test:watch      # watch mode — does NOT auto-migrate, run `pnpm db:migrate:test` first if you have pending schema changes
pnpm test:coverage   # coverage report (v8), written to ./coverage as text + HTML
```

No OS-specific differences.

## Troubleshooting

**`permission denied for table ...` errors from Postgres** — migrations haven't been run yet, or you're pointing at the wrong env file/role. The app (`.env.local`) connects as the restricted `authenticated` role; only migrations (`.env.local.migrate`, `turnout` role) can create tables/roles/grants. Run `pnpm db:migrate` first.

**Stuck on a pending/sync screen after signing up** — the Clerk webhooks never reached your app. Confirm your tunnel is running and the webhook endpoint in the Clerk dashboard matches its current public URL — see [First Login](#first-login-getting-a-working-admin-session).

**Port `5433` already in use** — another Postgres instance (local install or a leftover container) is bound to it. Check with `docker ps` / `lsof -i :5433` (Mac/Linux) or `netstat -ano | findstr :5433` (Windows), or change the host port in `docker-compose.yml`.

**`[ERR_PNPM_IGNORED_BUILDS]` on `pnpm install`** — a package needs its native build script approved. Add it to the `allowBuilds` map in `pnpm-workspace.yaml` and re-run install; if it's a new package, commit that change too, or the same failure will hit Vercel's build.

**`docker compose` / `docker` not found inside WSL2** — Docker Desktop's WSL2 integration isn't enabled for your distro. In Docker Desktop: Settings → Resources → WSL Integration → enable your distro.

**CRLF / line-ending diff noise on Windows** — this repo has no `.gitattributes` pinning line endings. Set `git config --global core.autocrlf input` (or `true` if you're not in WSL2) before cloning to avoid Biome/format complaints caused by CRLF conversion.

**pnpm resolves to the wrong version** — make sure Corepack is enabled (`corepack enable`) *after* `nvm use`; Corepack reads the `packageManager` field in `package.json` and won't override a pnpm that's already been separately installed on your PATH.
