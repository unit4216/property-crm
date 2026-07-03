CREATE TYPE "public"."property_status" AS ENUM('active', 'vacant', 'occupied', 'under_maintenance', 'listed');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial', 'land');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "property_type" DEFAULT 'single_family' NOT NULL,
	"status" "property_status" DEFAULT 'active' NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"square_feet" integer,
	"rent_amount" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
