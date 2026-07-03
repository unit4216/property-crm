CREATE TYPE "public"."lease_status" AS ENUM('upcoming', 'active', 'ended');--> statement-breakpoint
CREATE TABLE "lease_tenants" (
	"lease_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	CONSTRAINT "lease_tenants_lease_id_tenant_id_pk" PRIMARY KEY("lease_id","tenant_id")
);
--> statement-breakpoint
CREATE TABLE "leases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"status" "lease_status" DEFAULT 'active' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"rent_amount" numeric(12, 2),
	"deposit_amount" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lease_tenants" ADD CONSTRAINT "lease_tenants_lease_id_leases_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."leases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_tenants" ADD CONSTRAINT "lease_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leases" ADD CONSTRAINT "leases_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;