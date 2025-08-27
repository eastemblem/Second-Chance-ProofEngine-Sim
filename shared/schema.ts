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
  // Authentication fields
  passwordHash: varchar("password_hash", { length: 255 }),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastLoginAt: timestamp("last_login_at"),
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
  folderId: varchar("folder_id", { length: 255 }).unique(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment gateway enums
export const paymentGatewayEnum = pgEnum('payment_gateway', ['telr', 'stripe', 'paypal']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'cancelled', 'expired']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'expired', 'cancelled']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['basic', 'premium', 'enterprise']);

// Activity types enum for better type safety
export const activityTypeEnum = pgEnum('activity_type', [
  'account',        // Account creation, verification, login
  'venture',        // Venture creation, updates
  'document',       // File uploads, downloads
  'evaluation',     // ProofScore activities
  'authentication', // Login, logout, password changes
  'navigation',     // Page visits, feature usage
  'payment',        // Payment activities
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

// Relations
export const founderRelations = relations(founder, ({ many }) => ({
  ventures: many(venture),
  paymentTransactions: many(paymentTransactions),
  subscriptions: many(userSubscriptions),
}));

export const ventureRelations = relations(venture, ({ one, many }) => ({
  founder: one(founder, {
    fields: [venture.founderId],
    references: [founder.founderId],
  }),
  evaluations: many(evaluation),
  documents: many(proofVault),
  teamMembers: many(teamMember),
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
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = typeof leaderboard.$inferInsert;

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
