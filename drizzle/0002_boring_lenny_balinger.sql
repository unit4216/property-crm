CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "sessions" ("id") VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "session_id" uuid;--> statement-breakpoint
UPDATE "properties" SET "session_id" = '00000000-0000-0000-0000-000000000001' WHERE "session_id" IS NULL;
--> statement-breakpoint
UPDATE "tenants" SET "session_id" = '00000000-0000-0000-0000-000000000001' WHERE "session_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;