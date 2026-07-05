ALTER TABLE "properties" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
-- Collapse the retired statuses onto the surviving values before narrowing the
-- enum, so the cast back below doesn't choke on values it no longer knows.
UPDATE "properties" SET "status" = 'active' WHERE "status" IN ('vacant', 'occupied', 'under_maintenance', 'listed');--> statement-breakpoint
DROP TYPE "public"."property_status";--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'sold');--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."property_status";--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DATA TYPE "public"."property_status" USING "status"::"public"."property_status";