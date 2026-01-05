# Platform Workflows Documentation

## Wishlist, Leaderboard, and User Activity Systems

**Version:** 1.0  
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [ProofScaling Wishlist Workflow](#2-proofscaling-wishlist-workflow)
3. [Leaderboard Workflow](#3-leaderboard-workflow)
4. [User Activity Workflow](#4-user-activity-workflow)
5. [Coach Events Integration](#5-coach-events-integration)
6. [Database Schema Reference](#6-database-schema-reference)
7. [Multi-Tenant Considerations](#7-multi-tenant-considerations)

---

## 1. Overview

This document covers three critical platform workflows:

| Workflow | Purpose | Key Tables |
|----------|---------|------------|
| **Wishlist** | Capture interest for ProofScaling cohort program | `proof_scaling_wishlist` |
| **Leaderboard** | Track and rank venture ProofScores | `leaderboard`, `venture` |
| **User Activity** | Event-sourced activity tracking for analytics and ProofCoach | `user_activity`, `coach_state` |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PLATFORM WORKFLOWS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │  WISHLIST   │    │ LEADERBOARD │    │     USER ACTIVITY       │  │
│  │  Workflow   │    │  Workflow   │    │       Workflow          │  │
│  └──────┬──────┘    └──────┬──────┘    └───────────┬─────────────┘  │
│         │                  │                       │                 │
│         ▼                  ▼                       ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │proof_scaling│    │ leaderboard │    │     user_activity       │  │
│  │  _wishlist  │    │   table     │    │        table            │  │
│  └─────────────┘    └──────┬──────┘    └───────────┬─────────────┘  │
│                            │                       │                 │
│                            ▼                       ▼                 │
│                     ┌─────────────┐    ┌─────────────────────────┐  │
│                     │   venture   │    │ CoachProgressService    │  │
│                     │   table     │    │     (aggregation)       │  │
│                     └─────────────┘    └───────────┬─────────────┘  │
│                                                    │                 │
│                                                    ▼                 │
│                                        ┌─────────────────────────┐  │
│                                        │      coach_state        │  │
│                                        │   (materialized view)   │  │
│                                        └─────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. ProofScaling Wishlist Workflow

### Purpose

The ProofScaling Wishlist captures interest from potential cohort participants who want to join the ProofScaling residency program. It collects contact information and organization details for future outreach.

### Database Schema

```typescript
// shared/schema.ts
export const organizationStageEnum = pgEnum('organization_stage', [
  'Idea Stage',
  'Pre-Product',
  'MVP',
  'Early Traction',
  'Growth Stage',
  'Scaling'
]);

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
```

### SQL Schema

```sql
CREATE TYPE organization_stage AS ENUM (
  'Idea Stage',
  'Pre-Product',
  'MVP',
  'Early Traction',
  'Growth Stage',
  'Scaling'
);

CREATE TABLE proof_scaling_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  role VARCHAR(100) NOT NULL,
  organization_stage organization_stage NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_wishlist_email ON proof_scaling_wishlist(email);
CREATE INDEX idx_wishlist_created ON proof_scaling_wishlist(created_at);
```

### TypeScript Types

```typescript
// Types
export type ProofScalingWishlist = typeof proofScalingWishlist.$inferSelect;
export type InsertProofScalingWishlist = typeof proofScalingWishlist.$inferInsert;

// Validation Schema
export const insertProofScalingWishlistSchema = createInsertSchema(proofScalingWishlist, {
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address").max(100),
  phoneNumber: z.string()
    .min(8, "Please enter a complete phone number")
    .max(20)
    .refine((val) => {
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 7;
    }, "Please enter a complete phone number with area code"),
  companyName: z.string().min(1, "Company name is required").max(200),
  role: z.string().min(1, "Role is required").max(100),
  organizationStage: z.enum([
    'Idea Stage',
    'Pre-Product',
    'MVP',
    'Early Traction',
    'Growth Stage',
    'Scaling'
  ])
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
```

### API Endpoints

#### POST /api/proofscaling-wishlist

Join the wishlist.

**Request:**
```typescript
interface WishlistRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  role: string;
  organizationStage: 'Idea Stage' | 'Pre-Product' | 'MVP' | 'Early Traction' | 'Growth Stage' | 'Scaling';
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "message": "Successfully joined the ProofScaling waitlist"
  },
  "message": "Wishlist entry created successfully"
}
```

**Response (Email Exists - 409):**
```json
{
  "success": false,
  "error": "Email already exists in the waitlist"
}
```

**Implementation:**
```typescript
// server/routes/proofscaling-wishlist.ts
router.post("/", asyncHandler(async (req, res) => {
  try {
    // Validate the request body
    const validatedData = insertProofScalingWishlistSchema.parse(req.body);
    
    // Check if email already exists
    const emailExists = await storage.checkProofScalingWishlistEmailExists(validatedData.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: "Email already exists in the waitlist"
      });
    }
    
    // Create the wishlist entry
    const wishlistEntry = await storage.createProofScalingWishlistEntry(validatedData);
    
    appLogger.business(`New ProofScaling wishlist entry created: ${validatedData.email}`, {
      fullName: validatedData.fullName,
      companyName: validatedData.companyName,
      organizationStage: validatedData.organizationStage
    });
    
    res.json(createSuccessResponse({
      id: wishlistEntry.id,
      message: "Successfully joined the ProofScaling waitlist"
    }, "Wishlist entry created successfully"));
    
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: "Invalid form data",
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to join waitlist"
    });
  }
}));
```

#### GET /api/proofscaling-wishlist

Get all wishlist entries (admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "uuid",
        "fullName": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+1234567890",
        "companyName": "Startup Inc",
        "role": "CEO",
        "organizationStage": "MVP",
        "createdAt": "2024-12-01T10:00:00Z",
        "updatedAt": "2024-12-01T10:00:00Z"
      }
    ],
    "total": 1
  },
  "message": "Wishlist entries retrieved successfully"
}
```

### Storage Methods

```typescript
// server/storage.ts
interface IStorage {
  getProofScalingWishlistEntry(id: string): Promise<ProofScalingWishlist | undefined>;
  getAllProofScalingWishlistEntries(): Promise<ProofScalingWishlist[]>;
  createProofScalingWishlistEntry(entry: InsertProofScalingWishlist): Promise<ProofScalingWishlist>;
  checkProofScalingWishlistEmailExists(email: string): Promise<boolean>;
}

// Implementation
async getProofScalingWishlistEntry(id: string): Promise<ProofScalingWishlist | undefined> {
  const [wishlistEntry] = await db
    .select()
    .from(proofScalingWishlist)
    .where(eq(proofScalingWishlist.id, id));
  return wishlistEntry;
}

async getAllProofScalingWishlistEntries(): Promise<ProofScalingWishlist[]> {
  return db
    .select()
    .from(proofScalingWishlist)
    .orderBy(desc(proofScalingWishlist.createdAt));
}

async createProofScalingWishlistEntry(entry: InsertProofScalingWishlist): Promise<ProofScalingWishlist> {
  const [wishlistEntry] = await db
    .insert(proofScalingWishlist)
    .values(entry)
    .returning();
  return wishlistEntry;
}

async checkProofScalingWishlistEmailExists(email: string): Promise<boolean> {
  const [existingEntry] = await db
    .select({ id: proofScalingWishlist.id })
    .from(proofScalingWishlist)
    .where(eq(proofScalingWishlist.email, email));
  return !!existingEntry;
}
```

### Frontend Integration

```typescript
// client/src/components/features/sales/wishlist-form.tsx
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

function WishlistForm() {
  const joinWishlist = useMutation({
    mutationFn: async (data: WishlistFormData) => {
      return apiRequest('/api/proofscaling-wishlist', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "You've joined the waitlist." });
    },
    onError: (error) => {
      if (error.message.includes('409')) {
        toast({ title: "Already registered", description: "This email is already on our waitlist." });
      } else {
        toast({ title: "Error", description: "Failed to join waitlist. Please try again." });
      }
    }
  });
  
  // Form implementation...
}
```

---

## 3. Leaderboard Workflow

### Purpose

The Leaderboard tracks and ranks ventures by their ProofScore, enabling founders to see how their validation progress compares to other startups on the platform.

### Database Schema

```typescript
// shared/schema.ts
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
export const leaderboardRelations = relations(leaderboard, ({ one }) => ({
  venture: one(venture, {
    fields: [leaderboard.ventureId],
    references: [venture.ventureId],
  }),
}));
```

### SQL Schema

```sql
CREATE TABLE leaderboard (
  leaderboard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES venture(venture_id),
  venture_name VARCHAR(255) NOT NULL,
  total_score INTEGER NOT NULL,
  proof_tags_count INTEGER NOT NULL DEFAULT 0,
  dimension_scores JSONB,
  analysis_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);
CREATE INDEX idx_leaderboard_venture ON leaderboard(venture_id);
CREATE INDEX idx_leaderboard_date ON leaderboard(analysis_date DESC);
```

### TypeScript Types

```typescript
// Types
export type Leaderboard = typeof leaderboard.$inferSelect;
export type InsertLeaderboard = typeof leaderboard.$inferInsert;

// Dimension Scores Interface
interface DimensionScores {
  desirability: number;  // Problem + Market Opportunity scores
  feasibility: number;   // Solution + Product/Technology scores
  viability: number;     // Business Model + Financials scores
  traction: number;      // Traction + Go-to-Market scores
  readiness: number;     // Team + Readiness scores
}
```

### API Endpoints

#### GET /api/leaderboard

Get leaderboard rankings.

**Query Parameters:**
- `limit` (optional): Number of entries to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ventureName": "TechNova Solutions",
      "totalScore": 94,
      "proofTagsCount": 6,
      "rank": 1,
      "analysisDate": "2024-12-01T10:00:00Z",
      "isReal": true
    },
    {
      "ventureName": "GreenWave Dynamics",
      "totalScore": 91,
      "proofTagsCount": 5,
      "rank": 2,
      "analysisDate": "2024-11-30T15:00:00Z",
      "isReal": true
    }
  ],
  "source": "real",
  "totalEntries": 10,
  "realEntries": 10,
  "mockEntries": 0
}
```

**Implementation:**
```typescript
// server/routes/leaderboard.ts
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get real leaderboard data
    const realData = await storage.getLeaderboard(50);
    
    // Format real data
    const formattedRealData = realData.map((entry, index) => ({
      ventureName: entry.ventureName,
      totalScore: entry.totalScore,
      proofTagsCount: entry.proofTagsCount || 0,
      rank: index + 1,
      analysisDate: entry.analysisDate,
      isReal: true
    }));
    
    let finalData = [...formattedRealData];
    
    // Add mock data if needed to fill gaps
    if (finalData.length < limit) {
      const needed = limit - finalData.length;
      const realVentureNames = new Set(
        formattedRealData.map(entry => entry.ventureName.toLowerCase())
      );
      
      // Filter and adjust mock entries
      const mockEntries = mockLeaderboardData
        .filter(mock => !realVentureNames.has(mock.ventureName.toLowerCase()))
        .slice(0, needed)
        .map((mock, i) => {
          const lowestRealScore = formattedRealData.length > 0 
            ? Math.min(...formattedRealData.map(e => e.totalScore))
            : 100;
          
          return {
            ventureName: mock.ventureName,
            totalScore: Math.max(lowestRealScore - 1 - i, 50),
            proofTagsCount: Math.floor(Math.max(lowestRealScore - 1 - i, 50) / 15),
            rank: finalData.length + 1 + i,
            analysisDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
            isReal: false
          };
        });
      
      finalData = [...finalData, ...mockEntries];
    }
    
    // Sort by score and reassign ranks
    finalData.sort((a, b) => b.totalScore - a.totalScore);
    finalData = finalData.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    res.json({
      success: true,
      data: finalData,
      source: formattedRealData.length === finalData.length ? 'real' : 'mixed',
      totalEntries: finalData.length,
      realEntries: formattedRealData.length,
      mockEntries: finalData.length - formattedRealData.length
    });
  } catch (error) {
    appLogger.business("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard"
    });
  }
}
```

#### POST /api/leaderboard

Create leaderboard entry (internal use after scoring).

**Request:**
```typescript
interface CreateLeaderboardRequest {
  ventureId: string;    // UUID
  ventureName: string;
  totalScore: number;   // 0-100
  proofTagsCount?: number;
  dimensionScores?: {
    desirability: number;
    feasibility: number;
    viability: number;
    traction: number;
    readiness: number;
  };
}
```

**Validation Schema:**
```typescript
const createSchema = z.object({
  ventureId: z.string().uuid(),
  ventureName: z.string(),
  totalScore: z.number().min(0).max(100),
  proofTagsCount: z.number().min(0).optional().default(0),
  dimensionScores: z.object({
    desirability: z.number(),
    feasibility: z.number(),
    viability: z.number(),
    traction: z.number(),
    readiness: z.number(),
  }).optional()
});
```

### Storage Methods

```typescript
// server/storage.ts
interface IStorage {
  getLeaderboard(limit?: number): Promise<Leaderboard[]>;
  createLeaderboardEntry(entry: InsertLeaderboard): Promise<Leaderboard>;
  getLeaderboardByVentureId(ventureId: string): Promise<Leaderboard | undefined>;
  updateLeaderboard(id: string, entry: Partial<InsertLeaderboard>): Promise<Leaderboard>;
}

// Implementation
async getLeaderboard(limit: number = 10): Promise<Leaderboard[]> {
  return db
    .select()
    .from(leaderboard)
    .orderBy(desc(leaderboard.totalScore))
    .limit(limit);
}

async createLeaderboardEntry(insertLeaderboard: InsertLeaderboard): Promise<Leaderboard> {
  const [leaderboardRecord] = await db
    .insert(leaderboard)
    .values(insertLeaderboard)
    .returning();
  return leaderboardRecord;
}

async getLeaderboardByVentureId(ventureId: string): Promise<Leaderboard | undefined> {
  const [leaderboardRecord] = await db
    .select()
    .from(leaderboard)
    .where(eq(leaderboard.ventureId, ventureId));
  return leaderboardRecord;
}

async updateLeaderboard(id: string, updateEntry: Partial<InsertLeaderboard>): Promise<Leaderboard> {
  const [leaderboardRecord] = await db
    .update(leaderboard)
    .set(updateEntry)
    .where(eq(leaderboard.leaderboardId, id))
    .returning();
  return leaderboardRecord;
}
```

### Leaderboard Creation Flow (During Onboarding)

The leaderboard entry is created automatically after successful pitch deck scoring:

```typescript
// server/services/onboarding-service.ts (submitForScoring method)

// After scoring is complete...
if (scoringResult && venture) {
  const totalScore = scoringResult?.output?.total_score || 0;
  const extractedTags = scoringResult?.output?.tags || [];
  
  // Calculate dimension scores from API response
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

  // Check if leaderboard entry already exists
  const existingEntry = await storage.getLeaderboardByVentureId(venture.ventureId);
  
  if (existingEntry) {
    // Update only if new score is higher
    if (totalScore > existingEntry.totalScore) {
      await storage.updateLeaderboard(existingEntry.leaderboardId, {
        totalScore,
        proofTagsCount: extractedTags.length,
        dimensionScores,
        analysisDate: new Date(),
      });
    }
  } else {
    // Create new leaderboard entry
    await storage.createLeaderboardEntry({
      ventureId: venture.ventureId,
      ventureName: venture.name,
      totalScore,
      proofTagsCount: extractedTags.length,
      dimensionScores,
      analysisDate: new Date(),
    });
  }
}
```

### Mock Data Strategy

When real data is insufficient, mock entries are added to maintain a full leaderboard:

```typescript
const mockLeaderboardData = [
  { ventureName: "TechNova Solutions", totalScore: 94, isReal: false },
  { ventureName: "GreenWave Dynamics", totalScore: 91, isReal: false },
  { ventureName: "QuantumLeap Analytics", totalScore: 89, isReal: false },
  { ventureName: "EcoSmart Innovations", totalScore: 87, isReal: false },
  { ventureName: "DataFlow Systems", totalScore: 85, isReal: false },
  { ventureName: "NeuroTech Labs", totalScore: 83, isReal: false },
  { ventureName: "CloudBridge Networks", totalScore: 81, isReal: false },
  { ventureName: "BioGen Therapeutics", totalScore: 79, isReal: false },
  { ventureName: "SmartGrid Energy", totalScore: 77, isReal: false },
  { ventureName: "CyberShield Security", totalScore: 75, isReal: false }
];
```

**Mock Data Rules:**
1. Mock scores are always lower than the lowest real score
2. Mock venture names are filtered to prevent conflicts
3. ProofTags count is calculated: `Math.floor(score / 15)`
4. Minimum score for mock entries is 50

---

## 4. User Activity Workflow

### Purpose

The User Activity system provides event-sourced tracking for:
- User journey analytics
- ProofCoach milestone tracking
- Audit trail for platform actions
- Dashboard activity feed

### Database Schema

```typescript
// shared/schema.ts
export const activityTypeEnum = pgEnum('activity_type', [
  'account',        // Account creation, verification, login
  'venture',        // Venture creation, updates
  'document',       // File uploads, downloads
  'evaluation',     // ProofScore activities
  'authentication', // Login, logout, password changes
  'navigation',     // Page visits, feature usage
  'payment',        // Payment activities
  'validation',     // Validation map / experiment activities
  'system'          // System events, notifications
]);

export const userActivity = pgTable("user_activity", {
  activityId: uuid("activity_id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId),
  ventureId: uuid("venture_id").references(() => venture.ventureId),
  sessionId: varchar("session_id", { length: 255 }),
  activityType: activityTypeEnum("activity_type").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  entityId: varchar("entity_id", { length: 255 }),
  entityType: varchar("entity_type", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### SQL Schema

```sql
CREATE TYPE activity_type AS ENUM (
  'account',
  'venture',
  'document',
  'evaluation',
  'authentication',
  'navigation',
  'payment',
  'validation',
  'system'
);

CREATE TABLE user_activity (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES founder(founder_id),
  venture_id UUID REFERENCES venture(venture_id),
  session_id VARCHAR(255),
  activity_type activity_type NOT NULL,
  action VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  entity_id VARCHAR(255),
  entity_type VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_activity_founder ON user_activity(founder_id);
CREATE INDEX idx_activity_venture ON user_activity(venture_id);
CREATE INDEX idx_activity_action ON user_activity(action);
CREATE INDEX idx_activity_created ON user_activity(created_at DESC);
CREATE INDEX idx_activity_type ON user_activity(activity_type);
CREATE INDEX idx_activity_founder_venture ON user_activity(founder_id, venture_id);
```

### TypeScript Types

```typescript
// Types
export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = typeof userActivity.$inferInsert;

// Validation Schema
export const insertUserActivitySchema = createInsertSchema(userActivity, {
  activityType: z.enum([
    'account', 'venture', 'document', 'evaluation', 
    'authentication', 'navigation', 'payment', 'system'
  ]),
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
  createdAt: true
});
```

### ActivityService Implementation

```typescript
// server/services/activity-service.ts

export interface ActivityContext {
  founderId?: string;
  ventureId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  
  /**
   * Extract activity context from Express request
   */
  static getContextFromRequest(req: Request): ActivityContext {
    const jwtUser = (req as any).user;
    const founderId = jwtUser?.founderId || (req.session as any)?.founderId;
    
    return {
      founderId,
      ventureId: jwtUser?.ventureId || (req.session as any)?.ventureId,
      sessionId: req.sessionID || 'jwt-session',
      ipAddress: req.ip || (req.connection as any)?.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }

  /**
   * Log a user activity
   */
  static async logActivity(
    context: ActivityContext,
    activity: {
      activityType: 'account' | 'venture' | 'document' | 'evaluation' | 
                    'authentication' | 'navigation' | 'system';
      action: string;
      title: string;
      description?: string;
      metadata?: any;
      entityId?: string;
      entityType?: string;
    }
  ): Promise<UserActivity | null> {
    try {
      const activityData: InsertUserActivity = {
        founderId: context.founderId || null,
        ventureId: context.ventureId || null,
        sessionId: context.sessionId || null,
        activityType: activity.activityType,
        action: activity.action,
        title: activity.title,
        description: activity.description || null,
        metadata: activity.metadata || null,
        entityId: activity.entityId || null,
        entityType: activity.entityType || null,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
      };

      const createdActivity = await storage.createUserActivity(activityData);
      appLogger.business(`Activity logged: ${activity.action} - ${activity.title}`);
      
      // Invalidate activity cache for founder
      if (context.founderId) {
        await lruCacheService.invalidate('dashboard', `activity_${context.founderId}`);
      }
      
      return createdActivity;
    } catch (error) {
      appLogger.business('Failed to log activity:', error);
      return null;
    }
  }

  // Specialized logging methods for each activity type...
}
```

### Specialized Activity Logging Methods

```typescript
// Account activities
static async logAccountActivity(
  context: ActivityContext,
  action: 'signup' | 'email_verify' | 'profile_update',
  title: string,
  description?: string,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'account',
    action,
    title,
    description,
    metadata
  });
}

// Authentication activities
static async logAuthActivity(
  context: ActivityContext,
  action: 'login' | 'logout' | 'password_reset' | 'password_change',
  title: string,
  description?: string,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'authentication',
    action,
    title,
    description,
    metadata
  });
}

