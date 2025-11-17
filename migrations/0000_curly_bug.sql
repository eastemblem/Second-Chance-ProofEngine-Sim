CREATE TYPE "public"."activity_type" AS ENUM('account', 'venture', 'document', 'evaluation', 'authentication', 'navigation', 'payment', 'validation', 'system');--> statement-breakpoint
CREATE TYPE "public"."artefact_type" AS ENUM('Pitch Deck', 'Metrics Dashboard', 'Demo Video', 'Product Screenshot', 'Customer Testimonial', 'Technical Documentation', 'Financial Model');--> statement-breakpoint
CREATE TYPE "public"."experiment_decision" AS ENUM('go', 'start', 'pivot', 'learn');--> statement-breakpoint
CREATE TYPE "public"."experiment_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."mvp_status" AS ENUM('Mockup', 'Prototype', 'Launched');--> statement-breakpoint
CREATE TYPE "public"."organization_stage" AS ENUM('Idea Stage', 'Pre-Product', 'MVP', 'Early Traction', 'Growth Stage', 'Scaling');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('telr', 'stripe', 'paypal', 'paytabs');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."revenue_stage" AS ENUM('None', 'Pre-Revenue', 'Early Revenue', 'Scaling');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('basic', 'premium', 'enterprise', 'one-time');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."validation_sphere" AS ENUM('Desirability', 'Viability', 'Feasibility', 'Scaling', 'Custom');--> statement-breakpoint
CREATE TYPE "public"."venture_status" AS ENUM('pending', 'reviewing', 'reviewed', 'done');--> statement-breakpoint
CREATE TABLE "coach_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"current_journey_step" integer DEFAULT 0 NOT NULL,
	"completed_journey_steps" json DEFAULT '[]'::json NOT NULL,
	"is_minimized" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"tutorial_completed_pages" json DEFAULT '[]'::json NOT NULL,
	"last_interaction_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coach_state_founder_id_unique" UNIQUE("founder_id")
);
--> statement-breakpoint
CREATE TABLE "document_upload" (
	"upload_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"venture_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"upload_status" varchar(50) DEFAULT 'pending',
	"processing_status" varchar(50) DEFAULT 'pending',
	"eastemblem_file_id" varchar(100),
	"shared_url" varchar(500),
	"folder_id" varchar(255),
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"can_retry" boolean DEFAULT true,
	"description" text DEFAULT 'Document uploaded to ProofVault' NOT NULL,
	"artifact_type" varchar(100) DEFAULT 'document' NOT NULL,
	"category_id" varchar(50),
	"score_awarded" integer DEFAULT 0,
	"proof_score_contribution" integer DEFAULT 0,
	"upload_source" varchar(50) DEFAULT 'proof-vault' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation" (
	"evaluation_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"evaluation_date" date DEFAULT now() NOT NULL,
	"proofscore" integer NOT NULL,
	"vaultscore" integer DEFAULT 0 NOT NULL,
	"prooftags" json DEFAULT '[]'::json NOT NULL,
	"full_api_response" jsonb,
	"dimension_scores" json DEFAULT '{}'::json,
	"folder_id" varchar(255),
	"folder_url" varchar(255),
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment_master" (
	"experiment_id" varchar(20) PRIMARY KEY NOT NULL,
	"validation_sphere" "validation_sphere" NOT NULL,
	"name" varchar(200) NOT NULL,
	"definition" text NOT NULL,
	"hypothesis_tested" text NOT NULL,
	"experiment_format" text NOT NULL,
	"target_behaviour" varchar(200) NOT NULL,
	"target_metric" varchar(200) NOT NULL,
	"tools_platforms" varchar(300),
	"typical_duration" varchar(50),
	"notes" text,
	"proof_tag" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder" (
	"founder_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"linkedin_profile" varchar(200),
	"gender" varchar(20),
	"age" smallint,
	"position_role" varchar(100) NOT NULL,
	"residence" varchar(100),
	"is_technical" boolean DEFAULT false NOT NULL,
	"phone" varchar(20),
	"street" varchar(200),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"password_hash" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(255),
	"token_expires_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "founder_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "leaderboard" (
	"leaderboard_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid,
	"venture_name" varchar(255) NOT NULL,
	"total_score" integer NOT NULL,
	"proof_tags_count" integer DEFAULT 0 NOT NULL,
	"dimension_scores" jsonb,
	"analysis_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_session" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid,
	"current_step" varchar(50) DEFAULT 'founder' NOT NULL,
	"step_data" json DEFAULT '{}'::json,
	"completed_steps" json DEFAULT '[]'::json,
	"is_complete" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" "payment_gateway" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"configuration" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"gateway_provider" "payment_gateway" NOT NULL,
	"action" varchar(100) NOT NULL,
	"request_data" jsonb,
	"response_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"gateway_provider" "payment_gateway" NOT NULL,
	"gateway_transaction_id" varchar(255),
	"order_reference" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"gateway_status" varchar(50),
	"description" text,
	"payment_url" text,
	"expires_at" timestamp,
	"gateway_response" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_transactions_order_reference_unique" UNIQUE("order_reference")
);
--> statement-breakpoint
CREATE TABLE "proof_scaling_wishlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"role" varchar(100) NOT NULL,
	"organization_stage" "organization_stage" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proof_vault" (
	"vault_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"artefact_type" "artefact_type" NOT NULL,
	"parent_folder_id" varchar(255) NOT NULL,
	"sub_folder_id" varchar(255) NOT NULL,
	"shared_url" varchar(500) NOT NULL,
	"folder_name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"member_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(100),
	"linkedin_profile" varchar(200),
	"role" varchar(100) NOT NULL,
	"experience" text NOT NULL,
	"background" text,
	"is_cofounder" boolean DEFAULT false,
	"twitter_url" varchar(200),
	"instagram_url" varchar(200),
	"github_url" varchar(200),
	"age" integer,
	"gender" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"activity_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid,
	"venture_id" uuid,
	"session_id" varchar(255),
	"activity_type" "activity_type" NOT NULL,
	"action" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"metadata" jsonb,
	"entity_id" varchar(255),
	"entity_type" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"payment_transaction_id" uuid,
	"plan_type" "subscription_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'inactive' NOT NULL,
	"gateway_provider" "payment_gateway" NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture" (
	"venture_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"website" varchar(200),
	"industry" varchar(100) NOT NULL,
	"geography" varchar(100) NOT NULL,
	"revenue_stage" "revenue_stage" NOT NULL,
	"mvp_status" "mvp_status" NOT NULL,
	"business_model" text NOT NULL,
	"has_testimonials" boolean DEFAULT false,
	"description" text NOT NULL,
	"linkedin_url" varchar(255),
	"twitter_url" varchar(255),
	"instagram_url" varchar(255),
	"certificate_url" varchar(500),
	"certificate_generated_at" timestamp,
	"report_url" varchar(500),
	"report_generated_at" timestamp,
	"folder_structure" jsonb,
	"growth_stage" varchar(100),
	"proof_score" integer DEFAULT 0,
	"vault_score" integer DEFAULT 0,
	"prooftags" json DEFAULT '[]'::json NOT NULL,
	"status" "venture_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venture_id" uuid NOT NULL,
	"experiment_id" varchar(20) NOT NULL,
	"slot_number" integer,
	"assigned_from" varchar(50),
	"user_hypothesis" text,
	"results" text,
	"decision" "experiment_decision",
	"status" "experiment_status" DEFAULT 'not_started' NOT NULL,
	"custom_notes" text,
	"new_insights" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach_state" ADD CONSTRAINT "coach_state_founder_id_founder_founder_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founder"("founder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_upload" ADD CONSTRAINT "document_upload_session_id_onboarding_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_session"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_upload" ADD CONSTRAINT "document_upload_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation" ADD CONSTRAINT "evaluation_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_session" ADD CONSTRAINT "onboarding_session_founder_id_founder_founder_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founder"("founder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_founder_id_founder_founder_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founder"("founder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_vault" ADD CONSTRAINT "proof_vault_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_founder_id_founder_founder_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founder"("founder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_founder_id_founder_founder_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founder"("founder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venture" ADD CONSTRAINT "venture_founder_id_founder_founder_id_fk" FOREIGN KEY ("founder_id") REFERENCES "public"."founder"("founder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venture_experiments" ADD CONSTRAINT "venture_experiments_venture_id_venture_venture_id_fk" FOREIGN KEY ("venture_id") REFERENCES "public"."venture"("venture_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venture_experiments" ADD CONSTRAINT "venture_experiments_experiment_id_experiment_master_experiment_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiment_master"("experiment_id") ON DELETE no action ON UPDATE no action;