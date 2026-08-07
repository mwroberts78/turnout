CREATE TYPE "public"."tshirt_sizes" AS ENUM('xs', 'sm', 'md', 'lg', 'xl', '2x', '3x');--> statement-breakpoint
CREATE TABLE "sign_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"work_completed" boolean DEFAULT false NOT NULL,
	"comments" text NOT NULL,
	"estimated_hours" numeric NOT NULL,
	"actual_hours" numeric,
	"wants_meal" boolean DEFAULT false,
	"selected_meal" uuid,
	"wants_tshirt" boolean DEFAULT false,
	"tshirt_size" "tshirt_sizes",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "sign_ups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_selected_meal_meal_options_id_fk" FOREIGN KEY ("selected_meal") REFERENCES "public"."meal_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "sign_ups" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("sign_ups"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "sign_ups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ("sign_ups"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "sign_ups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("sign_ups"."tenant_id" = current_setting('app.current_tenant_id')::uuid) WITH CHECK ("sign_ups"."tenant_id" = current_setting('app.current_tenant_id')::uuid);--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "sign_ups" AS PERMISSIVE FOR DELETE TO "authenticated" USING ("sign_ups"."tenant_id" = current_setting('app.current_tenant_id')::uuid);