# Turnout — Project Reference

Corporate volunteerism portal. Multi-tenant SaaS. Master's capstone project, may be extended toward a real product later. Pure volunteerism only — no donation/matching-gift/payment processing in scope.

## Tech Stack

- **Hosting**: Vercel (Next.js, App Router, TypeScript, Turbopack, React Compiler enabled)
- **Database**: Neon (Postgres 18), connected via Neon-managed Vercel integration
- **ORM**: Drizzle ORM + Drizzle Kit
- **Auth**: Clerk (Organizations = tenants)
- **Package manager**: pnpm (via Corepack, nvm-managed Node)
- **Linting/formatting**: Biome (not ESLint/Prettier)
- **UI**: shadcn/ui + Tailwind CSS
- **Error tracking**: Sentry
- **Product analytics**: PostHog
- **Transactional email**: Resend (verified domain, not the shared resend.dev sender)
- **File storage**: Vercel Blob (opportunity images) — not yet wired up
- **Background jobs** (not yet wired up): Inngest, when needed

## Multi-Tenancy & RLS

- Shared schema, `tenant_id` column on every tenant-scoped table.
- Row-Level Security enforced at the Postgres level via Drizzle's `crudPolicy` (imported from `drizzle-orm/neon`), scoped to a Postgres role called `authenticated`.
- Tenant context is set per-request via `SET app.current_tenant_id = '<uuid>'` on the DB session (wiring this into request middleware is a Phase 2 task — not yet built as of this writing).
- The `authenticated` role must be created manually via migration (`CREATE ROLE IF NOT EXISTS` pattern) — it does NOT exist by default on a fresh Neon project or fresh local Postgres. Table grants (`GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated`) must also be explicit per table, in the same migration that creates the table.
- **Never trust a foreign-key ID passed into a server action.** Always re-fetch the referenced row through a normal tenant-scoped query first (RLS will return nothing if it belongs to another tenant), and derive any values (like `tenantId` for a new row) from that fetched object — never from client input directly.
- One special tenant-like entity: a Clerk Organization called "Turnout Internal" represents platform admins (us), identified via a `PLATFORM_ADMIN_ORG_ID` constant. It never gets a row in the `tenants` table and is excluded from normal tenant logic.

## Auth & Membership Model

- Clerk Organizations = tenants (companies). One Clerk Org ↔ one `tenants` row, synced via a `organization.created` webhook.
- Personal Accounts are disabled — every user must belong to an Organization.
- Membership into an org happens two ways, both already gated by Clerk (never build a custom "pick your org" UI):
  - **Verified Domains** — auto-invite or auto-suggest based on matching email domain (for employees with a corporate email)
  - **Manual invitations** — admin invites specific email addresses directly (for employees without a corporate email; the invite itself is the access gate, not domain matching)

## Database Conventions

- `created_by` (not null, references `users`) and `updated_by` (nullable) + `updated_at` (auto-updating via Drizzle's `$onUpdate()`) on tables that are created/edited by an acting admin user (`opportunities`, `meal_options`, `signups`, `projects`) — applied uniformly even where `user_id`/similar already identifies the acting user, for consistency.
- `users.updated_by` (nullable, self-referencing FK to `users.id` — needs `(): AnyPgColumn =>` return type annotation) + `updated_at` tracks who last changed a user's role. Role changes are security-sensitive, so this audit trail matters more here than on most tables.
- `tenants.created_by` is nullable — the creating user's `users` row may not exist yet at the moment the Clerk webhook fires; ordering needs confirming when Phase 2 is built.
- Schema lives in `src/db/schema/` as one file per table, re-exported through `src/db/schema/index.ts`. `drizzle.config.ts` points at the index file.

## Environment & Migration Workflow

- `.env.local` — local dev, points at local Docker Postgres (`turnout_dev` db)
- `.env.test` — local test db (`turnout_test`)
- `.env.neon.production` — Neon production, elevated role, used ONLY for manually running migrations from a local machine (never used by the running app)
- Vercel's actual app `DATABASE_URL` connects as the `authenticated` role (limited privileges) — NOT the same role used for migrations
- Local Postgres runs via Docker on port `5433` (not default `5432`, to avoid conflicting with a native Postgres install)
- `pnpm db:generate` / `pnpm db:migrate` → local. `pnpm db:migrate:prod` → Neon production (manual, deliberate — not yet automated into the Vercel build; see deferred task below)
- `pnpm-workspace.yaml` has an `allowBuilds` map for packages needing native build scripts approved under pnpm 11 (`@sentry/cli`, `esbuild`, `sharp`, etc.) — any new package hitting `[ERR_PNPM_IGNORED_BUILDS]` needs an entry added here and committed, or it'll fail on Vercel too.

## Env Var Validation

- `src/env.ts` uses `@t3-oss/env-nextjs` with a `server`/`client` split. All new env vars should be added here, not just read via raw `process.env`.
- `drizzle.config.ts` is the one exception — it runs outside Next.js's runtime and reads `process.env.DATABASE_URL` directly via `dotenv-cli`, not through `src/env.ts`.

## Deferred / Not Yet Built

- Tenant-context middleware (`SET app.current_tenant_id` per request) — Phase 2
- Automated migrations in the Vercel build pipeline — deliberately deferred until schema stabilizes post Phase 1–2 (Chunk 7.7)
- SSO, billing, SMS — all deliberately out of scope for MVP; designed to be additive later, not blocking current build
- Local/test blob storage strategy for `opportunities.image_url` — Vercel Blob has no local emulator. Resolve in Phase 2, ahead of Phase 3 (opportunity management, where image upload gets built): either a separate dev-scoped Blob store (real network calls, matches prod exactly) or a filesystem-backed adapter swapped in for dev/test. Leaning toward the separate dev store for simplicity.

## Development Plan

Build order is phase-based, each phase ending in an E2E test checkpoint:
1. Core data model (opportunities, signups, role field)
2. Tenant onboarding + platform admin split (Clerk webhook sync, invitation flow)
3. Admin: opportunity management
4. Employee: discovery and signup
5. Personal tracking + basic reporting
6. Projects (multi-opportunity containers)
7. Polish pass

Phases 1–5 are the MVP. Phases 6–7 are stretch goals for the first draft.

## Naming

App name: **Turnout**. Stored as a single `APP_NAME` config constant, not hardcoded throughout the codebase, so it can be renamed easily if needed later.
