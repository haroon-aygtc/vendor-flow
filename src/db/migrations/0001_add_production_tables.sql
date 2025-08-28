-- Add users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Add password resets table
CREATE TABLE IF NOT EXISTS "password_resets" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);

-- Add vendors table
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"rating" numeric(3, 2) NOT NULL,
	"on_time_delivery" numeric(5, 2) NOT NULL,
	"quality_score" numeric(5, 2) NOT NULL,
	"avg_price_vs_market" numeric(5, 2) NOT NULL,
	"completed_orders" integer NOT NULL,
	"performance_trend" varchar(20) NOT NULL,
	"contact_info" jsonb,
	"capabilities" jsonb,
	"certifications" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add dashboard metrics table
CREATE TABLE IF NOT EXISTS "dashboard_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"value" integer NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);

-- Add activity feed table
CREATE TABLE IF NOT EXISTS "activity_feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"entity_type" varchar(50),
	"entity_id" varchar(255),
	"user_id" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Insert default admin user
INSERT INTO "users" ("id", "name", "email", "password", "role", "avatar", "created_at", "updated_at", "last_login")
VALUES (
  'admin-001',
  'System Administrator',
  'admin@axonstreamai.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- password: admin123
  'admin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;