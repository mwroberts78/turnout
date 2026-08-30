ALTER TABLE "sign_ups" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "sign_ups" ADD CONSTRAINT "sign_ups_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER POLICY "crud-authenticated-policy-select" ON "sign_ups" TO authenticated USING ("sign_ups"."tenant_id" = current_setting('app.current_tenant_id', true)::uuid AND "sign_ups"."deleted_at" IS NULL);