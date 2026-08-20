-- Custom SQL migration file, put your code below! --
-- The authenticated role was originally created without LOGIN, meaning it
-- could only ever be reached via `SET LOCAL ROLE` from an already-connected
-- elevated session (which is all local dev/tests ever did). The app's own
-- DATABASE_URL needs to authenticate as this role directly, which requires
-- LOGIN. Password is set out-of-band per environment, not committed here.
ALTER ROLE authenticated WITH LOGIN;
