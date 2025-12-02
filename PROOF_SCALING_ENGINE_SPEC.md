# Proof Scaling Engine - B2B API Licensing Platform

## Complete Technical Specification for New Project

**Product Name:** Proof Scaling Engine  
**Branding:** Co-branded as "[Customer Name] powered by Proof Scaling Engine"  
**Version:** 1.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database Schema](#3-database-schema)
4. [EastEmblem API Integration](#4-eastemblem-api-integration)
5. [File & Folder Upload System](#5-file--folder-upload-system)
6. [Folder Structure API](#6-folder-structure-api)
7. [Validation Map System](#7-validation-map-system)
8. [Client Configuration & Programs](#8-client-configuration--programs)
9. [Complete API Endpoints](#9-complete-api-endpoints)
10. [Authentication & Security](#10-authentication--security)
11. [Webhook System](#11-webhook-system)
12. [Agent Instructions](#12-agent-instructions)
13. [Key Learnings from Second Chance Platform](#13-key-learnings-from-second-chance-platform)

---

## 1. Project Overview

### Purpose
A standalone B2B API service that exposes the Second Chance validation engine to enterprise customers (investors, VCs, NGOs, accelerators, incubators, program managers). Customers license the technology to validate founders in their deal flow pipelines.

### Target Customers
- Venture Capital firms
- Angel investor networks
- Startup accelerators & incubators
- NGOs running entrepreneurship programs
- Corporate innovation labs
- Government startup initiatives

### Core Value Proposition
Customers integrate validation technology via API to:
- Score startups using AI-powered ProofScore
- Track validation progress through ProofTags
- Store founder evidence in ProofVault
- Guide founders through 44 validation experiments
- Match qualified startups with investors (premium tier)

---

## 2. Architecture Decisions

### Strategic Choices Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data Submission | API-only (JSON) | Customers send founder data directly; no white-labeled UI needed |
| Document Storage | Shared EastEmblem/Box.com | Leverage existing infrastructure; no per-tenant storage complexity |
| Deal Room | Premium add-on tier | Investor matching reserved for Enterprise customers |
| White-labeling | Partial (co-branded) | "Proof Scaling Engine powered by Second Chance" |
| Multi-tenancy | Query-scoped isolation | All database queries filtered by `licenseeId` |

### Tech Stack (Recommended)
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Drizzle ORM
- **External APIs:** EastEmblem (scoring, storage, certificates)
- **Authentication:** API key-based (hashed with SHA-256)
- **Rate Limiting:** Tier-based (100/500/unlimited per minute)

---

## 3. Database Schema

### Existing Tables (From Second Chance - To Replicate)

```typescript
// ============================================
// ENUM DEFINITIONS
// ============================================

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
export const experimentStatusEnum = pgEnum('experiment_status', ['not_started', 'in_progress', 'completed']);
export const experimentDecisionEnum = pgEnum('experiment_decision', ['go', 'start', 'pivot', 'learn']);
export const validationSphereEnum = pgEnum('validation_sphere', [
  'Desirability', 'Viability', 'Feasibility', 'Scaling', 'Custom'
]);

// ============================================
// FOUNDER TABLE
// ============================================

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
  phone: varchar("phone", { length: 20 }),
  street: varchar("street", { length: 200 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// VENTURE TABLE
// ============================================

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
  folderStructure: jsonb("folder_structure"), // Stores Box.com folder IDs
  growthStage: varchar("growth_stage", { length: 100 }),
  proofScore: integer("proof_score").default(0),
  vaultScore: integer("vault_score").default(0),
  prooftags: json("prooftags").$type<string[]>().notNull().default([]),
  status: ventureStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TEAM MEMBER TABLE
// ============================================

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

// ============================================
// EVALUATION TABLE (ProofScore History)
// ============================================

export const evaluation = pgTable("evaluation", {
  evaluationId: uuid("evaluation_id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  evaluationDate: date("evaluation_date").notNull().defaultNow(),
  proofscore: integer("proofscore").notNull(),
  vaultscore: integer("vaultscore").notNull().default(0),
  prooftags: json("prooftags").$type<string[]>().notNull().default([]),
  fullApiResponse: jsonb("full_api_response"), // Complete scoring API response
  dimensionScores: json("dimension_scores").$type<{
    desirability?: number;
    feasibility?: number; 
    viability?: number;
    traction?: number;
    readiness?: number;
  }>().default({}),
  folderId: varchar("folder_id", { length: 255 }),
  folderUrl: varchar("folder_url", { length: 255 }),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// DOCUMENT UPLOAD TABLE (ProofVault Files)
// ============================================

export const documentUpload = pgTable("document_upload", {
  uploadId: uuid("upload_id").primaryKey().defaultRandom(),
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
  folderId: varchar("folder_id", { length: 255 }), // Box.com folder ID
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  canRetry: boolean("can_retry").default(true),
  description: text("description").notNull().default("Document uploaded to ProofVault"),
  artifactType: varchar("artifact_type", { length: 100 }).notNull().default("document"),
  categoryId: varchar("category_id", { length: 50 }), // Folder category reference
  scoreAwarded: integer("score_awarded").default(0), // VaultScore points
  proofScoreContribution: integer("proof_score_contribution").default(0),
  uploadSource: varchar("upload_source", { length: 50 }).notNull().default("proof-vault"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// EXPERIMENT MASTER TABLE (44 Experiments - Static Reference)
// ============================================

export const experimentMaster = pgTable("experiment_master", {
  experimentId: varchar("experiment_id", { length: 20 }).primaryKey(), // DES-001, VIA-007, etc.
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
  proofTag: varchar("proof_tag", { length: 100 }), // ProofTag awarded on completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// VENTURE EXPERIMENTS TABLE (User's Experiment Instances)
// ============================================

export const ventureExperiments = pgTable("venture_experiments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").references(() => venture.ventureId).notNull(),
  experimentId: varchar("experiment_id", { length: 20 }).references(() => experimentMaster.experimentId).notNull(),
  slotNumber: integer("slot_number"), // Position in grid (1, 2, 3...)
  assignedFrom: varchar("assigned_from", { length: 50 }), // Source dimension
  userHypothesis: text("user_hypothesis"), // User's actual hypothesis (editable)
  results: text("results"), // User's findings/results (editable)
  decision: experimentDecisionEnum("decision"), // go, start, pivot, learn
  status: experimentStatusEnum("status").notNull().default("not_started"),
  customNotes: text("custom_notes"), // User's additional notes
  newInsights: text("new_insights"), // New insights from experiment
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// PROOF VAULT TABLE (Folder Structure Tracking)
// ============================================

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
```

### NEW B2B Tables (To Create)

```typescript
// ============================================
// B2B LICENSING ENUMS
// ============================================

export const licenseTierEnum = pgEnum('license_tier', ['core', 'growth', 'enterprise']);
export const programTypeEnum = pgEnum('program_type', [
  'second_chance_residency',
  'validation_residency', 
  'gtm_accelerator'
]);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'dropped', 'paused']);

// ============================================
// API LICENSEE TABLE (B2B Customers)
// ============================================

export const apiLicensee = pgTable("api_licensee", {
  licenseeId: uuid("licensee_id").primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  
  // API Authentication
  apiKeyHash: varchar("api_key_hash", { length: 64 }).notNull(), // SHA-256 hash
  apiKeyPrefix: varchar("api_key_prefix", { length: 12 }).notNull(), // pse_live_ or pse_test_
  testApiKeyHash: varchar("test_api_key_hash", { length: 64 }), // Test environment key
  
  // Licensing
  tier: licenseTierEnum("tier").notNull().default("core"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Rate Limiting
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(100),
  
  // Webhooks
  webhookUrl: varchar("webhook_url", { length: 500 }),
  webhookSecret: varchar("webhook_secret", { length: 64 }), // For HMAC signing
  
  // Contract Details
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  
  // Branding
  displayName: varchar("display_name", { length: 200 }), // Custom display name
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }), // Hex color
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// LICENSEE CONFIGURATION TABLE (Program Settings)
// ============================================

export const licenseeConfig = pgTable("licensee_config", {
  configId: uuid("config_id").primaryKey().defaultRandom(),
  licenseeId: uuid("licensee_id").references(() => apiLicensee.licenseeId).notNull(),
  
  // Program Assignment
  program: programTypeEnum("program").notNull(),
  
  // Program-Specific Settings
  programSettings: jsonb("program_settings").$type<{
    // Experiment requirements
    requiredExperiments: string[];      // Experiment IDs mandatory for program
    recommendedExperiments: string[];   // Suggested experiments
    
    // Score thresholds
    minimumProofScore: number;          // Target ProofScore for graduation
    minimumVaultScore: number;          // Minimum artifacts required
    
    // Timeline
    programDurationWeeks: number;
    checkpointWeeks: number[];          // Review milestones (e.g., [2, 4, 6])
    
    // Vault requirements
    requiredArtifactTypes: string[];    // Mandatory artifact categories
    
    // Feature access
    dealRoomEnabled: boolean;
    customBrandingEnabled: boolean;
  }>().notNull(),
  
  // Notifications
  notifyOnMilestones: boolean("notify_on_milestones").default(true),
  notifyOnScoreChange: boolean("notify_on_score_change").default(true),
  notifyOnExperimentComplete: boolean("notify_on_experiment_complete").default(true),
  
  isDefault: boolean("is_default").default(false), // Default config for this licensee
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// FOUNDER ENROLLMENT TABLE (Founder-Client Relationship)
// ============================================

export const founderEnrollment = pgTable("founder_enrollment", {
  enrollmentId: uuid("enrollment_id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull(),
  licenseeId: uuid("licensee_id").references(() => apiLicensee.licenseeId).notNull(),
  ventureId: uuid("venture_id").references(() => venture.ventureId),
  configId: uuid("config_id").references(() => licenseeConfig.configId),
  
  // Program
  program: programTypeEnum("program").notNull(),
  
  // Status
  status: enrollmentStatusEnum("status").notNull().default("active"),
  
  // Timeline
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"), // When founder actively started
  graduatedAt: timestamp("graduated_at"),
  droppedAt: timestamp("dropped_at"),
  
  // Progress Tracking
  currentCheckpoint: integer("current_checkpoint").default(0),
  proofScoreAtEnrollment: integer("proof_score_at_enrollment").default(0),
  proofScoreAtGraduation: integer("proof_score_at_graduation"),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional enrollment data
  notes: text("notes"), // Admin notes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// API USAGE TRACKING TABLE
// ============================================

export const apiUsage = pgTable("api_usage", {
  usageId: uuid("usage_id").primaryKey().defaultRandom(),
  licenseeId: uuid("licensee_id").references(() => apiLicensee.licenseeId).notNull(),
  
  // Request Details
  endpoint: varchar("endpoint", { length: 200 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: integer("status_code").notNull(),
  responseTimeMs: integer("response_time_ms"),
  
  // Rate Limiting
  rateLimitRemaining: integer("rate_limit_remaining"),
  
  // Request Metadata
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// WEBHOOK DELIVERY LOG TABLE
// ============================================

export const webhookDelivery = pgTable("webhook_delivery", {
  deliveryId: uuid("delivery_id").primaryKey().defaultRandom(),
  licenseeId: uuid("licensee_id").references(() => apiLicensee.licenseeId).notNull(),
  
  // Event Details
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  
  // Delivery Status
  deliveryStatus: varchar("delivery_status", { length: 20 }).notNull().default("pending"),
  statusCode: integer("status_code"),
  responseBody: text("response_body"),
  
  // Retry Logic
  attemptCount: integer("attempt_count").default(0),
  maxAttempts: integer("max_attempts").default(3),
  nextRetryAt: timestamp("next_retry_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});
```

---

## 4. EastEmblem API Integration

### Base Configuration

```typescript
// Environment variable required
EASTEMBLEM_API_BASE_URL=https://your-eastemblem-instance.com

// API client initialization
class EastEmblemAPI {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.EASTEMBLEM_API_BASE_URL || '';
    if (!this.baseUrl) {
      throw new Error("EASTEMBLEM_API_BASE_URL environment variable is required");
    }
  }
  
  private getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}
```

### Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhook/vault/folder/create-structure` | POST | Create 7-folder ProofVault structure |
| `/webhook/vault/folder/create` | POST | Create single folder |
| `/webhook/vault/file/upload` | POST | Upload file to Box.com |
| `/webhook/score/pitch-deck` | POST | AI scoring of pitch deck |
| `/webhook/certificate/create` | POST | Generate validation certificate |
| `/webhook/report/create` | POST | Generate detailed report |
| `/deal-room` | GET | Fetch investor data |
| `/deal-room/funnel` | POST | Create investor introduction funnel |

### Key Response Types

```typescript
interface FolderStructureResponse {
  id: string;           // Parent folder ID
  url: string;          // Box.com URL
  folders: {
    "0_Overview": string;
    "1_Problem_Proof": string;
    "2_Solution_Proof": string;
    "3_Demand_Proof": string;
    "4_Credibility_Proof": string;
    "5_Commercial_Proof": string;
    "6_Investor_Pack": string;
  };
}

interface FileUploadResponse {
  id: string;           // File ID in Box.com
  name: string;         // File name
  url?: string;         // View URL
  download_url?: string; // Download URL
}

interface PitchDeckScoreResponse {
  output?: {
    Problem?: { score: number; justification: string; recommendation: string; };
    solution?: { score: number; justification: string; recommendation: string; };
    market_opportunity?: { score: number; justification: string; recommendation: string; };
    product_technology?: { score: number; justification: string; recommendation: string; };
    team?: { score: number; justification: string; recommendation: string; };
    business_model?: { score: number; justification: string; recommendation: string; };
    traction_milestones?: { score: number; justification: string; recommendation: string; };
    competition?: { score: number; justification: string; recommendation: string; };
    go_to_market_strategy?: { score: number; justification: string; recommendation: string; };
    financials_projections_ask?: { score: number; justification: string; recommendation: string; };
    total_score: number;
    overall_feedback: string[];
  };
}
```

### Retry Logic (Important!)

```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'API operation'
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = this.isRetryableError(error);
      
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      await this.sleep(delay + jitter);
    }
  }
  throw new Error(`${operationName} failed after ${maxRetries} attempts`);
}

private isRetryableError(error: any): boolean {
  if (error instanceof Error) {
    // Retry on timeout and 5xx errors
    if (error.name === 'AbortError' ||
        error.message.includes('524') ||
        error.message.includes('503') ||
        error.message.includes('502') ||
        error.message.includes('500') ||
        error.message.includes('timeout')) {
      return true;
    }
  }
  return false; // Don't retry 4xx errors
}
```

---

## 5. File & Folder Upload System

### Supported File Types

```typescript
const allowedTypes = [
  // PDF
  "application/pdf",
  
  // MS Office
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "application/vnd.ms-excel", // XLS
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
  "application/vnd.ms-powerpoint", // PPT
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
  
  // Images
  "image/bmp", "image/png", "image/jpeg", "image/gif",
  "image/tiff", "image/svg+xml", "image/webp",
  
  // Video
  "video/mp4", "video/mpeg", "video/quicktime",
  "video/x-msvideo", "video/webm",
  
  // Audio
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/aac",
  
  // Other
  "text/plain", "text/csv", "application/xml"
];
```

### File Size Limit
- **Maximum:** 10 MB per file
- **Batch upload:** Up to 10 files at once

### Upload Flow

```
1. Client sends file via multipart/form-data
2. Server validates file type and size
3. File saved temporarily to disk
4. File buffer read and sent to EastEmblem API
5. EastEmblem uploads to Box.com folder
6. Server receives file ID and URL
7. Record created in document_upload table
8. Temporary file deleted
9. Response returned with file metadata
```

### Create Folder Structure

```typescript
async createFolderStructure(
  folderName: string,      // e.g., "VentureName_CompanyId"
  onboardingId?: string    // Optional session tracking
): Promise<FolderStructureResponse> {
  const formData = new FormData();
  formData.append("folderName", folderName);
  if (onboardingId) {
    formData.append("onboarding_id", onboardingId);
  }

  const response = await fetch(
    this.getEndpoint("/webhook/vault/folder/create-structure"),
    { method: "POST", body: formData }
  );

  return await response.json();
}
```

### Upload Single File

```typescript
async uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  folderId: string,
  onboardingId?: string,
  isPitchDeck?: boolean
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("data", fileBuffer, fileName);
  formData.append("folder_id", folderId);
  if (onboardingId) formData.append("onboarding_id", onboardingId);
  if (isPitchDeck) formData.append("is_pitch_deck", "true");

  const response = await fetch(
    this.getEndpoint("/webhook/vault/file/upload"),
    { method: "POST", body: formData }
  );

  return await response.json();
}
```

### Create Subfolder

```typescript
async createFolder(
  folderName: string,
  parentFolderId: string
): Promise<{ id: string; name: string; url: string }> {
  const formData = new FormData();
  formData.append("folder_name", folderName);
  formData.append("parent_folder_id", parentFolderId);

  const response = await fetch(
    this.getEndpoint("/webhook/vault/folder/create"),
    { method: "POST", body: formData }
  );

  return await response.json();
}
```

---

## 6. Folder Structure API

### API Endpoint for Client Integration

```
GET /api/v2/license/ventures/:ventureId/vault/structure
```

### Response Format

```json
{
  "success": true,
  "data": {
    "parentFolderId": "332844784735",
    "parentFolderUrl": "https://app.box.com/folder/332844784735",
    "folders": [
      {
        "category": "0_Overview",
        "displayName": "Overview",
        "folderId": "332844784736",
        "folderUrl": "https://app.box.com/folder/332844784736",
        "description": "Company overview, pitch deck, cap table, one-pagers",
        "fileCount": 3
      },
      {
        "category": "1_Problem_Proof",
        "displayName": "Problem Proofs",
        "folderId": "332844933261",
        "folderUrl": "https://app.box.com/folder/332844933261",
        "description": "Evidence of problem validation",
        "fileCount": 5
      },
      {
        "category": "2_Solution_Proof",
        "displayName": "Solution Proofs",
        "folderId": "332842993678",
        "folderUrl": "https://app.box.com/folder/332842993678",
        "description": "Solution validation and proof of concept",
        "fileCount": 2
      },
      {
        "category": "3_Demand_Proof",
        "displayName": "Demand Proofs",
        "folderId": "332843828465",
        "folderUrl": "https://app.box.com/folder/332843828465",
        "description": "Market demand validation",
        "fileCount": 4
      },
      {
        "category": "4_Credibility_Proof",
        "displayName": "Credibility Proofs",
        "folderId": "332843291772",
        "folderUrl": "https://app.box.com/folder/332843291772",
        "description": "Team and company credibility evidence",
        "fileCount": 1
      },
      {
        "category": "5_Commercial_Proof",
        "displayName": "Commercial Proofs",
        "folderId": "332845124499",
        "folderUrl": "https://app.box.com/folder/332845124499",
        "description": "Commercial viability and business model proof",
        "fileCount": 0
      },
      {
        "category": "6_Investor_Pack",
        "displayName": "Investor Pack",
        "folderId": "332842251627",
        "folderUrl": "https://app.box.com/folder/332842251627",
        "description": "Investor presentation materials",
        "fileCount": 2
      }
    ]
  }
}
```

### Category Mapping

```typescript
const categoryMapping: Record<string, { displayName: string; description: string }> = {
  '0_Overview': {
    displayName: 'Overview',
    description: 'Company overview, pitch deck, cap table, one-pagers'
  },
  '1_Problem_Proof': {
    displayName: 'Problem Proofs',
    description: 'Evidence of problem validation'
  },
  '2_Solution_Proof': {
    displayName: 'Solution Proofs',
    description: 'Solution validation and proof of concept'
  },
  '3_Demand_Proof': {
    displayName: 'Demand Proofs',
    description: 'Market demand validation'
  },
  '4_Credibility_Proof': {
    displayName: 'Credibility Proofs',
    description: 'Team and company credibility evidence'
  },
  '5_Commercial_Proof': {
    displayName: 'Commercial Proofs',
    description: 'Commercial viability and business model proof'
  },
  '6_Investor_Pack': {
    displayName: 'Investor Pack',
    description: 'Investor presentation materials'
  }
};
```

---

## 7. Validation Map System

### Overview
The Validation Map contains **44 experiments** across 4 validation spheres. These are seeded from a master list and tracked per-venture.

### The 4 Spheres

| Sphere | Focus | Example Experiments |
|--------|-------|---------------------|
| **Desirability** | Do customers want it? | Customer interviews, surveys, landing page tests, waitlist campaigns |
| **Viability** | Can we make money? | Pricing tests, revenue model validation, unit economics analysis |
| **Feasibility** | Can we build it? | Technical prototypes, MVP testing, operational experiments |
| **Scaling** | Can we grow? | Channel experiments, partnership tests, market expansion pilots |

### Experiment Master Data (Sample)

```typescript
const experiments = [
  {
    experimentId: 'DES-001',
    validationSphere: 'Desirability',
    name: 'Customer Discovery Interviews',
    definition: 'In-depth conversations to uncover needs, pain, and context.',
    hypothesisTested: 'Customers experience the problem as described',
    experimentFormat: 'Interviews (5–15 people)',
    targetBehaviour: 'Qual feedback',
    targetMetric: '70%+ confirm problem',
    toolsPlatforms: 'Zoom, Otter.ai',
    typicalDuration: '1 week',
    proofTag: 'Problem Hunter',
  },
  {
    experimentId: 'DES-002',
    validationSphere: 'Desirability',
    name: 'Problem Validation Survey',
    definition: 'Surveys to quantify prevalence of a problem.',
    hypothesisTested: 'Problem is widespread',
    experimentFormat: 'Online survey (50+)',
    targetBehaviour: '% identifying as high pain',
    targetMetric: 'Incentivise responses',
    toolsPlatforms: 'Typeform, Google Forms',
    typicalDuration: '1 week',
    proofTag: 'Target Locked',
  },
  // ... 42 more experiments
];
```

### Experiment Decisions

When a founder completes an experiment, they record a decision:

| Decision | Meaning |
|----------|---------|
| **Go** | Hypothesis validated, proceed with confidence |
| **Start** | Begin implementing based on learnings |
| **Pivot** | Hypothesis invalidated, change direction |
| **Learn** | More data needed, run follow-up experiment |

### ProofTag Awards

Each experiment has an associated ProofTag that is awarded upon completion:

- `Problem Hunter` - Completed customer discovery
- `Target Locked` - Validated target market
- `Signal Chaser` - Collected demand signals
- `Solution Stamped` - Validated solution concept
- `Revenue Ready` - Validated revenue model
- ... and more

### Experiment Seed Data Source

The canonical 44 experiments are defined in the Second Chance project at:
```
server/scripts/seed-experiments.ts
```

**Sample seed structure:**
```typescript
const experiments = [
  {
    experimentId: 'DES-001',
    validationSphere: 'Desirability',
    name: 'Customer Discovery Interviews',
    definition: 'In-depth conversations to uncover needs, pain, and context.',
    hypothesisTested: 'Customers experience the problem as described',
    experimentFormat: 'Interviews (5–15 people)',
    targetBehaviour: 'Qual feedback',
    targetMetric: '70%+ confirm problem',
    toolsPlatforms: 'Zoom, Otter.ai',
    typicalDuration: '1 week',
    notes: 'Capture verbatim quotes',
    proofTag: 'Problem Hunter',
  },
  // ... 43 more experiments
];

// Seed function
async function seedExperiments() {
  await db.insert(experimentMaster).values(experiments)
    .onConflictDoNothing(); // Idempotent seeding
}
```

**Experiment ID Format:**
- `DES-XXX` = Desirability sphere
- `VIA-XXX` = Viability sphere  
- `FEA-XXX` = Feasibility sphere
- `SCA-XXX` = Scaling sphere

Copy the full experiment definitions from the source project's seed script when setting up the new B2B API.

---

## 8. Client Configuration & Programs

### Three Program Types

#### 1. Second Chance Residency
- **Duration:** 12 weeks
- **Focus:** Full validation journey for early-stage startups
- **ProofScore Target:** 70+
- **Experiments:** All 44 available, 12 required
- **ProofVault:** All 7 categories required
- **Deal Room:** Enabled at ProofScore 70+
- **Checkpoints:** Weeks 3, 6, 9, 12

#### 2. Validation Residency
- **Duration:** 6 weeks
- **Focus:** Intensive validation sprint for idea-stage founders
- **ProofScore Target:** 50+
- **Experiments:** 20 core experiments (Desirability + Viability focus)
- **ProofVault:** 3 categories minimum
- **Deal Room:** Not included
- **Checkpoints:** Weeks 2, 4, 6

#### 3. GTM Accelerator
- **Duration:** 8 weeks
- **Focus:** Go-to-market for post-validation startups
- **ProofScore Target:** 80+
- **Experiments:** 15 experiments (Feasibility + Scaling focus)
- **ProofVault:** 5 categories required
- **Deal Room:** Enabled immediately
- **Checkpoints:** Weeks 2, 4, 6, 8

### Default Configuration JSON

```json
{
  "second_chance_residency": {
    "requiredExperiments": ["DES-001", "DES-002", "DES-003", "VIA-001", "VIA-002", "FEA-001", "FEA-002", "FEA-003", "SCA-001", "SCA-002", "SCA-003", "SCA-004"],
    "recommendedExperiments": ["DES-004", "DES-005", "VIA-003", "VIA-004"],
    "minimumProofScore": 70,
    "minimumVaultScore": 50,
    "programDurationWeeks": 12,
    "checkpointWeeks": [3, 6, 9, 12],
    "requiredArtifactTypes": ["0_Overview", "1_Problem_Proof", "2_Solution_Proof", "3_Demand_Proof", "4_Credibility_Proof", "5_Commercial_Proof", "6_Investor_Pack"],
    "dealRoomEnabled": true,
    "customBrandingEnabled": false
  },
  "validation_residency": {
    "requiredExperiments": ["DES-001", "DES-002", "DES-003", "VIA-001", "VIA-002"],
    "recommendedExperiments": ["DES-004", "VIA-003"],
    "minimumProofScore": 50,
    "minimumVaultScore": 20,
    "programDurationWeeks": 6,
    "checkpointWeeks": [2, 4, 6],
    "requiredArtifactTypes": ["0_Overview", "1_Problem_Proof", "3_Demand_Proof"],
    "dealRoomEnabled": false,
    "customBrandingEnabled": false
  },
  "gtm_accelerator": {
    "requiredExperiments": ["FEA-001", "FEA-002", "FEA-003", "SCA-001", "SCA-002", "SCA-003"],
    "recommendedExperiments": ["SCA-004", "SCA-005"],
    "minimumProofScore": 80,
    "minimumVaultScore": 40,
    "programDurationWeeks": 8,
    "checkpointWeeks": [2, 4, 6, 8],
    "requiredArtifactTypes": ["0_Overview", "2_Solution_Proof", "3_Demand_Proof", "5_Commercial_Proof", "6_Investor_Pack"],
    "dealRoomEnabled": true,
    "customBrandingEnabled": true
  }
}
```

---

## 9. Complete API Endpoints

### Base URL
```
/api/v2/license
```

### Authentication
```
POST   /auth/validate-key              # Validate API key, return tenant context
POST   /auth/rotate-key                # Rotate API key
```

### Founder Management
```
POST   /founders                        # Create founder profile
GET    /founders                        # List all founders (paginated)
GET    /founders/:founderId             # Get founder details
PATCH  /founders/:founderId             # Update founder
DELETE /founders/:founderId             # Soft delete founder
```

### Venture Management
```
POST   /ventures                        # Create venture for founder
GET    /ventures                        # List all ventures (paginated)
GET    /ventures/:ventureId             # Get venture with scores
PATCH  /ventures/:ventureId             # Update venture details
GET    /ventures/:ventureId/full        # Complete profile (scores, tags, plan, vault)
DELETE /ventures/:ventureId             # Soft delete venture
```

### Team Members
```
POST   /ventures/:ventureId/team        # Add team member
GET    /ventures/:ventureId/team        # List team members
PATCH  /ventures/:ventureId/team/:memberId  # Update team member
DELETE /ventures/:ventureId/team/:memberId  # Remove team member
```

### Validation Engine
```
POST   /ventures/:ventureId/score       # Trigger ProofScore calculation (upload pitch deck)
GET    /ventures/:ventureId/proofscore  # Get current ProofScore + dimensions
GET    /ventures/:ventureId/prooftags   # Get earned ProofTags
GET    /ventures/:ventureId/proofplan   # Get recommended experiments
GET    /ventures/:ventureId/evaluations # Get evaluation history
```

### ProofVault
```
GET    /ventures/:ventureId/vault/structure  # Get folder structure for integration
POST   /ventures/:ventureId/vault/upload     # Upload document artifact
POST   /ventures/:ventureId/vault/upload-multiple  # Batch upload (max 10)
GET    /ventures/:ventureId/vault            # List all vault documents
GET    /ventures/:ventureId/vault/score      # Get VaultScore breakdown
POST   /ventures/:ventureId/vault/folder     # Create subfolder
```

### Validation Map (Experiments)
```
GET    /experiments                          # List all 44 master experiments
GET    /experiments/:experimentId            # Get experiment details
GET    /experiments/sphere/:sphere           # Filter by sphere

POST   /ventures/:ventureId/experiments      # Assign experiment(s) to venture
GET    /ventures/:ventureId/experiments      # Get venture's experiments
GET    /ventures/:ventureId/experiments/:id  # Get specific experiment instance
PATCH  /ventures/:ventureId/experiments/:id  # Update progress
POST   /ventures/:ventureId/experiments/:id/complete  # Mark complete & award ProofTag
DELETE /ventures/:ventureId/experiments/:id  # Remove from venture

GET    /ventures/:ventureId/validation-map   # Full map with progress per sphere
GET    /ventures/:ventureId/validation-map/summary  # Completion stats
```

### Deal Room (Enterprise Only + Add-on Required)
```
GET    /deal-room/investors                  # List matching investors
POST   /deal-room/introduction               # Request investor introduction
GET    /deal-room/introductions              # List introduction requests
```

### Tier-Restricted Endpoints Reference

| Endpoint Category | Core | Growth | Enterprise |
|-------------------|------|--------|------------|
| `/founders/*` | ✓ | ✓ | ✓ |
| `/ventures/*` (basic) | ✓ | ✓ | ✓ |
| `/ventures/*/proofscore` | ✓ | ✓ | ✓ |
| `/ventures/*/prooftags` | 10 tags | 44 tags | 44 tags |
| `/ventures/*/proofplan` | - | ✓ | ✓ |
| `/ventures/*/vault` (5 files) | ✓ | ✓ | ✓ |
| `/ventures/*/vault` (unlimited) | - | ✓ | ✓ |
| `/experiments/*` | 10 | 44 | 44 |
| `/ventures/*/validation-map` | - | ✓ | ✓ |
| `/webhooks/*` | - | ✓ | ✓ |
| `/deal-room/*` | - | - | Add-on |
| `/config` (custom branding) | - | Partial | Full |

**Enforcement Example:**
```typescript
function requireTier(minTier: 'core' | 'growth' | 'enterprise') {
  return (req, res, next) => {
    const tierOrder = { core: 1, growth: 2, enterprise: 3 };
    if (tierOrder[req.licensee.tier] < tierOrder[minTier]) {
      return res.status(403).json({
        error: 'TIER_REQUIRED',
        message: `This endpoint requires ${minTier} tier or higher`,
        currentTier: req.licensee.tier
      });
    }
    next();
  };
}

// Usage
router.get('/ventures/:id/proofplan', requireTier('growth'), getProofPlan);
router.get('/deal-room/investors', requireTier('enterprise'), getDealRoomInvestors);
```

### Client Configuration
```
GET    /config                               # Get client's configuration
PATCH  /config                               # Update configuration
GET    /config/programs                      # List available programs
GET    /config/programs/:program             # Get program defaults
POST   /config/programs                      # Create custom program config
```

### Founder Enrollment
```
POST   /founders/:founderId/enroll           # Enroll founder in program
GET    /founders/:founderId/enrollment       # Get enrollment status
PATCH  /founders/:founderId/enrollment       # Update enrollment
POST   /founders/:founderId/graduate         # Graduate founder from program

GET    /cohort                               # List all enrolled founders
GET    /cohort/stats                         # Program completion stats
GET    /cohort/by-program/:program           # Filter by program
```

### Webhooks
```
POST   /webhooks/configure                   # Set webhook URL & secret
GET    /webhooks/events                      # List available event types
GET    /webhooks/deliveries                  # View delivery history
POST   /webhooks/test                        # Send test webhook
```

### Usage & Billing
```
GET    /usage                                # API usage stats
GET    /usage/founders                       # Active founder count for billing
GET    /usage/requests                       # Request counts by endpoint
```

---

## 10. Authentication & Security

### API Key Format
```
Production: pse_live_<32 random alphanumeric chars>
Test:       pse_test_<32 random alphanumeric chars>

Example:    pse_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### API Key Storage
- **Never store raw keys** - only SHA-256 hashes
- Store key prefix separately for identification
- Use constant-time comparison for validation

```typescript
import crypto from 'crypto';

function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

function validateApiKey(providedKey: string, storedHash: string): boolean {
  const providedHash = hashApiKey(providedKey);
  return crypto.timingSafeEqual(
    Buffer.from(providedHash),
    Buffer.from(storedHash)
  );
}
```

### Request Authentication

```typescript
// Header format
Authorization: Bearer pse_live_a1b2c3d4e5f6g7h8...

// Middleware
async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const apiKey = authHeader.substring(7);
  const prefix = apiKey.substring(0, 9); // pse_live_ or pse_test_
  
  // Find licensee by prefix, validate hash
  const licensee = await findLicenseeByKeyPrefix(prefix);
  
  if (!licensee || !validateApiKey(apiKey, licensee.apiKeyHash)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  if (!licensee.isActive) {
    return res.status(403).json({ error: 'License inactive' });
  }
  
  // Attach licensee context
  req.licensee = licensee;
  next();
}
```

### Rate Limiting

```typescript
const tierLimits = {
  core: 100,       // requests per minute
  growth: 500,
  enterprise: -1   // unlimited
};

// Use sliding window rate limiting
// Track in Redis or in-memory with LRU cache
```

### Multi-Tenancy Data Isolation

**CRITICAL:** All database queries MUST be scoped by `licenseeId`

```typescript
// ✅ CORRECT - Always filter by licenseeId
const founders = await db.select()
  .from(founder)
  .innerJoin(founderEnrollment, eq(founder.founderId, founderEnrollment.founderId))
  .where(eq(founderEnrollment.licenseeId, req.licensee.licenseeId));

// ❌ WRONG - Never query without tenant filter
const founders = await db.select().from(founder);
```

### Multi-Tenant Query Patterns (Drizzle ORM)

**Pattern 1: Fetch Founders for a Licensee**
```typescript
async function getFoundersForLicensee(licenseeId: string) {
  return await db.select({
    founderId: founder.founderId,
    fullName: founder.fullName,
    email: founder.email,
    program: founderEnrollment.program,
    status: founderEnrollment.status,
    enrolledAt: founderEnrollment.enrolledAt,
  })
  .from(founder)
  .innerJoin(founderEnrollment, eq(founder.founderId, founderEnrollment.founderId))
  .where(eq(founderEnrollment.licenseeId, licenseeId))
  .orderBy(desc(founderEnrollment.enrolledAt));
}
```

**Pattern 2: Fetch Venture with Full Context**
```typescript
async function getVentureWithContext(ventureId: string, licenseeId: string) {
  const result = await db.select()
    .from(venture)
    .innerJoin(founderEnrollment, eq(venture.founderId, founderEnrollment.founderId))
    .where(and(
      eq(venture.ventureId, ventureId),
      eq(founderEnrollment.licenseeId, licenseeId)
    ))
    .limit(1);
  
  if (!result.length) {
    throw new AppError(404, 'VENTURE_NOT_FOUND', 'Venture not found or access denied');
  }
  return result[0];
}
```

**Pattern 3: Fetch Experiments for a Venture (with tenant check)**
```typescript
async function getVentureExperiments(ventureId: string, licenseeId: string) {
  // First verify venture belongs to licensee
  const ventureCheck = await db.select()
    .from(venture)
    .innerJoin(founderEnrollment, eq(venture.founderId, founderEnrollment.founderId))
    .where(and(
      eq(venture.ventureId, ventureId),
      eq(founderEnrollment.licenseeId, licenseeId)
    ))
    .limit(1);
  
  if (!ventureCheck.length) {
    throw new AppError(403, 'ACCESS_DENIED', 'Access denied to this venture');
  }
  
  // Now fetch experiments
  return await db.select({
    id: ventureExperiments.id,
    experimentId: ventureExperiments.experimentId,
    status: ventureExperiments.status,
    decision: ventureExperiments.decision,
    userHypothesis: ventureExperiments.userHypothesis,
    results: ventureExperiments.results,
    // Join master data
    name: experimentMaster.name,
    sphere: experimentMaster.validationSphere,
    proofTag: experimentMaster.proofTag,
  })
  .from(ventureExperiments)
  .innerJoin(experimentMaster, eq(ventureExperiments.experimentId, experimentMaster.experimentId))
  .where(eq(ventureExperiments.ventureId, ventureId));
}
```

**Pattern 4: Cohort Statistics by Program**
```typescript
async function getCohortStats(licenseeId: string) {
  const stats = await db.select({
    program: founderEnrollment.program,
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${founderEnrollment.status} = 'active')`,
    completed: sql<number>`count(*) filter (where ${founderEnrollment.status} = 'completed')`,
    avgScore: sql<number>`avg(${venture.proofScore})`,
  })
  .from(founderEnrollment)
  .leftJoin(venture, eq(founderEnrollment.ventureId, venture.ventureId))
  .where(eq(founderEnrollment.licenseeId, licenseeId))
  .groupBy(founderEnrollment.program);
  
  return stats;
}
```

---

## 11. Webhook System

### Available Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `founder.created` | New founder created | Founder profile |
| `founder.enrolled` | Founder enrolled in program | Enrollment details |
| `founder.graduated` | Founder completed program | Final scores |
| `venture.created` | New venture created | Venture profile |
| `proofscore.updated` | ProofScore recalculated | New score, dimensions |
| `proofscore.threshold.reached` | ProofScore hits target | Score, threshold |
| `prooftag.earned` | Founder earned ProofTag | Tag name, experiment |
| `experiment.started` | Experiment begun | Experiment details |
| `experiment.completed` | Experiment finished | Results, decision |
| `vault.uploaded` | Document uploaded | File metadata |
| `vault.score.updated` | VaultScore changed | New score |
| `checkpoint.reached` | Program checkpoint hit | Checkpoint number |

### Webhook Payload Format

```json
{
  "id": "evt_a1b2c3d4e5f6",
  "type": "proofscore.updated",
  "created": "2024-12-02T10:30:00Z",
  "licenseeId": "lic_x1y2z3",
  "data": {
    "ventureId": "ven_abc123",
    "ventureName": "TechStartup Inc",
    "founderId": "fnd_def456",
    "previousScore": 45,
    "newScore": 52,
    "dimensions": {
      "desirability": 60,
      "feasibility": 45,
      "viability": 50,
      "traction": 40,
      "readiness": 55
    }
  }
}
```

### HMAC Signature Verification

```typescript
// Signing (server-side)
function signWebhookPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Headers sent with webhook
{
  'Content-Type': 'application/json',
  'X-Webhook-Signature': 'sha256=abc123...',
  'X-Webhook-Timestamp': '1701512400',
  'X-Webhook-Id': 'evt_a1b2c3d4e5f6'
}

// Client verification
function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + signWebhookPayload(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### Retry Logic
- **Max attempts:** 3
- **Backoff:** Exponential (1min, 5min, 30min)
- **Timeout:** 30 seconds per attempt
- **Success:** 2xx status code

---

## 12. Agent Instructions

### Project Setup Checklist

1. **Initialize Project**
   ```bash
   mkdir proof-scaling-engine-api
   cd proof-scaling-engine-api
   npm init -y
   npm install express typescript drizzle-orm @neondatabase/serverless
   npm install -D @types/node @types/express tsx drizzle-kit
   ```

2. **Database Setup**
   - Use PostgreSQL (Neon recommended for serverless)
   - Create all tables from Section 3
   - Seed experiment master data (44 experiments)

3. **Environment Variables**
   ```env
   DATABASE_URL=postgresql://...
   EASTEMBLEM_API_BASE_URL=https://...
   JWT_SECRET=...
   ```

4. **Implementation Order**
   1. Database schema + migrations
   2. API key authentication middleware
   3. Licensee management endpoints
   4. Founder/Venture CRUD
   5. EastEmblem integration (folder, upload, scoring)
   6. Experiment/Validation Map endpoints
   7. Enrollment/Program management
   8. Webhook system
   9. Rate limiting + usage tracking

### Critical Implementation Notes

#### Always Scope by Licensee
```typescript
// Every query must include licenseeId filter
const ventures = await db.select()
  .from(venture)
  .innerJoin(founderEnrollment, ...)
  .where(eq(founderEnrollment.licenseeId, req.licensee.licenseeId));
```

#### Handle EastEmblem Errors Gracefully
```typescript
try {
  const result = await eastEmblemAPI.scorePitchDeck(buffer, filename);
  return result;
} catch (error) {
  if (error.statusCode === 400) {
    // User needs to fix their file
    return { error: error.message, retryable: false };
  }
  // 5xx errors - retry later
  return { error: 'Service temporarily unavailable', retryable: true };
}
```

#### File Cleanup is Critical
```typescript
// Always clean up temp files
try {
  const result = await uploadFile(file);
  return result;
} finally {
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}
```

#### Webhook Delivery Must Be Async
```typescript
// Fire-and-forget pattern
sendWebhook(event).catch(err => {
  console.error('Webhook delivery failed:', err);
  // Queue for retry
});

// Never block the main response
res.json({ success: true });
```

---

## 13. Key Learnings from Second Chance Platform

### Architecture Patterns That Work

1. **Separate concerns with services**
   - `EastEmblemAPI` class for external integration
   - `ActivityService` for event logging
   - `BusinessLogicService` for complex operations

2. **Use middleware chains**
   - Authentication → Rate limiting → Validation → Handler
   - Keep handlers thin, logic in services

3. **Activity/Event logging is valuable**
   - Log all significant actions
   - Enable audit trails and debugging
   - Power analytics and milestone tracking

### Common Pitfalls to Avoid

1. **Don't store raw API keys** - only hashes
2. **Don't skip file cleanup** - disk fills up quickly
3. **Don't block on webhook delivery** - use async
4. **Don't trust client data** - validate everything
5. **Don't forget tenant isolation** - scope all queries

### Performance Optimizations

1. **Cache experiment master data** - it's static
2. **Use pagination** - never return unbounded lists
3. **Implement request timeouts** - EastEmblem can be slow
4. **Batch database operations** - reduce round trips

### Error Handling Best Practices

```typescript
// Categorize errors for appropriate responses
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isRetryable: boolean = false
  ) {
    super(message);
  }
}

// Use consistent error responses
function errorResponse(error: AppError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      retryable: error.isRetryable
    }
  };
}
```

### Testing Recommendations

1. **Use test API keys** (`pse_test_*`) for development
2. **Mock EastEmblem in unit tests** - it's slow and rate-limited
3. **Test tenant isolation** - verify data doesn't leak
4. **Test rate limiting** - ensure limits are enforced
5. **Test webhook retry logic** - verify exponential backoff

---

## Appendix: Quick Reference

### License Tiers

| Feature | Core | Growth | Enterprise |
|---------|------|--------|------------|
| ProofScore | ✓ | ✓ | ✓ |
| Basic ProofTags (10) | ✓ | ✓ | ✓ |
| Full ProofTags (44) | - | ✓ | ✓ |
| ProofPlan | - | ✓ | ✓ |
| ProofVault (5 files) | ✓ | ✓ | ✓ |
| ProofVault (unlimited) | - | ✓ | ✓ |
| Webhooks | - | ✓ | ✓ |
| Deal Room | - | - | Add-on |
| Custom branding | - | Partial | Full |
| Rate limit | 100/min | 500/min | Unlimited |
| SLA | 99% | 99.5% | 99.9% |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Authentication required |
| 403 | Forbidden (inactive license, tier limit) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (EastEmblem down) |

---

*End of Proof Scaling Engine Technical Specification*