// Venture activities
static async logVentureActivity(
  context: ActivityContext,
  action: 'create' | 'update' | 'complete',
  title: string,
  ventureId: string,
  description?: string,
  metadata?: any
) {
  return this.logActivity({...context, ventureId}, {
    activityType: 'venture',
    action,
    title,
    description,
    metadata,
    entityId: ventureId,
    entityType: 'venture'
  });
}

// Document activities
static async logDocumentActivity(
  context: ActivityContext,
  action: 'upload' | 'download' | 'delete' | 'generate',
  title: string,
  documentId: string,
  fileName: string,
  folderName?: string,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'document',
    action,
    title,
    description: folderName ? `File: ${fileName} in ${folderName}` : `File: ${fileName}`,
    metadata: { fileName, folderName, ...metadata },
    entityId: documentId,
    entityType: 'document'
  });
}

// Evaluation/scoring activities
static async logEvaluationActivity(
  context: ActivityContext,
  action: 'score_generate' | 'score_update' | 'analysis_complete',
  title: string,
  evaluationId: string,
  score?: number,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'evaluation',
    action,
    title,
    description: score ? `ProofScore: ${score}/100` : undefined,
    metadata: { score, ...metadata },
    entityId: evaluationId,
    entityType: 'evaluation'
  });
}

