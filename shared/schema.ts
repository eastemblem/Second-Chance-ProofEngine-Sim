import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, integer, serial, timestamp, boolean, decimal, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  age: integer("age"),
  contactInfo: json("contact_info").$type<{
    phone?: string;
    linkedin?: string;
    twitter?: string;
    location?: string;
  }>(),
  isSecondChanceDone: boolean("is_second_chance_done").default(false),
  // Additional suggested properties
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  experience: text("experience"), // "first-time", "serial", "corporate"
  industry: text("industry"),
  timezone: text("timezone"),
  preferences: json("preferences").$type<{
    notifications?: boolean;
    newsletter?: boolean;
    mentorship?: boolean;
  }>(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ventures table
export const ventures = pgTable("ventures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  teamSize: integer("team_size").default(1),
  category: text("category"), // "saas", "marketplace", "fintech", etc.
  description: text("description"),
  proofScore: decimal("proof_score", { precision: 5, scale: 2 }),
  // Additional suggested properties
  stage: text("stage"), // "idea", "mvp", "traction", "growth"
  industry: text("industry"),
  targetMarket: text("target_market"),
  businessModel: text("business_model"),
  fundingStage: text("funding_stage"), // "bootstrap", "pre-seed", "seed", etc.
  monthlyRevenue: decimal("monthly_revenue", { precision: 12, scale: 2 }),
  totalRaised: decimal("total_raised", { precision: 12, scale: 2 }),
  valuation: decimal("valuation", { precision: 15, scale: 2 }),
  website: text("website"),
  pitch_deck_url: text("pitch_deck_url"),
  status: text("status").default("active"), // "active", "paused", "closed"
  isPublic: boolean("is_public").default(false),
  tags: json("tags").$type<string[]>(),
  metrics: json("metrics").$type<{
    users?: number;
    mrr?: number;
    churn?: number;
    cac?: number;
    ltv?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ProofScores table (separate table for detailed scoring)
export const proofScores = pgTable("proof_scores", {
  id: serial("id").primaryKey(),
  ventureId: integer("venture_id").references(() => ventures.id).notNull(),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }).notNull(),
  desirability: decimal("desirability", { precision: 5, scale: 2 }).notNull(),
  feasibility: decimal("feasibility", { precision: 5, scale: 2 }).notNull(),
  viability: decimal("viability", { precision: 5, scale: 2 }).notNull(),
  traction: decimal("traction", { precision: 5, scale: 2 }).notNull(),
  readiness: decimal("readiness", { precision: 5, scale: 2 }).notNull(),
  proofTags: json("proof_tags").$type<{
    unlocked: number;
    total: number;
    tags: string[];
  }>(),
  insights: json("insights").$type<{
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }>(),
  assessmentData: json("assessment_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ProofVault documents table
export const proofVaultDocuments = pgTable("proof_vault_documents", {
  id: serial("id").primaryKey(),
  ventureId: integer("venture_id").references(() => ventures.id).notNull(),
  documentType: text("document_type").notNull(), // "pitch_deck", "financial_model", "customer_interviews", etc.
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  isValidated: boolean("is_validated").default(false),
  validatedBy: integer("validated_by").references(() => users.id),
  validationNotes: text("validation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  ventureId: integer("venture_id").references(() => ventures.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").notNull(), // "founder", "co-founder", "cto", "cmo", etc.
  equity: decimal("equity", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

// Investor interactions table
export const investorInteractions = pgTable("investor_interactions", {
  id: serial("id").primaryKey(),
  ventureId: integer("venture_id").references(() => ventures.id).notNull(),
  investorName: text("investor_name").notNull(),
  investorType: text("investor_type"), // "angel", "vc", "accelerator"
  stage: text("stage").notNull(), // "intro", "meeting", "due_diligence", "term_sheet", "closed"
  amount: decimal("amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  nextAction: text("next_action"),
  contactedBy: integer("contacted_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  ventures: many(ventures),
  uploadedDocuments: many(proofVaultDocuments, { relationName: "uploader" }),
  validatedDocuments: many(proofVaultDocuments, { relationName: "validator" }),
  teamMemberships: many(teamMembers),
  investorInteractions: many(investorInteractions),
}));

export const ventureRelations = relations(ventures, ({ one, many }) => ({
  owner: one(users, {
    fields: [ventures.ownerId],
    references: [users.id],
  }),
  proofScores: many(proofScores),
  documents: many(proofVaultDocuments),
  teamMembers: many(teamMembers),
  investorInteractions: many(investorInteractions),
}));

export const proofScoreRelations = relations(proofScores, ({ one }) => ({
  venture: one(ventures, {
    fields: [proofScores.ventureId],
    references: [ventures.id],
  }),
}));

export const documentRelations = relations(proofVaultDocuments, ({ one }) => ({
  venture: one(ventures, {
    fields: [proofVaultDocuments.ventureId],
    references: [ventures.id],
  }),
  uploader: one(users, {
    fields: [proofVaultDocuments.uploadedBy],
    references: [users.id],
    relationName: "uploader",
  }),
  validator: one(users, {
    fields: [proofVaultDocuments.validatedBy],
    references: [users.id],
    relationName: "validator",
  }),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
  venture: one(ventures, {
    fields: [teamMembers.ventureId],
    references: [ventures.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const investorInteractionRelations = relations(investorInteractions, ({ one }) => ({
  venture: one(ventures, {
    fields: [investorInteractions.ventureId],
    references: [ventures.id],
  }),
  contactedBy: one(users, {
    fields: [investorInteractions.contactedBy],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Venture = typeof ventures.$inferSelect;
export type InsertVenture = typeof ventures.$inferInsert;
export type ProofScore = typeof proofScores.$inferSelect;
export type InsertProofScore = typeof proofScores.$inferInsert;
export type ProofVaultDocument = typeof proofVaultDocuments.$inferSelect;
export type InsertProofVaultDocument = typeof proofVaultDocuments.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export type InvestorInteraction = typeof investorInteractions.$inferSelect;
export type InsertInvestorInteraction = typeof investorInteractions.$inferInsert;

export const founderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  startupName: z.string().min(1, "Startup name is required"),
  stage: z.enum(["idea", "mvp", "traction", "growth"]),
  acceleratorApplications: z.number().min(0).default(0),
  pitchDeck: z.string().optional(),
  dataRoom: z.string().optional(),
});

export type FounderData = z.infer<typeof founderSchema>;

export interface ProofScore {
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
  proofScore: ProofScore | null;
  analysisProgress: number;
  isAnalyzing: boolean;
}
