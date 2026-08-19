-- Custom SQL migration file, put your code below! --
-- webhook_service is used exclusively by Clerk webhook processing code.
-- Webhooks are Svix-signature-verified system events, not tenant-scoped user
-- requests — they often need to look up a tenant/user before any tenant
-- context can be known, which the tenant-scoped `authenticated` RLS policies
-- structurally cannot support. This role bypasses RLS entirely; tenant
-- isolation for this code path is enforced by explicit WHERE clauses in the
-- application code instead of by Postgres. Password is set out-of-band, not
-- committed here.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'webhook_service') THEN
    CREATE ROLE webhook_service WITH LOGIN BYPASSRLS;
  END IF;
END
$$;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON tenants TO webhook_service;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON users TO webhook_service;
