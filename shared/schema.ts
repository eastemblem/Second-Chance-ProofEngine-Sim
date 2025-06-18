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
  linkedinProfile: varchar("linkedin_profile", { length: 200 }).unique(),
  gender: varchar("gender", { length: 20 }),
  companyWebsite: varchar("company_website", { length: 200 }),
  age: smallint("age"),
  personalLinkedin: varchar("personal_linkedin", { length: 200 }),
  positionRole: varchar("position_role", { length: 100 }).notNull(),
  residence: varchar("residence", { length: 100 }),
  isTechnical: boolean("is_technical").notNull().default(false),
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
  marketSize: text("market_size"),
  valuation: text("valuation"),
  revenueStage: revenueStageEnum("revenue_stage").notNull(),
  pilotsPartnerships: text("pilots_partnerships"),
  mvpStatus: mvpStatusEnum("mvp_status").notNull(),
  customerDiscoveryCount: integer("customer_discovery_count").default(0),
  businessModel: text("business_model").notNull(),
  userSignups: integer("user_signups").default(0),
  lois: integer("lois").default(0),
  hasTestimonials: boolean("has_testimonials").default(false),
  description: text("description"),
  linkedinUrl: varchar("linkedin_url", { length: 255 }),
  twitterUrl: varchar("twitter_url", { length: 255 }),
  instagramUrl: varchar("instagram_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Founder Experience table
export const founderExperience = pgTable("founder_experience", {
  experienceId: uuid("experience_id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull(),
  experienceType: varchar("experience_type", { length: 20 }).notNull(),
  description: text("description").notNull(),
  timeframe: varchar("timeframe", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Venture Social Media table
export const ventureSocial = pgTable("venture_social", {
  socialId: uuid("social_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(),
  url: varchar("url", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fundraising History table (replaces investor_interactions)
export const fundraisingHistory = pgTable("fundraising_history", {
  fundraisingId: uuid("fundraising_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  amount: decimal("amount").notNull(),
  stage: varchar("stage", { length: 50 }).notNull(),
  investors: text("investors").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Evaluation Category table
export const evaluationCategory = pgTable("evaluation_category", {
  categoryId: uuid("category_id").primaryKey().defaultRandom(),
  evaluationId: uuid("evaluation_id").references(() => evaluation.evaluationId).notNull(),
  name: varchar("name", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  justification: text("justification").notNull(),
  recommendation: text("recommendation"),
  proofTags: json("proof_tags").$type<string[]>().notNull().default([]),
  relatedSlides: json("related_slides").$type<string[]>().notNull().default([]),
});

// ProofVault table (replaces proof_vault_documents)
export const proofVault = pgTable("proof_vault", {
  vaultId: uuid("vault_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  evaluationId: uuid("evaluation_id").references(() => evaluation.evaluationId),
  artefactType: artefactTypeEnum("artefact_type").notNull(),
  fileId: varchar("file_id", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 255 }).notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const founderRelations = relations(founder, ({ many }) => ({
  ventures: many(venture),
  experiences: many(founderExperience),
}));

export const founderExperienceRelations = relations(founderExperience, ({ one }) => ({
  founder: one(founder, {
    fields: [founderExperience.founderId],
    references: [founder.founderId],
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
  socialMedia: many(ventureSocial),
  fundraisingHistory: many(fundraisingHistory),
}));

export const ventureSocialRelations = relations(ventureSocial, ({ one }) => ({
  venture: one(venture, {
    fields: [ventureSocial.ventureId],
    references: [venture.ventureId],
  }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  venture: one(venture, {
    fields: [teamMember.ventureId],
    references: [venture.ventureId],
  }),
}));

export const fundraisingHistoryRelations = relations(fundraisingHistory, ({ one }) => ({
  venture: one(venture, {
    fields: [fundraisingHistory.ventureId],
    references: [venture.ventureId],
  }),
}));

export const evaluationRelations = relations(evaluation, ({ one, many }) => ({
  venture: one(venture, {
    fields: [evaluation.ventureId],
    references: [venture.ventureId],
  }),
  categories: many(evaluationCategory),
  documents: many(proofVault),
}));

export const evaluationCategoryRelations = relations(evaluationCategory, ({ one }) => ({
  evaluation: one(evaluation, {
    fields: [evaluationCategory.evaluationId],
    references: [evaluation.evaluationId],
  }),
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

// Export types
export type Founder = typeof founder.$inferSelect;
export type InsertFounder = typeof founder.$inferInsert;
export type FounderExperience = typeof founderExperience.$inferSelect;
export type InsertFounderExperience = typeof founderExperience.$inferInsert;
export type Venture = typeof venture.$inferSelect;
export type InsertVenture = typeof venture.$inferInsert;
export type VentureSocial = typeof ventureSocial.$inferSelect;
export type InsertVentureSocial = typeof ventureSocial.$inferInsert;
export type TeamMember = typeof teamMember.$inferSelect;
export type InsertTeamMember = typeof teamMember.$inferInsert;
export type FundraisingHistory = typeof fundraisingHistory.$inferSelect;
export type InsertFundraisingHistory = typeof fundraisingHistory.$inferInsert;
export type Evaluation = typeof evaluation.$inferSelect;
export type InsertEvaluation = typeof evaluation.$inferInsert;
export type EvaluationCategory = typeof evaluationCategory.$inferSelect;
export type InsertEvaluationCategory = typeof evaluationCategory.$inferInsert;
export type ProofVault = typeof proofVault.$inferSelect;
export type InsertProofVault = typeof proofVault.$inferInsert;
export type OnboardingSession = typeof onboardingSession.$inferSelect;
export type InsertOnboardingSession = typeof onboardingSession.$inferInsert;
export type DocumentUpload = typeof documentUpload.$inferSelect;
export type InsertDocumentUpload = typeof documentUpload.$inferInsert;

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
  mvpStatus: z.enum(["Mockup", "Prototype", "Launched"]),
  website: z.string().optional(),
  marketSize: z.string().optional(),
  valuation: z.string().optional(),
  pilotsPartnerships: z.string().optional(),
  customerDiscoveryCount: z.number().default(0),
  userSignups: z.number().default(0),
  lois: z.number().default(0),
  hasTestimonials: z.boolean().default(false),
  description: z.string().optional(),
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