// VaultScore updates
static async logVaultScoreActivity(
  context: ActivityContext,
  title: string,
  oldScore: number,
  newScore: number,
  uploadId: string,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'evaluation',
    action: 'score_update',
    title,
    description: `VaultScore: ${oldScore} → ${newScore}`,
    metadata: { oldScore, newScore, ...metadata },
    entityId: uploadId,
    entityType: 'vault'
  });
}

// Navigation analytics
static async logNavigationActivity(
  context: ActivityContext,
  action: 'page_visit' | 'feature_use' | 'button_click',
  title: string,
  page?: string,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'navigation',
    action,
    title,
    description: page,
    metadata
  });
}

// System events
static async logSystemActivity(
  context: ActivityContext,
  action: 'notification_sent' | 'email_sent' | 'report_generated',
  title: string,
  description?: string,
  metadata?: any
) {
  return this.logActivity(context, {
    activityType: 'system',
    action,
    title,
    description,
    metadata
  });
}
```

### Storage Methods

```typescript
// server/storage.ts
interface IStorage {
  getUserActivity(id: string): Promise<UserActivity | undefined>;
  getUserActivities(founderId: string, limit?: number, activityType?: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  deleteUserActivity(id: string): Promise<void>;
}

// Implementation
async getUserActivity(id: string): Promise<UserActivity | undefined> {
  const [activityRecord] = await db
    .select()
    .from(userActivity)
    .where(eq(userActivity.activityId, id));
  return activityRecord;
}

async getUserActivities(
  founderId: string, 
  limit: number = 10, 
  activityType?: string
): Promise<UserActivity[]> {
  if (activityType) {
    return db.select()
      .from(userActivity)
      .where(and(
        eq(userActivity.founderId, founderId),
        eq(userActivity.activityType, activityType as any)
      ))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
  }
  
  return db.select()
    .from(userActivity)
    .where(eq(userActivity.founderId, founderId))
    .orderBy(desc(userActivity.createdAt))
    .limit(limit);
}

async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
  const [activityRecord] = await db
    .insert(userActivity)
    .values(insertActivity)
    .returning();
  return activityRecord;
}

