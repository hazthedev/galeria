CREATE TYPE "public"."device_type" AS ENUM('mobile', 'tablet', 'desktop');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'active', 'ended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('birthday', 'wedding', 'corporate', 'other');--> statement-breakpoint
CREATE TYPE "public"."photo_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'trial');--> statement-breakpoint
CREATE TYPE "public"."tenant_type" AS ENUM('master', 'white_label', 'demo');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('guest', 'organizer', 'admin', 'super_admin');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"organizer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"event_type" "event_type" DEFAULT 'other' NOT NULL,
	"event_date" timestamp NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"location" text,
	"expected_guests" integer,
	"custom_hashtag" text,
	"settings" jsonb DEFAULT '{}' NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"qr_code_url" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "migration_version" (
	"version" integer PRIMARY KEY NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_fingerprint" text NOT NULL,
	"images" jsonb DEFAULT '{}' NOT NULL,
	"caption" text,
	"contributor_name" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"status" "photo_status" DEFAULT 'pending' NOT NULL,
	"reactions" jsonb DEFAULT '{"heart": 0, "clap": 0, "laugh": 0, "wow": 0}' NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_type" "tenant_type" DEFAULT 'white_label' NOT NULL,
	"brand_name" text NOT NULL,
	"company_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"support_email" text,
	"phone" text,
	"domain" text,
	"subdomain" text,
	"is_custom_domain" boolean DEFAULT false NOT NULL,
	"branding" jsonb DEFAULT '{}' NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"features_enabled" jsonb DEFAULT '{}' NOT NULL,
	"limits" jsonb DEFAULT '{}' NOT NULL,
	"status" "tenant_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"subscription_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'guest' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_tenant_slug_idx" ON "events" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "event_organizer_idx" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "event_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_date_idx" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "photo_event_idx" ON "photos" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "photo_status_idx" ON "photos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "photo_created_at_idx" ON "photos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenant_domain_idx" ON "tenants" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "tenant_subdomain_idx" ON "tenants" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "tenant_status_idx" ON "tenants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_tenant_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_tenant_email_idx" ON "users" USING btree ("tenant_id","email");