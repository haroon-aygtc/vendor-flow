CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);

CREATE TABLE IF NOT EXISTS "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"prompt" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"successful_runs" integer DEFAULT 0 NOT NULL,
	"last_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"nodes" jsonb NOT NULL,
	"edges" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"last_executed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"extracted_data" jsonb,
	"processing_results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'info' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"api_key" text NOT NULL,
	"endpoint" text,
	"model" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"rate_limit_rpm" integer,
	"rate_limit_tpm" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"rating" numeric(3, 2) NOT NULL,
	"on_time_delivery" numeric(5, 2) NOT NULL,
	"quality_score" numeric(5, 2) NOT NULL,
	"avg_price_vs_market" numeric(5, 2) NOT NULL,
	"completed_orders" integer DEFAULT 0 NOT NULL,
	"performance_trend" text DEFAULT 'stable' NOT NULL,
	"contact_info" jsonb,
	"capabilities" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "procurement_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"budget" numeric(10, 2),
	"deadline" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"requirements" jsonb,
	"selected_vendor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "vendor_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"procurement_request_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"proposed_price" numeric(10, 2) NOT NULL,
	"delivery_time" integer NOT NULL,
	"proposal" text NOT NULL,
	"attachments" jsonb,
	"ai_score" numeric(5, 2),
	"ai_analysis" jsonb,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "ai_providers" ADD CONSTRAINT "ai_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_selected_vendor_id_vendors_id_fk" FOREIGN KEY ("selected_vendor_id") REFERENCES "vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "vendor_proposals" ADD CONSTRAINT "vendor_proposals_procurement_request_id_procurement_requests_id_fk" FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "vendor_proposals" ADD CONSTRAINT "vendor_proposals_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;