# Onboarding Flow Implementation Guide

## Complete Code Logic Reference for Second Chance Platform

**Version:** 1.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Flow Diagram](#2-flow-diagram)
3. [Session Management](#3-session-management)
4. [Step 1: Founder Registration](#4-step-1-founder-registration)
5. [Step 2: Venture Creation](#5-step-2-venture-creation)
6. [Step 3: Team Members](#6-step-3-team-members)
7. [Step 4: Document Upload](#7-step-4-document-upload)
8. [Step 5: Scoring & Processing](#8-step-5-scoring--processing)
9. [Step 6: Certificate Generation](#9-step-6-certificate-generation)
10. [Step 7: Report Generation](#10-step-7-report-generation)
11. [Step 8: Email Notification](#11-step-8-email-notification)
12. [Database Schema](#12-database-schema)
13. [Error Handling](#13-error-handling)
14. [Activity Tracking](#14-activity-tracking)

---

## 1. Overview

The onboarding flow guides founders through a multi-step process to:
1. Register their profile
2. Create their venture
3. Add team members
4. Upload pitch deck
5. Receive AI-powered ProofScore analysis
6. Generate validation certificate
7. Generate detailed report
8. Receive email with results

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| Routes | `server/routes/onboarding.ts` | HTTP endpoints |
| Service | `server/services/onboarding-service.ts` | Business logic |
| Certificate | `server/routes/certificate.ts` | Certificate generation |
| Report | `server/routes/report.ts` | Report generation |
| EastEmblem API | `server/eastemblem-api.ts` | External API calls |

---

## 2. Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Session │───▶│  Founder │───▶│  Venture │───▶│   Team   │  │
│  │   Init   │    │   Step   │    │   Step   │    │   Step   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  [Session DB]    [Founder DB]   [Venture DB]    [Team DB]       │
│                                 [Folder Create]                  │
│                                 [ProofVault DB]                  │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Upload  │───▶│ Scoring  │───▶│  Cert +  │───▶│  Email   │  │
│  │   Step   │    │   Step   │    │  Report  │    │   Send   │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │         │
│       ▼               ▼               ▼               ▼         │
│  [Upload DB]     [Score API]    [Cert/Report]   [Email API]     │
│  [Box.com]       [Leaderboard]  [Document DB]   [Slack]         │
│                  [Evaluation]                                    │
│                  [Venture Update]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Session Management

### Session Initialization

**Endpoint:** `POST /api/onboarding/session/init`

```typescript
// server/services/onboarding-service.ts
async initializeSession(req: Request): Promise<string> {
  const sessionId = getSessionId(req);
  
  // Check if session already exists in database
  const existingSession = await db
    .select()
    .from(onboardingSessionTable)
    .where(eq(onboardingSessionTable.sessionId, sessionId))
    .limit(1);

  if (existingSession.length === 0) {
    // Create new session in database
    await db.insert(onboardingSessionTable).values({
      sessionId,
      currentStep: "founder",
      stepData: {},
      completedSteps: [],
      isComplete: false,
    });

    // Send Slack notification (async, no wait)
    if (eastEmblemAPI.isConfigured()) {
      eastEmblemAPI
        .sendSlackNotification(
          `\`Onboarding Id : ${sessionId}\`\n🚀 New Onboarding Session Started`,
          "#notifications",
          sessionId,
        )
        .catch((error) => {
          console.log("Failed to send onboarding start notification:", error);
        });
    }
  }

  return sessionId;
}
```

### Session Data Structure

```typescript
interface OnboardingSession {
  sessionId: string;
  currentStep: "founder" | "venture" | "team" | "upload" | "processing" | "complete";
  stepData: {
    founder?: FounderData;
    founderId?: string;
    venture?: VentureData;
    folderStructure?: FolderStructureResponse;
    upload?: DocumentUpload;
    processing?: {
      scoringResult?: ScoringResult;
      certificateUrl?: string;
      reportUrl?: string;
      isComplete?: boolean;
    };
  };
  completedSteps: string[];
  isComplete: boolean;
  founderId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Get Session Status

**Endpoint:** `GET /api/onboarding/session/:sessionId`

```typescript
// server/routes/onboarding.ts
router.get("/session/:sessionId", asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await onboardingService.getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  res.json(createSuccessResponse({
    sessionId: session.sessionId,
    currentStep: session.currentStep,
    stepData: session.stepData,
    completedSteps: session.completedSteps,
    isComplete: session.isComplete,
  }));
}));
```

---

## 4. Step 1: Founder Registration

### Endpoint

**POST** `/api/onboarding/founder`

### Request Body

```typescript
interface FounderOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isTechnical?: boolean;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}
```

### Implementation Logic

```typescript
// server/services/onboarding-service.ts
async completeFounderStep(sessionId: string | null, founderData: any) {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  // Ensure session exists in database
  await this.ensureSession(sessionId);

  // Check if founder exists by email
  let founder = await storage.getFounderByEmail(founderData.email);
  
  if (!founder) {
    // Create new founder
    founder = await storage.createFounder(founderData);
  } else {
    // Check if founder has incomplete onboarding sessions
    const hasIncomplete = await this.hasIncompleteOnboardingSession(founder.founderId);
    
    if (hasIncomplete) {
      // Update existing founder data for restart
      await db
        .update(founderTable)
        .set({
          fullName: `${founderData.firstName} ${founderData.lastName}`,
          firstName: founderData.firstName,
          lastName: founderData.lastName,
          role: founderData.role,
          isTechnical: founderData.isTechnical,
          phone: founderData.phone,
          street: founderData.street,
          city: founderData.city,
          state: founderData.state,
          country: founderData.country,
          updatedAt: new Date(),
        })
        .where(eq(founderTable.founderId, founderId));
    } else {
      // Email already exists with completed sessions
      throw new Error("Email already taken");
    }
  }

  // Update session with founder data
  await this.updateSession(sessionId, {
    currentStep: "venture",
    stepData: { 
      founder: founder,
      founderId: founder.founderId,
    },
    completedSteps: ["founder"],
  });

  // Send Slack notification (async)
  if (eastEmblemAPI.isConfigured()) {
    eastEmblemAPI
      .sendSlackNotification(
        `\`Onboarding Id : ${sessionId}\`\n👤 Founder Profile Completed - ${founder.fullName} (${founder.email})`,
        "#notifications",
        sessionId,
      )
      .catch(console.log);
  }

  return {
    sessionId,
    founderId: founder.founderId,
    founder,
  };
}
```

### Database Operations

1. **Check existing founder** by email
2. **Create founder** record if new
3. **Update founder** record if restarting incomplete onboarding
4. **Update session** with founder data and move to next step
5. **Send Slack notification** (fire-and-forget)

---

## 5. Step 2: Venture Creation

### Endpoint

**POST** `/api/onboarding/venture` (legacy)
**POST** `/api/v1/onboarding/venture` (V1 with cache invalidation)

### Zod Validation Schema

```typescript
// server/onboarding.ts
export const ventureOnboardingSchema = z.object({
  name: z.string().min(1, "Venture name is required"),
  industry: z.string().min(1, "Industry is required"),
  geography: z.string().min(1, "Geography is required"),
  businessModel: z.string().min(1, "Business model is required"),
  revenueStage: z.enum(["None", "Pre-Revenue", "Early Revenue", "Scaling"]),
  productStatus: z.enum(["Mockup", "Prototype", "Launched"]),
  website: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  hasTestimonials: z.boolean().default(false),
  description: z.string().min(1, "Startup description is required"),
  linkedinUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  twitterUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  instagramUrl: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});
```

### Request Body

```typescript
interface VentureOnboardingData {
  name: string;              // Required - Venture/startup name
  industry: string;          // Required - Industry vertical
  geography: string;         // Required - Target geography/location
  businessModel: string;     // Required - B2B, B2C, Marketplace, etc.
  revenueStage: "None" | "Pre-Revenue" | "Early Revenue" | "Scaling";
  productStatus: "Mockup" | "Prototype" | "Launched";  // Maps to mvpStatus
  description: string;       // Required - Startup description
  website?: string;          // Optional - Company website
  hasTestimonials?: boolean; // Optional - Has customer testimonials
  linkedinUrl?: string;      // Optional - Company LinkedIn
  twitterUrl?: string;       // Optional - Company Twitter/X
  instagramUrl?: string;     // Optional - Company Instagram
}
```

### Database Schema

```typescript
// shared/schema.ts
export const revenueStageEnum = pgEnum('revenue_stage', [
  'None', 
  'Pre-Revenue', 
  'Early Revenue', 
  'Scaling'
]);

export const mvpStatusEnum = pgEnum('mvp_status', [
  'Mockup', 
  'Prototype', 
  'Launched'
]);

export const ventureStatusEnum = pgEnum('venture_status', [
  'pending', 
  'approved', 
  'rejected'
]);

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
  folderStructure: jsonb("folder_structure"),  // Box.com folder IDs
  growthStage: varchar("growth_stage", { length: 100 }),
  proofScore: integer("proof_score").default(0),
  vaultScore: integer("vault_score").default(0),
  prooftags: json("prooftags").$type<string[]>().notNull().default([]),
  status: ventureStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Storage Implementation

```typescript
// server/storage.ts
async createVenture(insertVenture: InsertVenture): Promise<Venture> {
  // Filter out any fields that don't exist in the database schema
  const filteredVenture = {
    founderId: insertVenture.founderId,
    name: insertVenture.name,
    industry: insertVenture.industry,
    geography: insertVenture.geography,
    businessModel: insertVenture.businessModel,
    revenueStage: insertVenture.revenueStage,
    mvpStatus: insertVenture.mvpStatus,
    website: insertVenture.website,
    hasTestimonials: insertVenture.hasTestimonials,
    description: insertVenture.description,
    linkedinUrl: insertVenture.linkedinUrl,
    twitterUrl: insertVenture.twitterUrl,
    instagramUrl: insertVenture.instagramUrl,
  };
  
  const [ventureRecord] = await db
    .insert(venture)
    .values(filteredVenture)
    .returning();
  return ventureRecord;
}
```

### Route Handler (V1 with Cache Invalidation)

```typescript
// server/routes/v1/onboarding.ts
router.post("/venture", asyncHandler(async (req: Request, res: Response) => {
  const { sessionId: requestSessionId, ...ventureData } = req.body;
  const sessionId = requestSessionId || getSessionId(req);
  
  // Validate request body
  const validation = safeValidate(ventureOnboardingSchema, ventureData);
  if (!validation.success) {
    throw validation.errors;
  }

  // Create venture via service
  const result = await onboardingService.completeVentureStep(sessionId, validation.data);

  // Invalidate cache when new venture is created
  if (result.venture?.founderId) {
    try {
      await lruCacheService.invalidate('founder', result.venture.founderId);
      await lruCacheService.invalidate('venture', result.venture.ventureId);
      await lruCacheService.invalidate('dashboard', `vault_${result.venture.founderId}`);
    } catch (cacheError) {
      // Don't fail the onboarding if cache invalidation fails
      appLogger.api('Cache invalidation failed', { error: cacheError });
    }
  }

  res.json(createSuccessResponse({
    venture: result.venture,
    folderStructure: result.folderStructure,
    nextStep: "team",
  }));
}));
```

### Implementation Logic

```typescript
// server/services/onboarding-service.ts
async completeVentureStep(sessionId: string, ventureData: any) {
  const session = await this.getSession(sessionId);
  
  if (!session) {
    throw new Error("Session not found - founder step must be completed first");
  }

  // Get founder data from session
  const sessionData = session.stepData as any;
  let founderData = sessionData?.founder;
  let founderId = sessionData?.founderId || founderData?.founderId;
  
  if (!founderData || !founderId) {
    // Session validation with clear error messages
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const ageInHours = Math.floor(sessionAge / (1000 * 60 * 60));
    
    if (ageInHours > 24) {
      throw new Error(`This session is ${ageInHours} hours old and appears to be expired.`);
    } else {
      throw new Error(`The founder step has not been completed for this session.`);
    }
  }
  
  // Map productStatus to mvpStatus for database compatibility
  const ventureForDb = {
    ...ventureData,
    founderId: founderId,
    mvpStatus: ventureData.productStatus || ventureData.mvpStatus,
  };
  
  // Create venture in database
  let venture = await storage.createVenture(ventureForDb);
  
  // Log venture creation activity
  await ActivityService.logVentureActivity(
    { founderId, ventureId: venture.ventureId },
    'create',
    'Venture profile created',
    venture.ventureId,
    `Created venture "${venture.name}" in ${venture.industry} industry`,
    { ventureName: venture.name, industry: venture.industry, geography: venture.geography, sessionId }
  );

  // Create folder structure with EastEmblem API
  let folderStructure = null;
  if (eastEmblemAPI.isConfigured()) {
    try {
      folderStructure = await eastEmblemAPI.createFolderStructure(
        venture.name, 
        sessionId
      );
      
      // Save folder structure to venture table
      if (folderStructure) {
        await storage.updateVenture(venture.ventureId, {
          folderStructure: folderStructure
        });
        
        // Populate proof_vault table with folder structure
        if (folderStructure.folders) {
          const folderMappings = [
            { key: "0_Overview", type: "Pitch Deck", description: "Company overview" },
            { key: "1_Problem_Proof", type: "Technical Documentation", description: "Problem validation" },
            { key: "2_Solution_Proof", type: "Demo Video", description: "Solution validation" },
            { key: "3_Demand_Proof", type: "Metrics Dashboard", description: "Market demand validation" },
            { key: "4_Credibility_Proof", type: "Customer Testimonial", description: "Team credibility" },
            { key: "5_Commercial_Proof", type: "Financial Model", description: "Business model" },
            { key: "6_Investor_Pack", type: "Pitch Deck", description: "Investor materials" }
          ];
          
          for (const folder of folderMappings) {
            const subFolderId = folderStructure.folders[folder.key];
            if (subFolderId) {
              await storage.createProofVault({
                ventureId: venture.ventureId,
                artefactType: folder.type,
                parentFolderId: folderStructure.id,
                subFolderId: subFolderId,
                sharedUrl: folderStructure.url,
                folderName: folder.key,
                description: folder.description
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn("Failed to create folder structure:", error);
      // Don't fail the step - folder structure is optional
    }
  }

  // Update session
  await this.updateSession(sessionId, {
    currentStep: "team",
    stepData: {
      ...(session.stepData as any),
      venture,
      folderStructure,
    },
    completedSteps: [...session.completedSteps, "venture"],
  });

  // Send Slack notification (async)
  if (eastEmblemAPI.isConfigured()) {
    eastEmblemAPI
      .sendSlackNotification(
        `\`Onboarding Id : ${sessionId}\`\n🏢 Venture Info Completed - ${venture.name} (${venture.industry})`,
        "#notifications",
        sessionId,
      )
      .catch(console.log);
  }

  return { venture, folderStructure };
}
```

### Folder Structure Creation

The system creates 7 standard folders in Box.com:

| Folder Key | Display Name | Purpose |
|------------|--------------|---------|
| `0_Overview` | Overview | Pitch deck and general info |
| `1_Problem_Proof` | Problem Proof | Market research and problem validation |
| `2_Solution_Proof` | Solution Proof | Product demos and POC materials |
| `3_Demand_Proof` | Demand Proof | Customer feedback and demand evidence |
| `4_Credibility_Proof` | Credibility Proof | Team credentials and partnerships |
| `5_Commercial_Proof` | Commercial Proof | Financial models and projections |
| `6_Investor_Pack` | Investor Pack | Data room for investors |

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "venture": {
      "ventureId": "uuid-generated",
      "founderId": "founder-uuid",
      "name": "TechStartup Inc",
      "industry": "Technology",
      "geography": "North America",
      "revenueStage": "Pre-Revenue",
      "mvpStatus": "Prototype",
      "businessModel": "B2B SaaS",
      "description": "AI-powered analytics platform",
      "hasTestimonials": false,
      "website": "https://techstartup.com",
      "proofScore": 0,
      "vaultScore": 0,
      "prooftags": [],
      "status": "pending",
      "createdAt": "2024-12-04T10:00:00Z",
      "updatedAt": "2024-12-04T10:00:00Z"
    },
    "folderStructure": {
      "id": "box-folder-id",
      "url": "https://box.com/s/shared-url",
      "folders": {
        "0_Overview": "subfolder-id-1",
        "1_Problem_Proof": "subfolder-id-2",
        "2_Solution_Proof": "subfolder-id-3",
        "3_Demand_Proof": "subfolder-id-4",
        "4_Credibility_Proof": "subfolder-id-5",
        "5_Commercial_Proof": "subfolder-id-6",
        "6_Investor_Pack": "subfolder-id-7"
      }
    },
    "nextStep": "team"
  },
  "message": "Success"
}
```

**Error Responses:**

| Code | Error | Cause |
|------|-------|-------|
| 400 | Validation failed | Missing required fields |
| 400 | Session not found | Founder step not completed |
| 400 | Session expired | Session older than 24 hours |
| 500 | Failed to create venture | Database error |

### Database Operations Summary

1. **Validate session exists** and contains founder data
2. **Map productStatus → mvpStatus** for schema compatibility  
3. **Insert venture record** into `venture` table
4. **Log activity** to `user_activity` table
5. **Call EastEmblem API** to create Box.com folder structure
6. **Update venture** with folder structure JSON
7. **Create 7 proof_vault records** for each subfolder
8. **Update session** to move to "team" step
9. **Send Slack notification** (fire-and-forget)
10. **Invalidate cache** (V1 endpoint only)

### Field Mapping

| Frontend Field | Database Field | Notes |
|----------------|----------------|-------|
| `productStatus` | `mvpStatus` | Enum mapped during creation |
| `name` | `name` | Required, max 200 chars |
| `industry` | `industry` | Required, max 100 chars |
| `geography` | `geography` | Required, max 100 chars |
| `businessModel` | `businessModel` | Required, stored as text |
| `revenueStage` | `revenueStage` | Enum: None, Pre-Revenue, Early Revenue, Scaling |
| `description` | `description` | Required, stored as text |
| `website` | `website` | Optional, max 200 chars |
| `linkedinUrl` | `linkedinUrl` | Optional, max 255 chars |
| `twitterUrl` | `twitterUrl` | Optional, max 255 chars |
| `instagramUrl` | `instagramUrl` | Optional, max 255 chars |

---

## 6. Step 3: Team Members

### Endpoints

- **POST** `/api/onboarding/team` - Add team member
- **GET** `/api/onboarding/team` - Get team members
- **PUT** `/api/onboarding/team/:memberId` - Update team member
- **DELETE** `/api/onboarding/team/:memberId` - Delete team member

### Request Body (Add)

```typescript
interface TeamMemberData {
  fullName: string;
  email: string;
  role: string;
  linkedinProfile?: string;
  isTechnical?: boolean;
  experience?: string;
  background?: string;
  isCofounder?: boolean;
  age?: number;
  gender?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  githubUrl?: string;
}
```

### Implementation Logic

```typescript
// server/services/onboarding-service.ts
async addTeamMember(sessionId: string, memberData: any) {
  if (!sessionId || sessionId === 'undefined') {
    throw new Error("Invalid session ID provided");
  }

  const session = await this.getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Get venture from session or database
  let venture = session.stepData?.venture;
  
  if (!venture || !venture.ventureId) {
    // Fallback: get venture by founder ID
    const founderData = session.stepData?.founder;
    if (founderData?.founderId) {
      const ventures = await storage.getVenturesByFounderId(founderData.founderId);
      if (ventures && ventures.length > 0) {
        venture = ventures[0]; // Use most recent venture
      }
    }
  }

  if (!venture || !venture.ventureId) {
    throw new Error("Venture information missing");
  }
  
  // Create team member
  const teamMember = await storage.createTeamMember({
    ...memberData,
    ventureId: venture.ventureId,
  });

  // Send Slack notification (async)
  if (eastEmblemAPI.isConfigured()) {
    eastEmblemAPI
      .sendSlackNotification(
        `\`Onboarding Id : ${sessionId}\`\n👤 Team Member Added - ${memberData.fullName} (${memberData.role})`,
        "#notifications",
        sessionId,
      )
      .catch(console.log);
  }

  return teamMember;
}
```

---

## 7. Step 4: Document Upload

### Endpoint

**POST** `/api/onboarding/upload`

### Request (Multipart Form)

```
Content-Type: multipart/form-data

Fields:
- pitchDeck: File (PDF, PPT, PPTX - max 50MB)
- sessionId: string
- artifactType: string (required)
- description: string (required)
- scoreAwarded: number (optional, default 5)
- categoryId: string (optional)
```

### Multer Configuration

```typescript
// server/routes/onboarding.ts
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate incremented filename to prevent overwrites
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uploadDir = path.join(process.cwd(), "uploads");
      
      let counter = 0;
      let filename = file.originalname;
      
      while (fs.existsSync(path.join(uploadDir, filename))) {
        counter++;
        filename = `${baseName}-${counter}${ext}`;
      }
      
      cb(null, filename);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, PPT, and PPTX allowed."));
    }
  },
});
```

### Implementation Logic

```typescript
// server/services/onboarding-service.ts
async handleDocumentUpload(
  sessionId: string, 
  file: Express.Multer.File,
  metadata: { artifactType: string; description: string; scoreAwarded: number; categoryId?: string }
) {
  const session = await this.getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const stepData = session.stepData as any || {};
  const venture = stepData.venture;
  const folderStructure = stepData.folderStructure;
  
  if (!venture || !venture.ventureId) {
    throw new Error("Venture information missing");
  }

  // Get the folderId for 0_Overview (pitch deck destination)
  const targetFolderId = folderStructure?.folders?.["0_Overview"] || null;

  // Create document_upload record
  const [upload] = await db
    .insert(documentUploadTable)
    .values({
      ventureId: venture.ventureId,
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadStatus: 'pending',
      processingStatus: 'pending',
      folderId: targetFolderId,
      artifactType: metadata.artifactType,
      description: metadata.description,
      scoreAwarded: metadata.scoreAwarded,
      categoryId: metadata.categoryId || null,
      uploadSource: 'onboarding' // Mark for ProofCoach tracking
    })
    .returning();

  // Update session
  await this.updateSession(sessionId, {
    currentStep: "processing",
    stepData: {
      ...(session.stepData as any),
      upload: upload,
    },
    completedSteps: [...(session.completedSteps as any), "upload"],
  });

  // Send Slack notification (async)
  if (eastEmblemAPI.isConfigured()) {
    eastEmblemAPI
      .sendSlackNotification(
        `\`Onboarding Id : ${sessionId}\`\n📄 Document Uploaded - ${file.originalname} (${Math.round(file.size / 1024)}KB)`,
        "#notifications",
        sessionId,
      )
      .catch(console.log);
  }

  return { upload };
}
```

---

## 8. Step 5: Scoring & Processing

### Endpoint

**POST** `/api/onboarding/submit-for-scoring`

### Request Body

```typescript
{
  sessionId: string;
}
```

### Implementation Logic

```typescript
// server/services/onboarding-service.ts
async submitForScoring(sessionId: string) {
  const session = await this.getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const stepData = session.stepData as any || {};
  const upload = stepData.upload;
  const venture = stepData.venture;
  const folderStructure = stepData.folderStructure;
  
  if (!upload) {
    throw new Error("Document upload step not completed");
  }
  
  if (!venture) {
    throw new Error("Venture step not completed");
  }

  let scoringResult = null;

  // Check if we already have scoring results in session
  if (stepData.processing?.scoringResult) {
    scoringResult = stepData.processing.scoringResult;
  } else if (eastEmblemAPI.isConfigured() && upload.filePath) {
    // Read file and process
    if (fs.existsSync(upload.filePath)) {
      const fileBuffer = fs.readFileSync(upload.filePath);
      
      // Step 1: Upload to Box.com
      const targetFolderId = upload.folderId || folderStructure?.folders?.["0_Overview"] || "overview";
      try {
        const uploadResult = await eastEmblemAPI.uploadFile(
          fileBuffer,
          upload.fileName,
          targetFolderId,
          sessionId,
          true // allowShare
        );
        
        // Update document_upload with Box.com data
        if (uploadResult) {
          await db
            .update(documentUploadTable)
            .set({
              sharedUrl: uploadResult.url,
              folderId: uploadResult.folderId,
              eastemblemFileId: uploadResult.id,
              fileSize: uploadResult.size || upload.fileSize,
              mimeType: getMimeTypeFromExtension(uploadResult.name || upload.fileName),
              uploadStatus: 'completed',
              processingStatus: 'processing'
            })
            .where(eq(documentUploadTable.uploadId, upload.uploadId));
        }
      } catch (uploadError) {
        console.log("Box.com upload failed, proceeding with scoring:", uploadError.message);
      }

      // Step 2: Score the pitch deck
      scoringResult = await eastEmblemAPI.scorePitchDeck(
        fileBuffer,
        upload.fileName,
        sessionId
      );

      // Step 3: Validate scoring result
      const expectedFounderName = stepData?.founder?.fullName;
      const expectedVentureName = stepData?.venture?.name;
      
      if (expectedFounderName || expectedVentureName) {
        const validationResult = this.validateScoringResponse(
          scoringResult, 
          expectedFounderName, 
          expectedVentureName
        );
        
        if (!validationResult.isValid) {
          // Update document record with validation error
          await db
            .update(documentUploadTable)
            .set({
              processingStatus: 'failed',
              errorMessage: validationResult.message,
              retryCount: (upload.retryCount || 0) + 1,
              canRetry: true
            })
            .where(eq(documentUploadTable.uploadId, upload.uploadId));
          
          // Create validation error result
          scoringResult = {
            hasError: true,
            errorMessage: validationResult.message,
            errorType: 'validation_failed',
            canRetry: true,
            missingData: validationResult.missingData,
            statusCode: 400
          };
        }
      }
    } else {
      throw new Error("Uploaded file no longer exists");
    }
  } else if (!eastEmblemAPI.isConfigured()) {
    throw new Error("EastEmblem API is not configured.");
  }

  // Handle error results
  if (scoringResult?.hasError) {
    return {
      scoringResult,
      hasError: true,
      errorMessage: scoringResult.errorMessage,
      canRetry: scoringResult.canRetry || false
    };
  }

  // Clean up uploaded file after successful analysis
  if (upload.filePath && fs.existsSync(upload.filePath)) {
    fs.unlinkSync(upload.filePath);
  }

  // Extract and add team members from scoring result
  if (scoringResult?.output?.team && Array.isArray(scoringResult.output.team)) {
    const existingMembers = await storage.getTeamMembersByVentureId(venture.ventureId);
    const existingNames = existingMembers.map(m => m.fullName.toLowerCase());
    
    for (const teamMember of scoringResult.output.team) {
      if (!existingNames.includes(teamMember.name?.toLowerCase())) {
        await storage.createTeamMember({
          ventureId: venture.ventureId,
          fullName: teamMember.name || 'Unknown',
          role: teamMember.role || 'Team Member',
          isTechnical: teamMember.role?.toLowerCase().includes('cto'),
          experience: teamMember.experience || teamMember.background || '',
          isCofounder: teamMember.role?.toLowerCase().includes('founder'),
          // Other fields default
        });
      }
    }
  }

  // Update session as complete
  await this.updateSession(sessionId, {
    currentStep: "complete",
    stepData: {
      ...(session.stepData as any),
      scoringResult,
      processing: {
        scoringResult,
        isComplete: true
      }
    },
    completedSteps: [...session.completedSteps, "scoring"],
    isComplete: true,
  });

  // Post-processing: Update database records
  const totalScore = scoringResult?.output?.total_score || 0;
  const extractedTags = scoringResult?.output?.tags || [];
  
  // Calculate dimension scores
  const dimensionScores = {
    desirability: (scoringResult?.output?.problem?.score || 0) + 
                  (scoringResult?.output?.market_opportunity?.score || 0),
    feasibility: (scoringResult?.output?.solution?.score || 0) + 
                 (scoringResult?.output?.product_technology?.score || 0),
    viability: (scoringResult?.output?.business_model?.score || 0) + 
               (scoringResult?.output?.financials_projections_ask?.score || 0),
    traction: (scoringResult?.output?.traction?.score || 0) + 
              (scoringResult?.output?.go_to_market_strategy?.score || 0),
    readiness: (scoringResult?.output?.readiness?.score || 0) + 
               (scoringResult?.output?.team?.score || 0),
  };

  // Create/update leaderboard entry
  const existingEntry = await storage.getLeaderboardByVentureId(venture.ventureId);
  if (existingEntry) {
    if (totalScore > existingEntry.totalScore) {
      await storage.updateLeaderboard(existingEntry.leaderboardId, {
        totalScore,
        proofTagsCount: extractedTags.length,
        dimensionScores,
        analysisDate: new Date(),
      });
    }
  } else {
    await storage.createLeaderboardEntry({
      ventureId: venture.ventureId,
      ventureName: venture.name,
      totalScore,
      proofTagsCount: extractedTags.length,
      dimensionScores,
      analysisDate: new Date(),
    });
  }

  // Create evaluation record
  await storage.createEvaluation({
    ventureId: venture.ventureId,
    evaluationDate: new Date().toISOString().split('T')[0],
    proofscore: totalScore,
    prooftags: extractedTags,
    fullApiResponse: scoringResult,
    dimensionScores: dimensionScores,
    folderId: folderStructure?.id || null,
    folderUrl: folderStructure?.url || null,
    isCurrent: true,
  });

  // Update venture with ProofScore, VaultScore, ProofTags
  const founderStage = scoringResult?.founder_stage || 
                       scoringResult?.output?.founder_stage;
  
  await storage.updateVenture(venture.ventureId, {
    growthStage: founderStage,
    proofScore: totalScore,
    vaultScore: 0, // Initial value
    prooftags: extractedTags,
    status: 'done',
    updatedAt: new Date()
  });

  // Log activity events for ProofCoach
  const founderId = stepData?.founder?.founderId || stepData?.founderId;
  if (founderId) {
    await ActivityService.logActivity(
      { founderId, ventureId: venture.ventureId },
      {
        activityType: 'venture',
        action: COACH_EVENTS.PROOFSCORE_RECEIVED,
        title: `ProofScore Received: ${totalScore}`,
        description: `Received initial ProofScore of ${totalScore}`,
        metadata: { proofScore: totalScore, growthStage: founderStage },
        entityId: venture.ventureId,
        entityType: 'venture',
      }
    );
    
    // Emit milestone events based on score thresholds
    if (totalScore >= 80) {
      await ActivityService.logActivity(/* PROOFSCORE_80_REACHED */);
    }
    if (totalScore >= 70) {
      await ActivityService.logActivity(/* PROOFSCORE_70_REACHED */);
    }
    if (totalScore >= 65) {
      await ActivityService.logActivity(/* PROOFSCORE_65_REACHED */);
    }
  }

  return {
    scoringResult,
    hasError: false
  };
}
```

### Scoring Response Structure

```typescript
interface ScoringResult {
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
    tags: string[];
  };
  founder_stage?: string;
}
```

---

## 9. Step 6: Certificate Generation

### Standalone Function

```typescript
// server/routes/certificate.ts
export async function createCertificateForSession(sessionId: string) {
  try {
    // Get session data
    const [sessionData] = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.sessionId, sessionId));

    if (!sessionData) {
      throw new Error('Session not found');
    }

    const stepData = sessionData.stepData as any;
    
    // Check if certificate already exists
    if (stepData?.processing?.certificateUrl) {
      const existingUrl = stepData.processing.certificateUrl;
      
      // Update database with existing URL
      const ventureId = stepData?.venture?.ventureId;
      if (ventureId) {
        await db
          .update(venture)
          .set({
            certificateUrl: existingUrl,
            certificateGeneratedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(venture.ventureId, ventureId));
      }
      
      return {
        success: true,
        certificateUrl: existingUrl,
        message: "Certificate already exists"
      };
    }

    // Validate scoring data exists
    if (!stepData?.processing?.scoringResult) {
      throw new Error('No scoring data available');
    }

    const scoringResult = stepData.processing.scoringResult;
    const totalScore = scoringResult.output?.total_score || 0;
    const folderStructure = stepData.folderStructure;
    const overviewFolderId = folderStructure?.folders?.["0_Overview"];

    if (!overviewFolderId || totalScore <= 0) {
      throw new Error('Invalid scoring data or folder structure');
    }

    // Create certificate via EastEmblem API
    const certificateResult = await eastEmblemAPI.createCertificate(
      overviewFolderId,
      totalScore,
      sessionId,
      false // isCourseComplete - false for onboarding
    );

    if (!certificateResult.url) {
      throw new Error('Certificate creation failed');
    }

    // Update session with certificate URL
    const updatedStepData = {
      ...stepData,
      processing: {
        ...stepData.processing,
        certificateUrl: certificateResult.url,
        certificateGeneratedAt: new Date().toISOString()
      }
    };

    await db
      .update(onboardingSession)
      .set({
        stepData: updatedStepData,
        updatedAt: new Date()
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Create document_upload record for certificate
    const ventureId = stepData?.venture?.ventureId;
    if (ventureId) {
      await db.insert(documentUpload).values({
        ventureId: ventureId,
        fileName: certificateResult.name || 'validation_certificate.pdf',
        originalName: certificateResult.name || 'validation_certificate.pdf',
        filePath: '/generated/certificate.pdf',
        fileSize: certificateResult.size || 1024000,
        mimeType: 'application/pdf',
        uploadStatus: 'completed',
        processingStatus: 'completed',
        sharedUrl: certificateResult.url,
        folderId: certificateResult.folderId || overviewFolderId,
        eastemblemFileId: certificateResult.id
      });
      
      // Update venture table
      await db
        .update(venture)
        .set({
          certificateUrl: certificateResult.url,
          certificateGeneratedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(venture.ventureId, ventureId));
      
      // Log activity event
      if (sessionData.founderId) {
        await ActivityService.logActivity(
          { founderId: sessionData.founderId, ventureId },
          {
            activityType: 'document',
            action: COACH_EVENTS.CERTIFICATE_DOWNLOADED,
            title: 'Certificate Downloaded',
            description: 'Downloaded ProofScore validation certificate',
            metadata: { certificateUrl: certificateResult.url },
            entityId: ventureId,
            entityType: 'venture'
          }
        );
      }
    }

    return {
      success: true,
      certificateUrl: certificateResult.url,
      message: "Certificate created successfully"
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

---

## 10. Step 7: Report Generation

### Standalone Function

```typescript
// server/routes/report.ts
export async function createReportForSession(sessionId: string) {
  try {
    // Get session data
    const [sessionData] = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.sessionId, sessionId));

    if (!sessionData) {
      throw new Error('Session not found');
    }

    const stepData = sessionData.stepData as any;

    // Check if report already exists
    if (stepData?.processing?.reportUrl) {
      return {
        success: true,
        reportUrl: stepData.processing.reportUrl,
        message: "Report already exists"
      };
    }

    // Validate scoring data
    if (!stepData?.processing?.scoringResult) {
      throw new Error('No scoring data available');
    }

    const scoringResult = stepData.processing.scoringResult;
    const venture = stepData.venture;
    const folderStructure = stepData.folderStructure;

    // Build report data structure
    const reportData = {
      onboarding_id: sessionId,
      folder_id: folderStructure?.id || '',
      venture_name: venture?.name || 'Unknown',
      founder_stage: scoringResult.founder_stage || 'Early Stage',
      business_model_type: venture?.businessModel || 'B2B',
      milestone: venture?.revenueStage || 'Pre-revenue',
      
      // Map scoring dimensions
      desirability: {
        score: scoringResult.output?.Problem?.score || 0,
        summary: scoringResult.output?.Problem?.justification || '',
        justification: scoringResult.output?.Problem?.justification || '',
        related_slides: scoringResult.output?.Problem?.related_slides || [],
        recommendation: scoringResult.output?.Problem?.recommendation || '',
        proofTags: []
      },
      feasibility: {
        score: scoringResult.output?.product_technology?.score || 0,
        summary: scoringResult.output?.product_technology?.justification || '',
        justification: scoringResult.output?.product_technology?.justification || '',
        related_slides: scoringResult.output?.product_technology?.related_slides || [],
        recommendation: scoringResult.output?.product_technology?.recommendation || '',
        proofTags: []
      },
      viability: {
        score: scoringResult.output?.business_model?.score || 0,
        summary: scoringResult.output?.business_model?.justification || '',
        justification: scoringResult.output?.business_model?.justification || '',
        related_slides: scoringResult.output?.business_model?.related_slides || [],
        recommendation: scoringResult.output?.business_model?.recommendation || '',
        proofTags: []
      },
      traction: {
        score: scoringResult.output?.traction_milestones?.score || 0,
        summary: scoringResult.output?.traction_milestones?.justification || '',
        justification: scoringResult.output?.traction_milestones?.justification || '',
        related_slides: scoringResult.output?.traction_milestones?.related_slides || [],
        recommendation: scoringResult.output?.traction_milestones?.recommendation || '',
        proofTags: [],
        bonus_applied: { description: '', score: '0' },
        signals: []
      },
      readiness: {
        score: scoringResult.output?.team?.score || 0,
        summary: scoringResult.output?.team?.justification || '',
        justification: scoringResult.output?.team?.justification || '',
        related_slides: scoringResult.output?.team?.related_slides || [],
        recommendation: scoringResult.output?.team?.recommendation || '',
        proofTags: []
      },
      
      total_score: scoringResult.output?.total_score || 0,
      tags: scoringResult.output?.tags || [],
      highlights: {
        intro: `Analysis of ${venture?.name || 'venture'}`,
        key_highlights: scoringResult.output?.overall_feedback?.join('. ') || '',
        summary: `ProofScore: ${scoringResult.output?.total_score || 0}`
      },
      conclusion: 'Based on the analysis...',
      recommendations: scoringResult.output?.overall_feedback?.join('. ') || ''
    };

    // Create report via EastEmblem API
    const reportResult = await eastEmblemAPI.createReport(reportData);

    if (!reportResult.url) {
      throw new Error('Report creation failed');
    }

    // Update session with report URL
    const updatedStepData = {
      ...stepData,
      processing: {
        ...stepData.processing,
        reportUrl: reportResult.url,
        reportGeneratedAt: new Date().toISOString()
      }
    };

    await db
      .update(onboardingSession)
      .set({
        stepData: updatedStepData,
        updatedAt: new Date()
      })
      .where(eq(onboardingSession.sessionId, sessionId));

    // Create document_upload record and update venture
    const ventureId = venture?.ventureId;
    if (ventureId) {
      await db.insert(documentUpload).values({
        ventureId: ventureId,
        fileName: 'analysis_report.pdf',
        originalName: 'analysis_report.pdf',
        filePath: '/generated/report.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        uploadStatus: 'completed',
        processingStatus: 'completed',
        sharedUrl: reportResult.url,
        folderId: folderStructure?.folders?.["0_Overview"] || null,
        eastemblemFileId: reportResult.id
      });
      
      await db
        .update(venture)
        .set({
          reportUrl: reportResult.url,
          reportGeneratedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(venture.ventureId, ventureId));
    }

    return {
      success: true,
      reportUrl: reportResult.url,
      message: "Report created successfully"
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

---

## 11. Step 8: Email Notification

### Implementation

```typescript
// server/services/onboarding-service.ts
async sendEmailNotification(
  sessionId: string, 
  stepData: any, 
  certificateUrl?: string, 
  reportUrl?: string
) {
  try {
    const founder = stepData.founder?.founder || stepData.founder;
    const venture = stepData.venture?.venture || stepData.venture;

    // Get URLs from session or parameters
    let latestCertificateUrl = certificateUrl || stepData.processing?.certificateUrl;
    let latestReportUrl = reportUrl || stepData.processing?.reportUrl;
    
    // Fallback to server endpoints if URLs not in session
    const baseUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    if (!latestCertificateUrl || !latestReportUrl) {
      latestCertificateUrl = latestCertificateUrl || `${baseUrl}/api/download/certificate?sessionId=${sessionId}`;
      latestReportUrl = latestReportUrl || `${baseUrl}/api/download/report?sessionId=${sessionId}`;
    }

    // Extract founder name
    let founderName = 'Founder';
    if (founder?.firstName) {
      founderName = founder.firstName;
    } else if (founder?.fullName) {
      founderName = founder.fullName.split(' ')[0];
    }

    // Validate required fields
    if (!founderName || !founder?.email || !venture?.name) {
      console.error("Missing required email fields");
      return;
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    // Update founder with verification token
    await db
      .update(founderTable)
      .set({
        verificationToken,
        verificationTokenExpiry: generateTokenExpiry(24 * 7), // 7 days
        updatedAt: new Date()
      })
      .where(eq(founderTable.email, founder.email));

    // Build email data
    const emailData: EmailNotificationData = {
      type: "validation_complete",
      name: founderName,
      email: founder.email,
      subject: `Your ProofScore for ${venture.name}`,
      certificate: latestCertificateUrl,
      report: latestReportUrl,
      verificationUrl: verificationUrl
    };

    // Send email via EastEmblem API
    await eastEmblemAPI.sendEmail(emailData);

    // Log activity
    if (founder.founderId) {
      await ActivityService.logActivity(
        { founderId: founder.founderId, ventureId: venture.ventureId },
        {
          activityType: 'notification',
          action: 'email_sent',
          title: 'Validation Email Sent',
          description: `Email sent to ${founder.email}`,
          metadata: { emailType: 'validation_complete' },
          entityId: venture.ventureId,
          entityType: 'venture'
        }
      );
    }

  } catch (error) {
    console.error("Email notification error:", error);
    // Don't fail the entire process if email fails
  }
}
```

---

## 12. Database Schema

### Key Tables

```sql
-- Onboarding Sessions
CREATE TABLE onboarding_session (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  current_step VARCHAR(50) DEFAULT 'founder',
  step_data JSONB DEFAULT '{}',
  completed_steps TEXT[] DEFAULT '{}',
  is_complete BOOLEAN DEFAULT FALSE,
  founder_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Founders
CREATE TABLE founder (
  founder_id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(100),
  is_technical BOOLEAN DEFAULT FALSE,
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  verification_token VARCHAR(255),
  verification_token_expiry TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ventures
CREATE TABLE venture (
  venture_id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id VARCHAR(255) REFERENCES founder(founder_id),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  geography VARCHAR(100),
  mvp_status VARCHAR(50),
  revenue_stage VARCHAR(50),
  description TEXT,
  folder_structure JSONB,
  proof_score INTEGER DEFAULT 0,
  vault_score INTEGER DEFAULT 0,
  prooftags TEXT[] DEFAULT '{}',
  growth_stage VARCHAR(100),
  certificate_url TEXT,
  certificate_generated_at TIMESTAMP,
  report_url TEXT,
  report_generated_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Document Uploads
CREATE TABLE document_upload (
  upload_id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id VARCHAR(255) REFERENCES venture(venture_id),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_path TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  upload_status VARCHAR(50) DEFAULT 'pending',
  processing_status VARCHAR(50) DEFAULT 'pending',
  folder_id VARCHAR(255),
  shared_url TEXT,
  eastemblem_file_id VARCHAR(255),
  artifact_type VARCHAR(100),
  description TEXT,
  score_awarded INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  can_retry BOOLEAN DEFAULT TRUE,
  upload_source VARCHAR(50), -- 'onboarding' or 'proof-vault'
  created_at TIMESTAMP DEFAULT NOW()
);

-- ProofVault
CREATE TABLE proof_vault (
  id SERIAL PRIMARY KEY,
  venture_id VARCHAR(255) REFERENCES venture(venture_id),
  artefact_type VARCHAR(100),
  parent_folder_id VARCHAR(255),
  sub_folder_id VARCHAR(255),
  shared_url TEXT,
  folder_name VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 13. Error Handling

### Error Types

| Error Type | HTTP Code | User Message | Retryable |
|------------|-----------|--------------|-----------|
| Session not found | 404 | Session expired or invalid | No |
| Email already taken | 400 | Email is already registered | No |
| Validation failed | 400 | Document missing required info | Yes |
| File type invalid | 400 | Only PDF, PPT, PPTX allowed | Yes |
| File too large | 400 | File exceeds 50MB limit | Yes |
| API timeout | 504 | Analysis taking longer than expected | Yes |
| API error | 500 | Service temporarily unavailable | Yes |

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
  };
  canRetry?: boolean;
}
```

---

## 14. Activity Tracking

### Coach Events

All onboarding milestones are tracked via the ActivityService:

```typescript
// Tracked Events
PROOFSCORE_RECEIVED          // Initial score calculated
PROOFSCORE_65_REACHED        // Score threshold milestone
PROOFSCORE_70_REACHED        // Deal Room unlock threshold
PROOFSCORE_80_REACHED        // Investment ready threshold
CERTIFICATE_DOWNLOADED       // Certificate generated
REPORT_DOWNLOADED            // Report generated
ONBOARDING_COMPLETED         // Full flow completed
```

### Activity Log Structure

```typescript
await ActivityService.logActivity(
  { founderId, ventureId },
  {
    activityType: 'venture' | 'document' | 'notification',
    action: string,           // Event name from COACH_EVENTS
    title: string,            // Human-readable title
    description: string,      // Detailed description
    metadata: object,         // Additional context
    entityId: string,         // Related entity ID
    entityType: string        // Entity type
  }
);
```

---

*End of Onboarding Flow Implementation Guide*