async deleteUserActivity(id: string): Promise<void> {
  await db.delete(userActivity).where(eq(userActivity.activityId, id));
}
```

### Retrieving Recent Activities

```typescript
/**
 * Get recent activities for a founder
 */
static async getRecentActivities(
  founderId: string,
  limit: number = 10,
  activityType?: string
): Promise<UserActivity[]> {
  try {
    return await storage.getUserActivities(founderId, limit, activityType);
  } catch (error) {
    appLogger.business('Failed to get recent activities:', error);
    return [];
  }
}
```

### Data Migration Utility

```typescript
/**
 * Bulk migrate existing data to activity log
 */
static async migrateExistingData(founderId: string): Promise<void> {
  try {
    const founder = await storage.getFounder(founderId);
    if (!founder) return;

    const baseContext: ActivityContext = {
      founderId,
      sessionId: 'migration',
      ipAddress: '127.0.0.1',
      userAgent: 'System Migration'
    };

    // Migrate account creation
    await this.logActivity(baseContext, {
      activityType: 'account',
      action: 'signup',
      title: 'Joined Second Chance platform',
      description: 'Welcome to the startup validation ecosystem'
    });

    // Migrate email verification
    if (founder.emailVerified) {
      await this.logActivity(baseContext, {
        activityType: 'account',
        action: 'email_verify',
        title: 'Email verified successfully',
        description: 'Your email has been verified and account is active'
      });
    }

    // Migrate venture activities
    const ventures = await storage.getVenturesByFounderId(founderId);
    for (const venture of ventures) {
      await this.logVentureActivity(
        baseContext,
        'create',
        `Venture "${venture.name}" created`,
        venture.ventureId,
        `${venture.industry} startup in ${venture.geography}`
      );

      // Migrate evaluations
      const evaluations = await storage.getEvaluationsByVentureId(venture.ventureId);
      for (const evaluation of evaluations) {
        await this.logEvaluationActivity(
          {...baseContext, ventureId: venture.ventureId},
          'score_generate',
          'ProofScore established',
          evaluation.evaluationId,
          evaluation.proofscore,
          { initialScore: true }
        );
      }

      // Migrate document uploads
      const documents = await storage.getDocumentUploadsByVentureId(venture.ventureId);
      for (const doc of documents) {
        await this.logDocumentActivity(
          {...baseContext, ventureId: venture.ventureId},
          'upload',
          doc.originalName,
          doc.uploadId,
          doc.originalName,
          doc.folderId || 'Unknown folder'
        );
      }
    }

    appLogger.business(`Migration completed for founder ${founderId}`);
  } catch (error) {
    appLogger.business('Migration failed:', error);
  }
}
```

---

## 5. Coach Events Integration

### Coach Events Constants

The user_activity table serves as the event source for ProofCoach milestone tracking:

```typescript
// shared/config/coach-events.ts
export const COACH_EVENTS = {
  // Onboarding & Account
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  
  // Dashboard & Tutorial
  DASHBOARD_VISITED: 'dashboard_visited',
  DASHBOARD_TUTORIAL_COMPLETED: 'dashboard_tutorial_completed',
  
  // ProofVault Activities
  VAULT_FILE_UPLOADED: 'vault_file_uploaded',
  VAULT_FIRST_UPLOAD: 'vault_first_upload',
  VAULT_10_FILES_UPLOADED: 'vault_10_files_uploaded',
  VAULT_20_FILES_UPLOADED: 'vault_20_files_uploaded',
  VAULT_30_FILES_UPLOADED: 'vault_30_files_uploaded',
  VAULT_50_FILES_UPLOADED: 'vault_50_files_uploaded',
  VAULT_SCORE_UPDATED: 'vault_score_updated',
  
  // Validation Map & Experiments
  VALIDATION_MAP_VIEWED: 'validation_map_viewed',
  VALIDATION_MAP_EXPORTED: 'validation_map_exported',
  VALIDATION_CSV_UPLOADED: 'validation_csv_uploaded',
  EXPERIMENT_CREATED: 'experiment_created',
  EXPERIMENT_STARTED: 'experiment_started',
  EXPERIMENT_UPDATED: 'experiment_updated',
  EXPERIMENT_COMPLETED: 'experiment_completed',
  FIRST_EXPERIMENT_COMPLETED: 'first_experiment_completed',
  THREE_EXPERIMENTS_COMPLETED: 'three_experiments_completed',
  FIVE_EXPERIMENTS_COMPLETED: 'five_experiments_completed',
  
  // Score & Analysis
  PROOFSCORE_RECEIVED: 'proofscore_received',
  PROOFSCORE_VIEWED: 'proofscore_viewed',
  SCORE_IMPROVED: 'score_improved',
  PROOFSCORE_65_REACHED: 'proofscore_65_reached',
  PROOFSCORE_70_REACHED: 'proofscore_70_reached',
  PROOFSCORE_80_REACHED: 'proofscore_80_reached',
  
  // Deal Room & Payment
  DEAL_ROOM_VIEWED: 'deal_room_viewed',
  DEAL_ROOM_PURCHASED: 'deal_room_purchased',
  PATHWAY_VIEWED: 'pathway_viewed',
  
  // Community & Downloads
  COMMUNITY_ACCESSED: 'community_accessed',
  REPORT_DOWNLOADED: 'report_downloaded',
  CERTIFICATE_DOWNLOADED: 'certificate_downloaded',
  FILE_DOWNLOADED: 'file_downloaded',
} as const;
```

### Journey Step Mapping

```typescript
export const JOURNEY_STEP_COMPLETION_EVENTS: Record<number, string[]> = {
  // Onboarding Steps (0-1)
  0: [COACH_EVENTS.ONBOARDING_STARTED],
  1: [COACH_EVENTS.ONBOARDING_COMPLETED],
  
  // ProofCoach Journey Steps (2-30)
  2: [COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED],
  3: [COACH_EVENTS.VALIDATION_MAP_VIEWED],
  10: [COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED],
  11: [COACH_EVENTS.VAULT_FIRST_UPLOAD],
  13: [COACH_EVENTS.VAULT_10_FILES_UPLOADED],
  14: [COACH_EVENTS.FIRST_EXPERIMENT_COMPLETED],
  15: [COACH_EVENTS.THREE_EXPERIMENTS_COMPLETED],
  16: [COACH_EVENTS.VALIDATION_MAP_EXPORTED],
  17: [COACH_EVENTS.VALIDATION_CSV_UPLOADED],
  18: [COACH_EVENTS.VAULT_20_FILES_UPLOADED],
  19: [COACH_EVENTS.PROOFSCORE_65_REACHED],
  20: [COACH_EVENTS.VAULT_30_FILES_UPLOADED],
  21: [COACH_EVENTS.PROOFSCORE_70_REACHED],
  22: [COACH_EVENTS.DEAL_ROOM_VIEWED],
  23: [COACH_EVENTS.DEAL_ROOM_PURCHASED],
  24: [COACH_EVENTS.CERTIFICATE_DOWNLOADED],
  25: [COACH_EVENTS.REPORT_DOWNLOADED],
  27: [COACH_EVENTS.FIVE_EXPERIMENTS_COMPLETED],
  28: [COACH_EVENTS.PROOFSCORE_80_REACHED],
  29: [COACH_EVENTS.VAULT_50_FILES_UPLOADED],
  30: [COACH_EVENTS.PROOFSCORE_80_REACHED],
};
```

### CoachProgressService Integration

```typescript
// server/services/coach-progress-service.ts
export class CoachProgressService {
  
