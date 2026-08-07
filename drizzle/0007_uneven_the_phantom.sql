ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "opportunity_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "meal_provided" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "tshirt_provided" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sign_ups" ALTER COLUMN "wants_meal" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sign_ups" ALTER COLUMN "wants_tshirt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "updated_by" DROP NOT NULL;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "tenants" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("tenants"."id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "tenants" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("tenants"."id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "tenants" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("tenants"."id" = current_setting('app.current_tenant_id')::uuid) WITH CHECK ("tenants"."id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "tenants" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("tenants"."id" = current_setting('app.current_tenant_id')::uuid);