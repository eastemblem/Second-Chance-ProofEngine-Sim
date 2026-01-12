import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, integer, serial, timestamp, boolean, decimal, json, jsonb, uuid, varchar, smallint, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ENUM definitions
export const revenueStageEnum = pgEnum('revenue_stage', ['None', 'Pre-Revenue', 'Early Revenue', 'Scaling']);
export const mvpStatusEnum = pgEnum('mvp_status', ['Mockup', 'Prototype', 'Launched']);
export const artefactTypeEnum = pgEnum('artefact_type', [
  'Pitch Deck', 
  'Metrics Dashboard', 
  'Demo Video', 
  'Product Screenshot',
  'Customer Testimonial', 
  'Technical Documentation',
  'Financial Model'
]);
export const ventureStatusEnum = pgEnum('venture_status', ['pending', 'reviewing', 'reviewed', 'done']);

// Founder table (replaces users)
export const founder = pgTable("founder", {
  founderId: uuid("founder_id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  linkedinProfile: varchar("linkedin_profile", { length: 200 }),
  gender: varchar("gender", { length: 20 }),
  age: smallint("age"),
  positionRole: varchar("position_role", { length: 100 }).notNull(),
  residence: varchar("residence", { length: 100 }),
  isTechnical: boolean("is_technical").notNull().default(false),
  // Address fields for payment processing
  phone: varchar("phone", { length: 20 }),
  street: varchar("street", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  // Authentication fields
  passwordHash: varchar("password_hash", { length: 255 }),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastLoginAt: timestamp("last_login_at"),
  // User type: individual (paid pre-onboarding) or residency (program participant)
  userType: varchar("user_type", { length: 20 }), // 'individual' | 'residency' | null for legacy
  // UTM tracking for marketing attribution
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Venture table (replaces ventures)
export const venture = pgTable("venture", {
  ventureId: uuid("venture_id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  website: varchar("website", { length: 200 }),
  industry: varchar("industry", { length: 100 }).notNull(),
  geography: varchar("geography", { length: 100 }).notNull(),
  revenueStage: revenueStageEnum("revenue_stage").notNull(),
  mvpStatus: mvpStatusEnum("mvp_status").notNull(),
  businessModel: text("business_model").notNull(),
  hasTestimonials: boolean("has_testimonials").default(false),
  description: text("description").notNull(),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  twitterUrl: varchar("twitter_url", { length: 255 }),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  certificateUrl: varchar("certificate_url", { length: 500 }),
  certificateGeneratedAt: timestamp("certificate_generated_at"),
  reportUrl: varchar("report_url", { length: 500 }),
  reportGeneratedAt: timestamp("report_generated_at"),
  folderStructure: jsonb("folder_structure"),
  growthStage: varchar("growth_stage", { length: 100 }),
  proofScore: integer("proof_score").default(0),
  vaultScore: integer("vault_score").default(0),
  prooftags: json("prooftags").$type<string[]>().notNull().default([]),
  status: ventureStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Removed unused tables: founderExperience, ventureSocial

// Team Member table (replaces team_members)
export const teamMember = pgTable("team_member", {
  memberId: uuid("member_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  linkedinProfile: varchar("linkedin_profile", { length: 200 }),
  role: varchar("role", { length: 100 }).notNull(),
  experience: text("experience").notNull(),
  background: text("background"),
  isCofounder: boolean("is_cofounder").default(false),
  twitterUrl: varchar("twitter_url", { length: 200 }),
  instagramUrl: varchar("instagram_url", { length: 200 }),
  githubUrl: varchar("github_url", { length: 200 }),
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Removed unused table: fundraisingHistory

// Evaluation table (replaces proof_scores)
export const evaluation = pgTable("evaluation", {
  evaluationId: uuid("evaluation_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  evaluationDate: date("evaluation_date").notNull().defaultNow(),
  proofscore: integer("proofscore").notNull(),
  vaultscore: integer("vaultscore").notNull().default(0), // NEW: ProofVault Score tracking
  prooftags: json("prooftags").$type<string[]>().notNull().default([]),
  // ADDITION: Store complete API response for rich insights and advanced ProofTag logic
  fullApiResponse: jsonb("full_api_response"), // Complete scoring API response
  dimensionScores: json("dimension_scores").$type<{
    desirability?: number;
    feasibility?: number; 
    viability?: number;
    traction?: number;
    readiness?: number;
  }>().default({}), // Mapped dimension scores for easy access
  folderId: varchar("folder_id", { length: 255 }),
  folderUrl: varchar("folder_url", { length: 255 }),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Removed unused table: evaluationCategory

// ProofVault table (folder structure tracking only - individual files tracked in document_upload)
export const proofVault = pgTable("proof_vault", {
  vaultId: uuid("vault_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  artefactType: artefactTypeEnum("artefact_type").notNull(),
  parentFolderId: varchar("parent_folder_id", { length: 255 }).notNull(),
  subFolderId: varchar("sub_folder_id", { length: 255 }).notNull(),
  sharedUrl: varchar("shared_url", { length: 500 }).notNull(),
  folderName: varchar("folder_name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Onboarding Session table for multi-step progress tracking
export const onboardingSession = pgTable("onboarding_session", {
  sessionId: uuid("session_id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId),
  currentStep: varchar("current_step", { length: 50 }).notNull().default("founder"),
  stepData: json("step_data").default({}),
  completedSteps: json("completed_steps").default([]),
  isComplete: boolean("is_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Upload tracking table
export const documentUpload = pgTable("document_upload", {
  uploadId: uuid("upload_id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => onboardingSession.sessionId),
  ventureId: uuid("venture_id").references(() => venture.ventureId),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  uploadStatus: varchar("upload_status", { length: 50 }).default("pending"),
  processingStatus: varchar("processing_status", { length: 50 }).default("pending"),
  eastemblemFileId: varchar("eastemblem_file_id", { length: 100 }),
  sharedUrl: varchar("shared_url", { length: 500 }),
  folderId: varchar("folder_id", { length: 255 }), // Maps to proof_vault.sub_folder_id
  // Error handling fields for pitch deck processing retry functionality
  errorMessage: text("error_message"), // Dynamic error message from API
  retryCount: integer("retry_count").default(0), // Track retry attempts
  maxRetries: integer("max_retries").default(3), // Maximum allowed retries
  canRetry: boolean("can_retry").default(true), // Whether retry is allowed
  // ProofVault enhancement fields
  description: text("description").notNull().default("Document uploaded to ProofVault"), // REQUIRED: User description of the document
  artifactType: varchar("artifact_type", { length: 100 }).notNull().default("document"), // REQUIRED: Selected artifact type
  categoryId: varchar("category_id", { length: 50 }), // Optional: Folder/category reference
  scoreAwarded: integer("score_awarded").default(0), // Points earned from this upload (VaultScore)
  proofScoreContribution: integer("proof_score_contribution").default(0), // Points contributed to ProofScore
  uploadSource: varchar("upload_source", { length: 50 }).notNull().default("proof-vault"), // Source: 'onboarding' or 'proof-vault'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment gateway enums
export const paymentGatewayEnum = pgEnum('payment_gateway', ['telr', 'stripe', 'paypal', 'paytabs']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'cancelled', 'expired']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'expired', 'cancelled']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['basic', 'premium', 'enterprise', 'one-time']);

// Founder user type enum - distinguishes individual paying users from residency program users
export const founderUserTypeEnum = pgEnum('founder_user_type', ['individual', 'residency']);

// Pre-onboarding payment status enum
export const preOnboardingPaymentStatusEnum = pgEnum('pre_onboarding_payment_status', ['pending', 'processing', 'completed', 'failed', 'claimed', 'expired']);

// Pre-onboarding payments table - stores payments made before account creation
export const preOnboardingPayments = pgTable("pre_onboarding_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Customer info (before they have an account)
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  // Reservation token for linking payment to onboarding
  reservationToken: varchar("reservation_token", { length: 50 }).notNull().unique(),
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  paymentType: varchar("payment_type", { length: 50 }).notNull().default("platform_access"), // 'platform_access', 'deal_room', etc.
  // Gateway info
  gateway: paymentGatewayEnum("gateway").notNull().default("paytabs"),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }),
  orderReference: varchar("order_reference", { length: 255 }),
  paymentUrl: text("payment_url"),
  gatewayResponse: jsonb("gateway_response"),
  // Status tracking
  status: preOnboardingPaymentStatusEnum("status").notNull().default("pending"),
  // Linking to founder after onboarding
  claimedByFounderId: uuid("claimed_by_founder_id").references(() => founder.founderId),
  claimedAt: timestamp("claimed_at"),
  // User type this payment grants
  userType: varchar("user_type", { length: 20 }).notNull().default("individual"), // 'individual' | 'residency'
  // UTM tracking for marketing attribution
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Payment claim expiry (30 days default)
});

// Activity types enum for better type safety
export const activityTypeEnum = pgEnum('activity_type', [
  'account',        // Account creation, verification, login
  'venture',        // Venture creation, updates
  'document',       // File uploads, downloads
  'evaluation',     // ProofScore activities
  'authentication', // Login, logout, password changes
  'navigation',     // Page visits, feature usage
  'payment',        // Payment activities
  'validation',     // Validation map / experiment activities
  'system'         // System events, notifications
]);

// User Activity tracking table
export const userActivity = pgTable("user_activity", {
  activityId: uuid("activity_id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId),
  ventureId: uuid("venture_id").references(() => venture.ventureId),
  sessionId: varchar("session_id", { length: 255 }), // Browser session ID
  activityType: activityTypeEnum("activity_type").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'file_upload', 'login', 'venture_create'
  title: varchar("title", { length: 255 }).notNull(), // Display title for the activity
  description: text("description"), // Detailed description
  metadata: jsonb("metadata"), // Additional structured data
  entityId: varchar("entity_id", { length: 255 }), // Reference to related entity (fileId, ventureId, etc.)
  entityType: varchar("entity_type", { length: 50 }), // Type of entity ('file', 'venture', 'evaluation')
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6 address
  userAgent: text("user_agent"), // Browser/device information
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment gateway configurations
export const paymentGateways = pgTable("payment_gateways", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerName: paymentGatewayEnum("provider_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Generic payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull(),
  gatewayProvider: paymentGatewayEnum("gateway_provider").notNull(),
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }),
  orderReference: varchar("order_reference", { length: 255 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  gatewayStatus: varchar("gateway_status", { length: 50 }),
  description: text("description"),
  paymentUrl: text("payment_url"),
  expiresAt: timestamp("expires_at"),
  gatewayResponse: jsonb("gateway_response"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull(),
  paymentTransactionId: uuid("payment_transaction_id").references(() => paymentTransactions.id),
  planType: subscriptionPlanEnum("plan_type").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("inactive"),
  gatewayProvider: paymentGatewayEnum("gateway_provider").notNull(),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment logs for audit trail
export const paymentLogs = pgTable("payment_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").references(() => paymentTransactions.id).notNull(),
  gatewayProvider: paymentGatewayEnum("gateway_provider").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Leaderboard table for tracking venture scores
export const leaderboard = pgTable("leaderboard", {
  leaderboardId: uuid("leaderboard_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId),
  ventureName: varchar("venture_name", { length: 255 }).notNull(),
  totalScore: integer("total_score").notNull(),
  proofTagsCount: integer("proof_tags_count").notNull().default(0),
  dimensionScores: jsonb("dimension_scores").$type<{
    desirability: number;
    feasibility: number;
    viability: number;
    traction: number;
    readiness: number;
  }>(),
  analysisDate: timestamp("analysis_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Organization stage enum for ProofScaling wishlist
export const organizationStageEnum = pgEnum('organization_stage', [
  'Idea Stage',
  'Pre-Product',
  'MVP',
  'Early Traction',
  'Growth Stage',
  'Scaling'
]);

// Validation Map / Experiments enums
export const experimentStatusEnum = pgEnum('experiment_status', [
  'not_started',
  'in_progress',
  'completed'
]);

export const experimentDecisionEnum = pgEnum('experiment_decision', [
  'go',
  'start',
  'pivot',
  'learn'
]);

export const validationSphereEnum = pgEnum('validation_sphere', [
  'Desirability',
  'Viability',
  'Feasibility',
  'Scaling',
  'Custom'
]);

// ProofScaling wishlist table for tracking interested cohort participants
export const proofScalingWishlist = pgTable("proof_scaling_wishlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  organizationStage: organizationStageEnum("organization_stage").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Experiment Master table - Static reference data seeded from CSV (44 experiments)
export const experimentMaster = pgTable("experiment_master", {
  experimentId: varchar("experiment_id", { length: 20 }).primaryKey(), // DES-001, COM-007, etc.
  validationSphere: validationSphereEnum("validation_sphere").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  definition: text("definition").notNull(),
  hypothesisTested: text("hypothesis_tested").notNull(),
  experimentFormat: text("experiment_format").notNull(),
  targetBehaviour: varchar("target_behaviour", { length: 200 }).notNull(),
  targetMetric: varchar("target_metric", { length: 200 }).notNull(),
  toolsPlatforms: varchar("tools_platforms", { length: 300 }),
  typicalDuration: varchar("typical_duration", { length: 50 }),
  notes: text("notes"),
  proofTag: varchar("proof_tag", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Venture Experiments table - User's experiment instances with editable data
export const ventureExperiments = pgTable("venture_experiments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  experimentId: varchar("experiment_id", { length: 20 }).references(() => experimentMaster.experimentId).notNull(),
  slotNumber: integer("slot_number"), // Position in grid (1, 2, 3...)
  assignedFrom: varchar("assigned_from", { length: 50 }), // traction, readiness, viability, feasibility, desirability
  userHypothesis: text("user_hypothesis"), // User's actual hypothesis (editable)
  results: text("results"), // User's findings/results (editable)
  decision: experimentDecisionEnum("decision"), // measure, build, pivot, stop
  status: experimentStatusEnum("status").notNull().default("not_started"),
  customNotes: text("custom_notes"), // User's additional notes (Why field)
  newInsights: text("new_insights"), // New insights from the experiment
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ProofCoach state tracking table - Persistent user guidance state
export const coachState = pgTable("coach_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull().unique(),
  currentJourneyStep: integer("current_journey_step").notNull().default(0),
  completedJourneySteps: json("completed_journey_steps").$type<number[]>().notNull().default([]),
  isMinimized: boolean("is_minimized").notNull().default(false),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  tutorialCompletedPages: json("tutorial_completed_pages").$type<string[]>().notNull().default([]),
  lastInteractionAt: timestamp("last_interaction_at"),
  metadata: jsonb("metadata"), // Additional state data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Introduction Requests table - Track which investors founders have requested introductions to
export const introductionRequests = pgTable("introduction_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull(),
  investorId: varchar("investor_id", { length: 100 }).notNull(),
  investorDetails: jsonb("investor_details"), // Store investor info at time of request
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

// Relations
export const founderRelations = relations(founder, ({ many, one }) => ({
  ventures: many(venture),
  paymentTransactions: many(paymentTransactions),
  subscriptions: many(userSubscriptions),
  coachState: one(coachState, {
    fields: [founder.founderId],
    references: [coachState.founderId],
  }),
}));

export const ventureRelations = relations(venture, ({ one, many }) => ({
  founder: one(founder, {
    fields: [venture.founderId],
    references: [founder.founderId],
  }),
  evaluations: many(evaluation),
  documents: many(proofVault),
  teamMembers: many(teamMember),
  experiments: many(ventureExperiments),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  venture: one(venture, {
    fields: [teamMember.ventureId],
    references: [venture.ventureId],
  }),
}));

// Removed unused relation: fundraisingHistoryRelations

export const evaluationRelations = relations(evaluation, ({ one }) => ({
  venture: one(venture, {
    fields: [evaluation.ventureId],
    references: [venture.ventureId],
  }),
}));

export const proofVaultRelations = relations(proofVault, ({ one }) => ({
  venture: one(venture, {
    fields: [proofVault.ventureId],
    references: [venture.ventureId],
  }),
}));

export const onboardingSessionRelations = relations(onboardingSession, ({ one, many }) => ({
  founder: one(founder, {
    fields: [onboardingSession.founderId],
    references: [founder.founderId],
  }),
  documents: many(documentUpload),
}));

export const documentUploadRelations = relations(documentUpload, ({ one }) => ({
  session: one(onboardingSession, {
    fields: [documentUpload.sessionId],
    references: [onboardingSession.sessionId],
  }),
  venture: one(venture, {
    fields: [documentUpload.ventureId],
    references: [venture.ventureId],
  }),
}));

export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  venture: one(venture, {
    fields: [leaderboard.ventureId],
    references: [venture.ventureId],
  }),
}));

// Payment relations
export const paymentTransactionRelations = relations(paymentTransactions, ({ one, many }) => ({
  founder: one(founder, {
    fields: [paymentTransactions.founderId],
    references: [founder.founderId],
  }),
  subscription: one(userSubscriptions, {
    fields: [paymentTransactions.id],
    references: [userSubscriptions.paymentTransactionId],
  }),
  logs: many(paymentLogs),
}));

export const userSubscriptionRelations = relations(userSubscriptions, ({ one }) => ({
  founder: one(founder, {
    fields: [userSubscriptions.founderId],
    references: [founder.founderId],
  }),
  paymentTransaction: one(paymentTransactions, {
    fields: [userSubscriptions.paymentTransactionId],
    references: [paymentTransactions.id],
  }),
}));

export const paymentLogRelations = relations(paymentLogs, ({ one }) => ({
  transaction: one(paymentTransactions, {
    fields: [paymentLogs.transactionId],
    references: [paymentTransactions.id],
  }),
}));

export const experimentMasterRelations = relations(experimentMaster, ({ many }) => ({
  ventureExperiments: many(ventureExperiments),
}));

export const ventureExperimentsRelations = relations(ventureExperiments, ({ one }) => ({
  venture: one(venture, {
    fields: [ventureExperiments.ventureId],
    references: [venture.ventureId],
  }),
  experiment: one(experimentMaster, {
    fields: [ventureExperiments.experimentId],
    references: [experimentMaster.experimentId],
  }),
}));

export const coachStateRelations = relations(coachState, ({ one }) => ({
  founder: one(founder, {
    fields: [coachState.founderId],
    references: [founder.founderId],
  }),
}));

// Export types
export type Founder = typeof founder.$inferSelect;
export type InsertFounder = typeof founder.$inferInsert;
export type Venture = typeof venture.$inferSelect;
export type InsertVenture = typeof venture.$inferInsert;
export type TeamMember = typeof teamMember.$inferSelect;
export type InsertTeamMember = typeof teamMember.$inferInsert;
export type Evaluation = typeof evaluation.$inferSelect;
export type InsertEvaluation = typeof evaluation.$inferInsert;
export type ProofVault = typeof proofVault.$inferSelect;
export type InsertProofVault = typeof proofVault.$inferInsert;
export type OnboardingSession = typeof onboardingSession.$inferSelect;
export type InsertOnboardingSession = typeof onboardingSession.$inferInsert;
export type DocumentUpload = typeof documentUpload.$inferSelect;
export type InsertDocumentUpload = typeof documentUpload.$inferInsert;

// User Activity types
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

// Payment types
export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type InsertPaymentGateway = typeof paymentGateways.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;
export type PaymentLog = typeof paymentLogs.$inferSelect;
export type InsertPaymentLog = typeof paymentLogs.$inferInsert;

// Pre-onboarding payment types
export type PreOnboardingPayment = typeof preOnboardingPayments.$inferSelect;
export type InsertPreOnboardingPayment = typeof preOnboardingPayments.$inferInsert;

// ProofScaling Wishlist types
export type ProofScalingWishlist = typeof proofScalingWishlist.$inferSelect;
export type InsertProofScalingWishlist = typeof proofScalingWishlist.$inferInsert;

// Experiment types
export type ExperimentMaster = typeof experimentMaster.$inferSelect;
export type InsertExperimentMaster = typeof experimentMaster.$inferInsert;
export type VentureExperiment = typeof ventureExperiments.$inferSelect;
export type InsertVentureExperiment = typeof ventureExperiments.$inferInsert;

// ProofCoach types
export type CoachState = typeof coachState.$inferSelect;
export type InsertCoachState = typeof coachState.$inferInsert;

// Activity insert schema for validation
export const insertUserActivitySchema = createInsertSchema(userActivity, {
  activityType: z.enum(['account', 'venture', 'document', 'evaluation', 'authentication', 'navigation', 'payment', 'system']),
  action: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  metadata: z.any().optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
}).omit({
  activityId: true,
  createdAt: true,
});

// Payment Zod schemas
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  description: z.string().optional(),
  metadata: z.any().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions, {
  planType: z.enum(['basic', 'premium', 'enterprise']),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentLogSchema = createInsertSchema(paymentLogs, {
  action: z.string().min(1).max(100),
  requestData: z.any().optional(),
  responseData: z.any().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Pre-onboarding payment insert schema
export const insertPreOnboardingPaymentSchema = createInsertSchema(preOnboardingPayments, {
  email: z.string().email("Invalid email address").max(255),
  name: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  currency: z.string().max(10).default("USD"),
  paymentType: z.string().max(50).default("platform_access"),
  userType: z.enum(['individual', 'residency']).default('individual'),
}).omit({
  id: true,
  reservationToken: true, // Generated by server
  createdAt: true,
  claimedAt: true,
});

export type InsertPreOnboardingPaymentInput = z.infer<typeof insertPreOnboardingPaymentSchema>;

// ProofScaling Wishlist schema for validation
export const insertProofScalingWishlistSchema = createInsertSchema(proofScalingWishlist, {
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address").max(100),
  phoneNumber: z.string()
    .min(8, "Please enter a complete phone number")
    .max(20)
    .refine((val) => {
      // Check if it's more than just a country code (should have at least 8 chars including +)
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 7; // At least 7 digits for a complete number
    }, "Please enter a complete phone number with area code"),
  companyName: z.string().min(1, "Company/Organization name is required").max(200),
  role: z.string().min(1, "Role is required").max(100),
  organizationStage: z.enum(['Idea Stage', 'Pre-Product', 'MVP', 'Early Traction', 'Growth Stage', 'Scaling']),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Venture Experiments schema for validation
export const insertVentureExperimentSchema = createInsertSchema(ventureExperiments, {
  userHypothesis: z.string().optional(),
  results: z.string().optional(),
  decision: z.enum(['go', 'start', 'pivot', 'learn']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  customNotes: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVentureExperimentSchema = z.object({
  userHypothesis: z.string().optional(),
  results: z.string().optional(),
  decision: z.enum(['go', 'start', 'pivot', 'learn']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  customNotes: z.string().optional(),
});

// ProofCoach state schema for validation
export const insertCoachStateSchema = createInsertSchema(coachState, {
  currentJourneyStep: z.number().default(0),
  completedJourneySteps: z.array(z.number()).default([]),
  isMinimized: z.boolean().default(false),
  isDismissed: z.boolean().default(false),
  tutorialCompletedPages: z.array(z.string()).default([]),
  metadata: z.any().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCoachStateSchema = z.object({
  currentJourneyStep: z.number().optional(),
  completedJourneySteps: z.array(z.number()).optional(),
  isMinimized: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
  tutorialCompletedPages: z.array(z.string()).optional(),
  metadata: z.any().optional(),
});

// Document Upload insert schema with validation for ProofVault enhancements
export const insertDocumentUploadSchema = createInsertSchema(documentUpload, {
  description: z.string().min(1, "Description is required").max(500, "Description must be 500 characters or less"),
  artifactType: z.string().min(1, "Document type is required"),
  categoryId: z.string().optional(),
  scoreAwarded: z.number().default(0),
  proofScoreContribution: z.number().default(0),
}).omit({
  uploadId: true,
  createdAt: true,
});

export type InsertDocumentUploadType = z.infer<typeof insertDocumentUploadSchema>;
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = typeof leaderboard.$inferInsert;

// Introduction Requests types
export type IntroductionRequest = typeof introductionRequests.$inferSelect;
export type InsertIntroductionRequest = typeof introductionRequests.$inferInsert;

export const founderSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  startupName: z.string().min(1, "Startup name is required"),
  stage: z.enum(["None", "Pre-Revenue", "Early Revenue", "Scaling"]),
  acceleratorApplications: z.number().min(0).default(0),
  pitchDeck: z.string().optional(),
  dataRoom: z.string().optional(),
  founderId: z.string().optional(),
  ventureId: z.string().optional(),
  positionRole: z.string().default("Founder"),
  industry: z.string().default("Technology"),
  geography: z.string().default("Global"),
  businessModel: z.string().default("SaaS"),
});

export type FounderData = z.infer<typeof founderSchema>;

export const ventureSchema = z.object({
  name: z.string().min(1, "Venture name is required"),
  industry: z.string().min(1, "Industry is required"),
  geography: z.string().min(1, "Geography is required"),
  businessModel: z.string().min(1, "Business model is required"),
  revenueStage: z.enum(["None", "Pre-Revenue", "Early Revenue", "Scaling"]),
  productStatus: z.enum(["Mockup", "Prototype", "Launched"]),
  website: z.string().optional(),
  hasTestimonials: z.boolean().default(false),
  description: z.string().min(1, "Startup description is required"),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
});

export type VentureFormData = z.infer<typeof ventureSchema>;

export interface ProofScoreResult {
  total: number;
  dimensions: {
    desirability: number;
    feasibility: number;
    viability: number;
    traction: number;
    readiness: number;
  };
  prooTags: {
    unlocked: number;
    total: number;
    tags: string[];
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export interface SimulationState {
  currentPage: number;
  founderData: Partial<FounderData>;
  proofScore: ProofScoreResult | null;
  analysisProgress: number;
  isAnalyzing: boolean;
}
