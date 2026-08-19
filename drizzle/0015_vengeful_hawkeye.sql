ALTER TABLE "tenants" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-insert" ON "meal_options" TO authenticated WITH CHECK ("meal_options"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-update" ON "meal_options" TO authenticated USING ("meal_options"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("meal_options"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-delete" ON "meal_options" TO authenticated USING ("meal_options"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid);--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "tenants" TO authenticated USING ("tenants"."id" = current_setting('app.current_tenant_id', true)::uuid AND "tenants"."deleted_at" IS NULL);--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "users" TO authenticated USING ("users"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid AND "users"."deleted_at" IS NULL);