  static async calculateProgress(founderId: string, ventureId?: string) {
    // Get all ventures for founder
    const founderVentures = await db
      .select()
      .from(venture)
      .where(eq(venture.founderId, founderId));
    
    const ventureIds = ventureId ? [ventureId] : founderVentures.map(v => v.ventureId);
    
    if (ventureIds.length === 0) {
      return this.getEmptyProgress();
    }
    
    // STEP 1: Query real data from source tables
    const [
      vaultUploadsResult,
      completedExperimentsResult,
      // ... other queries
    ] = await Promise.all([
      db.select({ count: count() })
        .from(documentUpload)
        .where(and(
          eq(documentUpload.uploadSource, 'proof-vault'),
          inArray(documentUpload.ventureId, ventureIds)
        )),
      db.select({ id: ventureExperiments.id })
        .from(ventureExperiments)
        .where(and(
          eq(ventureExperiments.status, 'completed'),
          inArray(ventureExperiments.ventureId, ventureIds)
        )),
    ]);
    
    // STEP 2: Query event data for milestone flags
    const activities = await db
      .select()
      .from(userActivity)
      .where(and(
        eq(userActivity.founderId, founderId),
        or(
          inArray(userActivity.ventureId, ventureIds),
          isNull(userActivity.ventureId) // Include founder-level events
        )
      ))
      .orderBy(desc(userActivity.createdAt));
    
    // Build progress object from real data + events
    const progress = {
      vaultUploadCount: Number(vaultUploadsResult[0]?.count || 0),
      completedExperimentsCount: completedExperimentsResult.length,
      // ... aggregate milestone flags from activities
    };
    
    return progress;
  }
}
```

### Milestone Event Emission with Deduplication

```typescript
// Example: Emitting ProofScore milestone events
const hasMilestone = async (action: string) => {
  const activities = await db
    .select()
    .from(userActivity)
    .where(
      and(
        eq(userActivity.founderId, founderId),
        eq(userActivity.ventureId, venture.ventureId),
        eq(userActivity.action, action)
      )
    )
    .limit(1);
  return activities.length > 0;
};

