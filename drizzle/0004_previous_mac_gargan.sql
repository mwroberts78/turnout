CREATE TYPE "public"."opportunity_type" AS ENUM('in-person', 'virtual', 'skills-based');--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"description" text NOT NULL,
	"opportunity_type" "opportunity_type" DEFAULT 'in-person',
	"location" text,
	"image_url" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"meal_provided" boolean DEFAULT false,
	"tshirt_provided" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "opportunities" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("opportunities"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "opportunities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("opportunities"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "opportunities" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("opportunities"."tenant_id" = current_setting('app.current_tenant_id')::uuid) WITH CHECK ("opportunities"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "opportunities" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("opportunities"."tenant_id" = current_setting('app.current_tenant_id')::uuid);