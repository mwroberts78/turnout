ALTER TABLE "opportunities" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "title" text NOT NULL;