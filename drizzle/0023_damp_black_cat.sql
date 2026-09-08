ALTER TABLE "opportunities" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "opportunities" TO authenticated USING ("opportunities"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid  AND "opportunities"."deleted_at" IS NULL);