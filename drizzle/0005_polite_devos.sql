CREATE TABLE "meal_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"meal_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "meal_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "meal_options" ADD CONSTRAINT "meal_options_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_options" ADD CONSTRAINT "meal_options_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_options" ADD CONSTRAINT "meal_options_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_options" ADD CONSTRAINT "meal_options_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "meal_options" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("meal_options"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "meal_options" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("meal_options"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "meal_options" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("meal_options"."tenant_id" = current_setting('app.current_tenant_id')::uuid) WITH CHECK ("meal_options"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "meal_options" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("meal_options"."tenant_id" = current_setting('app.current_tenant_id')::uuid);