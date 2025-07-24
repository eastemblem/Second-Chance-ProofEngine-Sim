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
  folderId: varchar("folder_id", { length: 255 }).unique(),
  folderUrl: varchar("folder_url", { length: 255 }),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Removed unused table: evaluationCategory

// ProofVault table (replaces proof_vault_documents)
export const proofVault = pgTable("proof_vault", {
  vaultId: uuid("vault_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  evaluationId: uuid("evaluation_id").references(() => evaluation.evaluationId),
  artefactType: artefactTypeEnum("artefact_type").notNull(),
  parentFolderId: varchar("parent_folder_id", { length: 255 }).notNull(),
  subFolderId: varchar("sub_folder_id", { length: 255 }).notNull(),
  sharedUrl: varchar("shared_url", { length: 500 }).notNull(),
  folderName: varchar("folder_name", { length: 100 }).notNull(),
  fileId: varchar("file_id", { length: 255 }),
  fileUrl: varchar("file_url", { length: 500 }),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Leaderboard table for tracking venture scores
export const leaderboard = pgTable("leaderboard", {
  leaderboardId: uuid("leaderboard_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId),
  ventureName: varchar("venture_name", { length: 255 }).notNull(),
  totalScore: integer("total_score").notNull(),
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

export const evaluationRelations = relations(evaluation, ({ one, many }) => ({
  venture: one(venture, {
    fields: [evaluation.ventureId],
    references: [venture.ventureId],
  }),
  documents: many(proofVault),
}));

export const proofVaultRelations = relations(proofVault, ({ one }) => ({
  venture: one(venture, {
    fields: [proofVault.ventureId],
    references: [venture.ventureId],
  }),
  evaluation: one(evaluation, {
    fields: [proofVault.evaluationId],
    references: [evaluation.evaluationId],
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
