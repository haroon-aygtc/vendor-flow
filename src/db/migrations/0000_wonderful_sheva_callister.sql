CREATE TABLE "agent_executions" (
	"id" uuid PRIMARY KEY DEFAULT 'rjludx37vrocm01gp3ib3k9z' NOT NULL,
	"agent_id" uuid NOT NULL,
	"workflow_id" uuid,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"status" varchar(20) NOT NULL,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"duration" integer,
	"token_usage" jsonb
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT 'zv8bl9nv51na7ovmvs0kp5th' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"provider_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"system_prompt" text NOT NULL,
	"temperature" numeric(3, 2) DEFAULT '0.7' NOT NULL,
	"max_tokens" integer DEFAULT 1000 NOT NULL,
	"status" varchar(20) DEFAULT 'inactive' NOT NULL,
	"total_runs" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT 'va23zkhky1rzqz2sxd8cgx1v' NOT NULL,
	"provider_id" uuid NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"context_length" integer NOT NULL,
	"input_cost" numeric(10, 8),
	"output_cost" numeric(10, 8),
	"capabilities" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" uuid PRIMARY KEY DEFAULT 't0uhl3wpvfyt5h32qelkq986' NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"api_key" text NOT NULL,
	"base_url" text,
	"status" varchar(20) DEFAULT 'disconnected' NOT NULL,
	"config" jsonb,
	"rate_limits" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT 'pqij5h0ego9lc1a1kbsbqoou' NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"details" jsonb,
	"user_id" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT 'wlnw5wfi7xd1huxvhc493mby' NOT NULL,
	"document_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT 'zhcnrb0m6j0a3l7dnazm2sfx' NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"size" integer NOT NULL,
	"content" text,
	"metadata" jsonb,
	"processing_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT 'n4cuhu1fcp9kodzyrn62k2cs' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"definition" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_provider_id_ai_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_provider_id_ai_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;