// Only emit if milestone not already logged (scoped by founder + venture)
if (totalScore >= 80 && !(await hasMilestone(COACH_EVENTS.PROOFSCORE_80_REACHED))) {
  await ActivityService.logActivity(
    { founderId, ventureId: venture.ventureId },
    {
      activityType: 'venture',
      action: COACH_EVENTS.PROOFSCORE_80_REACHED,
      title: 'ProofScore Milestone: 80+ Reached',
      description: `Achieved ProofScore of ${totalScore}`,
      metadata: { proofScore: totalScore },
      entityId: venture.ventureId,
      entityType: 'venture',
    }
  );
}
```

---

## 6. Database Schema Reference

### Complete Schema Overview

```sql
-- Activity Type Enum
CREATE TYPE activity_type AS ENUM (
  'account', 'venture', 'document', 'evaluation', 
  'authentication', 'navigation', 'payment', 'validation', 'system'
);

-- Organization Stage Enum
CREATE TYPE organization_stage AS ENUM (
  'Idea Stage', 'Pre-Product', 'MVP', 
  'Early Traction', 'Growth Stage', 'Scaling'
);

-- User Activity Table
CREATE TABLE user_activity (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID REFERENCES founder(founder_id),
  venture_id UUID REFERENCES venture(venture_id),
  session_id VARCHAR(255),
  activity_type activity_type NOT NULL,
  action VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  entity_id VARCHAR(255),
  entity_type VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Leaderboard Table
CREATE TABLE leaderboard (
  leaderboard_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES venture(venture_id),
  venture_name VARCHAR(255) NOT NULL,
  total_score INTEGER NOT NULL,
  proof_tags_count INTEGER NOT NULL DEFAULT 0,
  dimension_scores JSONB,
  analysis_date TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ProofScaling Wishlist Table
CREATE TABLE proof_scaling_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  role VARCHAR(100) NOT NULL,
  organization_stage organization_stage NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_activity_founder ON user_activity(founder_id);
CREATE INDEX idx_activity_venture ON user_activity(venture_id);
CREATE INDEX idx_activity_action ON user_activity(action);
CREATE INDEX idx_activity_created ON user_activity(created_at DESC);
CREATE INDEX idx_activity_founder_venture ON user_activity(founder_id, venture_id);

CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);
CREATE INDEX idx_leaderboard_venture ON leaderboard(venture_id);

CREATE INDEX idx_wishlist_email ON proof_scaling_wishlist(email);
CREATE INDEX idx_wishlist_created ON proof_scaling_wishlist(created_at);
```

---

## 7. Multi-Tenant Considerations

### Leaderboard Multi-Tenant Queries

For B2B API integration (Proof Scaling Engine), leaderboard queries must be scoped by licensee:

```typescript
// Multi-tenant leaderboard query
async getLeaderboardByLicensee(licenseeId: string, limit: number = 10) {
  return db
    .select({
      leaderboardId: leaderboard.leaderboardId,
      ventureName: leaderboard.ventureName,
      totalScore: leaderboard.totalScore,
      proofTagsCount: leaderboard.proofTagsCount,
      analysisDate: leaderboard.analysisDate,
    })
    .from(leaderboard)
    .innerJoin(venture, eq(leaderboard.ventureId, venture.ventureId))
    .where(eq(venture.licenseeId, licenseeId))  // CRITICAL: Scope by licensee
    .orderBy(desc(leaderboard.totalScore))
    .limit(limit);
}
```

### User Activity Multi-Tenant Queries

```typescript
// Multi-tenant activity query
async getUserActivitiesByLicensee(
  licenseeId: string, 
  founderId?: string, 
  limit: number = 50
) {
  let query = db
    .select()
    .from(userActivity)
    .innerJoin(founder, eq(userActivity.founderId, founder.founderId))
    .where(eq(founder.licenseeId, licenseeId));  // CRITICAL: Scope by licensee
  
  if (founderId) {
    query = query.where(eq(userActivity.founderId, founderId));
  }
  
  return query
    .orderBy(desc(userActivity.createdAt))
    .limit(limit);
}
```

### Security Best Practices

1. **Always scope queries by licenseeId** for multi-tenant deployments
2. **Validate founderId/ventureId ownership** before logging activities
3. **Use parameterized queries** to prevent SQL injection
4. **Implement rate limiting** on activity logging endpoints
5. **Sanitize metadata** before storing in JSONB fields

---

## Usage Examples

### Logging a File Upload Activity

```typescript
// When a file is uploaded to ProofVault
await ActivityService.logDocumentActivity(
  { founderId: user.founderId, ventureId: currentVentureId },
  'upload',
  'Pitch deck uploaded',
  upload.uploadId,
  file.originalname,
  'Overview',
  { fileSize: file.size, mimeType: file.mimetype }
);
```

### Checking Wishlist Duplicate

```typescript
const emailExists = await storage.checkProofScalingWishlistEmailExists(email);
if (emailExists) {
  throw new Error('Email already on wishlist');
}
```

### Getting User's Leaderboard Position

```typescript
const allEntries = await storage.getLeaderboard(100);
const userEntry = allEntries.find(e => e.ventureId === userVentureId);
const userRank = userEntry 
  ? allEntries.indexOf(userEntry) + 1 
  : null;
```

---

*End of Platform Workflows Documentation*
