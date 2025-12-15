# ProofCoach Task Completion Tracking

## Overview

The ProofCoach system tracks user progress through a multi-step journey from onboarding to investment readiness. Journey steps are identified by specific step IDs (0-30) with gaps, totaling **21 defined milestones**. It uses an **event-sourced architecture** where the `user_activity` table serves as the immutable source of truth, with events aggregated into `coach_state` via the `CoachProgressService` for fast API responses.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [COACH_EVENTS Constants](#coach_events-constants)
3. [Journey Step Mapping](#journey-step-mapping)
4. [CoachProgressService](#coachprogressservice)
5. [Database Schema](#database-schema)
6. [Hybrid Data Architecture](#hybrid-data-architecture)
7. [Milestone Emission Triggers](#milestone-emission-triggers)
8. [Progress Calculation Workflow](#progress-calculation-workflow)
9. [Event Metadata Structure](#event-metadata-structure)
10. [Integration Examples](#integration-examples)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Actions                                  │
│  (uploads, experiments, payments, downloads, page visits)            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ActivityService.logActivity()                     │
│            Logs events with COACH_EVENTS action constants            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      user_activity Table                             │
│              (Immutable event store / source of truth)               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   CoachProgressService                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  1. Query REAL DATA from source tables                      │   │
│   │     - ventures (proofScore, vaultScore)                     │   │
│   │     - document_upload (file counts)                         │   │
│   │     - venture_experiments (completed experiments)           │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  2. Query EVENT DATA from user_activity                     │   │
│   │     - Milestone flags (first upload, score thresholds)      │   │
│   │     - Action-based tracking (tutorial, downloads)           │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  3. Calculate completed journey steps                       │   │
│   │     - Map activities to JOURNEY_STEP_COMPLETION_EVENTS      │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       coach_state Table                              │
│              (Materialized progress for fast API responses)          │
│   - completedJourneySteps: number[]                                  │
│   - currentJourneyStep: number                                       │
│   - tutorialCompletedPages: string[]                                 │
│   - lastInteractionAt: timestamp                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## COACH_EVENTS Constants

All coach-related events are defined in `shared/config/coach-events.ts` as standardized constants.

### Event Categories

#### Onboarding & Account

```typescript
ONBOARDING_STARTED: 'onboarding_started'
ONBOARDING_COMPLETED: 'onboarding_completed'
```

#### Dashboard & Tutorial

```typescript
DASHBOARD_VISITED: 'dashboard_visited'
DASHBOARD_TUTORIAL_COMPLETED: 'dashboard_tutorial_completed'
```

#### ProofVault Activities

```typescript
VAULT_FILE_UPLOADED: 'vault_file_uploaded'
VAULT_FIRST_UPLOAD: 'vault_first_upload'
VAULT_10_FILES_UPLOADED: 'vault_10_files_uploaded'
VAULT_20_FILES_UPLOADED: 'vault_20_files_uploaded'
VAULT_30_FILES_UPLOADED: 'vault_30_files_uploaded'
VAULT_50_FILES_UPLOADED: 'vault_50_files_uploaded'
VAULT_SCORE_UPDATED: 'vault_score_updated'
```

#### Validation Map & Experiments

```typescript
VALIDATION_MAP_VIEWED: 'validation_map_viewed'
VALIDATION_MAP_EXPORTED: 'validation_map_exported'
VALIDATION_CSV_UPLOADED: 'validation_csv_uploaded'
EXPERIMENT_CREATED: 'experiment_created'
EXPERIMENT_STARTED: 'experiment_started'
EXPERIMENT_UPDATED: 'experiment_updated'
EXPERIMENT_COMPLETED: 'experiment_completed'
FIRST_EXPERIMENT_COMPLETED: 'first_experiment_completed'
THREE_EXPERIMENTS_COMPLETED: 'three_experiments_completed'
FIVE_EXPERIMENTS_COMPLETED: 'five_experiments_completed'
```

#### Score & Analysis

```typescript
PROOFSCORE_RECEIVED: 'proofscore_received'
PROOFSCORE_VIEWED: 'proofscore_viewed'
SCORE_IMPROVED: 'score_improved'
PROOFSCORE_65_REACHED: 'proofscore_65_reached'
PROOFSCORE_70_REACHED: 'proofscore_70_reached'
PROOFSCORE_80_REACHED: 'proofscore_80_reached'
```

#### Deal Room & Payment

```typescript
DEAL_ROOM_VIEWED: 'deal_room_viewed'
DEAL_ROOM_PURCHASED: 'deal_room_purchased'
PATHWAY_VIEWED: 'pathway_viewed'
```

#### Community & Downloads

```typescript
COMMUNITY_ACCESSED: 'community_accessed'
REPORT_DOWNLOADED: 'report_downloaded'
CERTIFICATE_DOWNLOADED: 'certificate_downloaded'
FILE_DOWNLOADED: 'file_downloaded'
```

---

## Journey Step Mapping

The `JOURNEY_STEP_COMPLETION_EVENTS` maps specific journey step IDs to the event(s) that complete them. **Note**: Step IDs are not sequential - there are gaps (steps 4-9, 12, 26 are undefined), resulting in **21 defined milestones**.

```typescript
export const JOURNEY_STEP_COMPLETION_EVENTS: Record<number, string[]> = {
  // Onboarding Steps (0-1)
  0: [COACH_EVENTS.ONBOARDING_STARTED],     // Welcome - starting onboarding
  1: [COACH_EVENTS.ONBOARDING_COMPLETED],   // Complete onboarding
  
  // ProofCoach Journey Steps (2-30) - Post-Onboarding
  2: [COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED],  // Review ProofScore
  3: [COACH_EVENTS.VALIDATION_MAP_VIEWED],         // Explore Validation Map
  10: [COACH_EVENTS.DASHBOARD_TUTORIAL_COMPLETED], // Complete Dashboard Tutorial
  11: [COACH_EVENTS.VAULT_FIRST_UPLOAD],           // Make Your First Upload
  13: [COACH_EVENTS.VAULT_10_FILES_UPLOADED],      // Upload 10 Files
  14: [COACH_EVENTS.FIRST_EXPERIMENT_COMPLETED],   // Complete First Experiment
  15: [COACH_EVENTS.THREE_EXPERIMENTS_COMPLETED],  // Complete 3 Experiments
  16: [COACH_EVENTS.VALIDATION_MAP_EXPORTED],      // Export Validation Map CSV
  17: [COACH_EVENTS.VALIDATION_CSV_UPLOADED],      // Upload CSV to ProofVault
  18: [COACH_EVENTS.VAULT_20_FILES_UPLOADED],      // Upload 20 Total Files
  19: [COACH_EVENTS.PROOFSCORE_65_REACHED],        // Reach ProofScore 65+
  20: [COACH_EVENTS.VAULT_30_FILES_UPLOADED],      // Upload 30 Total Files
  21: [COACH_EVENTS.PROOFSCORE_70_REACHED],        // Reach ProofScore 70+ (unlocks Deal Room)
  22: [COACH_EVENTS.DEAL_ROOM_VIEWED],             // Explore Deal Room
  23: [COACH_EVENTS.DEAL_ROOM_PURCHASED],          // Complete Payment
  24: [COACH_EVENTS.CERTIFICATE_DOWNLOADED],       // Download Certificate
  25: [COACH_EVENTS.REPORT_DOWNLOADED],            // Download Report
  27: [COACH_EVENTS.FIVE_EXPERIMENTS_COMPLETED],   // Complete 5 Experiments
  28: [COACH_EVENTS.PROOFSCORE_80_REACHED],        // Reach ProofScore 80+
  29: [COACH_EVENTS.VAULT_50_FILES_UPLOADED],      // Upload 50 Total Files
  30: [COACH_EVENTS.PROOFSCORE_80_REACHED],        // Investment Ready (80+ score)
};
```

### Journey Milestones Summary

| Step | Milestone | Completion Event |
|------|-----------|------------------|
| 0 | Welcome | `onboarding_started` |
| 1 | Complete Onboarding | `onboarding_completed` |
| 2 | Review ProofScore | `dashboard_tutorial_completed` |
| 3 | Explore Validation Map | `validation_map_viewed` |
| 10 | Complete Dashboard Tutorial | `dashboard_tutorial_completed` |
| 11 | First Upload | `vault_first_upload` |
| 13 | Upload 10 Files | `vault_10_files_uploaded` |
| 14 | First Experiment | `first_experiment_completed` |
| 15 | Complete 3 Experiments | `three_experiments_completed` |
| 16 | Export Validation Map | `validation_map_exported` |
| 17 | Upload CSV to Vault | `validation_csv_uploaded` |
| 18 | Upload 20 Files | `vault_20_files_uploaded` |
| 19 | Reach ProofScore 65+ | `proofscore_65_reached` |
| 20 | Upload 30 Files | `vault_30_files_uploaded` |
| 21 | Reach ProofScore 70+ | `proofscore_70_reached` |
| 22 | Explore Deal Room | `deal_room_viewed` |
| 23 | Complete Payment | `deal_room_purchased` |
| 24 | Download Certificate | `certificate_downloaded` |
| 25 | Download Report | `report_downloaded` |
| 27 | Complete 5 Experiments | `five_experiments_completed` |
| 28 | Reach ProofScore 80+ | `proofscore_80_reached` |
| 29 | Upload 50 Files | `vault_50_files_uploaded` |
| 30 | Investment Ready | `proofscore_80_reached` |

---

## CoachProgressService

### Location

```
server/services/coach-progress-service.ts
```

### Core Methods

#### `calculateProgress(founderId, ventureId?)`

Calculates complete progress snapshot by combining real database queries with event-based milestone tracking.

```typescript
static async calculateProgress(founderId: string, ventureId?: string): Promise<Progress>
```

**Returns**: Complete progress object with metrics and milestone flags.

#### `saveProgress(founderId, progress)`

Persists calculated progress to the `coach_state` table.

```typescript
static async saveProgress(founderId: string, progress: any): Promise<void>
```

#### `recalculateAndSave(founderId, ventureId?)`

Full recalculation: calculates and saves progress in one operation.

```typescript
static async recalculateAndSave(founderId: string, ventureId?: string): Promise<Progress>
```

---

## Database Schema

### `coach_state` Table

Stores materialized coach progress for fast API responses.

```typescript
export const coachState = pgTable("coach_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  founderId: uuid("founder_id").references(() => founder.founderId).notNull().unique(),
  currentJourneyStep: integer("current_journey_step").notNull().default(0),
  completedJourneySteps: json("completed_journey_steps").$type<number[]>().notNull().default([]),
  isMinimized: boolean("is_minimized").notNull().default(false),
  isDismissed: boolean("is_dismissed").notNull().default(false),
  tutorialCompletedPages: json("tutorial_completed_pages").$type<string[]>().notNull().default([]),
  lastInteractionAt: timestamp("last_interaction_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `founderId` | UUID | Founder this state belongs to (unique) |
| `currentJourneyStep` | INTEGER | Current step in the journey |
| `completedJourneySteps` | JSON (number[]) | Array of completed step IDs |
| `isMinimized` | BOOLEAN | Whether the coach widget is minimized |
| `isDismissed` | BOOLEAN | Whether the user dismissed the coach |
| `tutorialCompletedPages` | JSON (string[]) | Pages where tutorial was completed |
| `lastInteractionAt` | TIMESTAMP | Last activity timestamp |
| `metadata` | JSONB | Additional state data |

---

## Hybrid Data Architecture

The `CoachProgressService.calculateProgress()` uses a hybrid approach combining **real database queries** with **event-based milestone tracking**.

### Real Data Queries (Source of Truth)

Counts directly from source tables for accurate metrics:

```typescript
// Ventures
const founderVentures = await db.select().from(venture).where(eq(venture.founderId, founderId));

// ProofVault uploads (uploadSource='proof-vault')
const vaultUploadsQuery = db.select({ count: count() })
  .from(documentUpload)
  .where(and(
    eq(documentUpload.uploadSource, 'proof-vault'),
    inArray(documentUpload.ventureId, ventureIds)
  ));

// Completed experiments
const completedExperimentsQuery = db.select({ id, completedAt })
  .from(ventureExperiments)
  .where(and(
    eq(ventureExperiments.status, 'completed'),
    inArray(ventureExperiments.ventureId, ventureIds)
  ));
```

### Event-Based Milestone Tracking

Milestone flags tracked via `user_activity` events:

```typescript
// Query all activities for founder
const activities = await db.select().from(userActivity)
  .where(and(
    eq(userActivity.founderId, founderId),
    or(
      inArray(userActivity.ventureId, ventureIds),
      isNull(userActivity.ventureId)  // Include founder-level events
    )
  ));

// Process milestone flags
for (const activity of activities) {
  if (activity.action === COACH_EVENTS.VAULT_FIRST_UPLOAD) {
    progress.hasFirstUpload = true;
  }
  if (activity.action === COACH_EVENTS.PROOFSCORE_70_REACHED) {
    progress.hasReached70Score = true;
  }
  // ... etc
}
```

### Progress Object Structure

```typescript
{
  // Onboarding
  onboardingComplete: boolean,          // venture.proofScore > 0
  dashboardTutorialCompleted: boolean,  // Event-based
  
  // Experiments (from database)
  completedExperimentsCount: number,
  hasCompletedExperiment: boolean,
  hasCompleted3Experiments: boolean,
  hasCompleted5Experiments: boolean,
  firstExperimentCompletedAt: Date | null,
  
  // ProofVault uploads (from database)
  vaultUploadCount: number,
  totalUploads: number,
  distinctArtifactTypesCount: number,
  firstVaultUploadAt: Date | null,
  
  // Upload milestones (event-based)
  hasFirstUpload: boolean,
  has10Uploads: boolean,
  has20Uploads: boolean,
  has30Uploads: boolean,
  has50Uploads: boolean,
  
  // Scores (from venture table)
  proofScore: number,
  vaultScore: number,
  latestProofScoreAt: Date | null,
  
  // Score milestones (event-based)
  hasReached65Score: boolean,
  hasReached70Score: boolean,
  hasReached80Score: boolean,
  
  // Validation Map (event-based)
  validationMapExported: boolean,
  validationMapExportedAt: Date | null,
  validationMapUploadedToVault: boolean,
  validationMapUploadedAt: Date | null,
  
  // Deal Room (event-based)
  hasDealRoomAccess: boolean,
  dealRoomPurchasedAt: Date | null,
  
  // Downloads (event-based)
  hasAccessedCommunityOrDownloads: boolean,
  hasCertificateDownloaded: boolean,
  hasReportDownloaded: boolean,
  
  // Journey progress
  completedSteps: number[],
  lastActivityAt: Date,
}
```

---

## Milestone Emission Triggers

Events are emitted at specific thresholds to mark milestone achievements.

### Upload Milestones

| Threshold | Event | Step |
|-----------|-------|------|
| 1 file | `VAULT_FIRST_UPLOAD` | 11 |
| 10 files | `VAULT_10_FILES_UPLOADED` | 13 |
| 20 files | `VAULT_20_FILES_UPLOADED` | 18 |
| 30 files | `VAULT_30_FILES_UPLOADED` | 20 |
| 50 files | `VAULT_50_FILES_UPLOADED` | 29 |

### ProofScore Milestones

| Threshold | Event | Step |
|-----------|-------|------|
| 65+ | `PROOFSCORE_65_REACHED` | 19 |
| 70+ | `PROOFSCORE_70_REACHED` | 21 |
| 80+ | `PROOFSCORE_80_REACHED` | 28, 30 |

### Experiment Milestones

| Threshold | Event | Step |
|-----------|-------|------|
| 1 completed | `FIRST_EXPERIMENT_COMPLETED` | 14 |
| 3 completed | `THREE_EXPERIMENTS_COMPLETED` | 15 |
| 5 completed | `FIVE_EXPERIMENTS_COMPLETED` | 27 |

---

## Progress Calculation Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 1: Query Real Data from Source Tables                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Parallel queries:                                            │    │
│  │  - Get founder's ventures                                    │    │
│  │  - Count ProofVault uploads (uploadSource='proof-vault')     │    │
│  │  - Count total uploads                                       │    │
│  │  - Get distinct artifact types                               │    │
│  │  - Get first vault upload timestamp                          │    │
│  │  - Get completed experiments                                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 2: Query Event Data from user_activity                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ SELECT * FROM user_activity                                  │    │
│  │ WHERE founderId = ? AND (ventureId IN (?) OR ventureId IS NULL)  │
│  │ ORDER BY createdAt DESC                                      │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 3: Initialize Progress with Real Data                          │
├─────────────────────────────────────────────────────────────────────┤
│  onboardingComplete = venture.proofScore > 0                        │
│  completedExperimentsCount = experimentsQuery.length                │
│  vaultUploadCount = vaultUploadsQuery.count                         │
│  proofScore = venture.proofScore                                    │
│  vaultScore = venture.vaultScore                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 4: Process Event-Based Milestone Flags                         │
├─────────────────────────────────────────────────────────────────────┤
│  for (activity of activities) {                                     │
│    if (action === VAULT_FIRST_UPLOAD) hasFirstUpload = true;        │
│    if (action === VAULT_10_FILES_UPLOADED) has10Uploads = true;     │
│    if (action === PROOFSCORE_65_REACHED) hasReached65Score = true;  │
│    if (action === DEAL_ROOM_PURCHASED) hasDealRoomAccess = true;    │
│    // ... etc                                                       │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 5: Calculate Completed Journey Steps                           │
├─────────────────────────────────────────────────────────────────────┤
│  for ([stepId, requiredEvents] of JOURNEY_STEP_COMPLETION_EVENTS) { │
│    if (requiredEvents.some(event => activityActions.has(event))) {  │
│      completedSteps.push(stepId);                                   │
│    }                                                                │
│  }                                                                  │
│  return completedSteps.sort();                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STEP 6: Return Complete Progress Object                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Event Metadata Structure

```typescript
export interface CoachEventMetadata {
  // Common fields
  ventureId: string;
  founderId: string;
  
  // Step-specific fields
  stepId?: number;
  experimentId?: string;
  uploadId?: string;
  fileCount?: number;
  vaultScore?: number;
  proofScore?: number;
  experimentCount?: number;
  
  // Additional context
  [key: string]: any;
}
```

### Example Metadata

```typescript
// Vault upload milestone
{
  ventureId: "uuid-123",
  founderId: "uuid-456",
  fileCount: 10,
  vaultScore: 45
}

// ProofScore milestone
{
  ventureId: "uuid-123",
  founderId: "uuid-456",
  proofScore: 70,
  stepId: 21
}

// Experiment completion
{
  ventureId: "uuid-123",
  founderId: "uuid-456",
  experimentId: "exp-uuid",
  experimentCount: 3
}
```

---

## Integration Examples

### Logging a Milestone Event

```typescript
import { ActivityService } from './activity-service';
import { COACH_EVENTS } from '@shared/config/coach-events';

// When user uploads their 10th file
await ActivityService.logActivity(context, {
  activityType: 'document',
  action: COACH_EVENTS.VAULT_10_FILES_UPLOADED,
  title: 'Uploaded 10 files to ProofVault',
  description: 'Milestone: 10 files uploaded',
  metadata: {
    ventureId,
    founderId,
    fileCount: 10
  }
});
```

### Recalculating Progress After Action

```typescript
import { CoachProgressService } from './coach-progress-service';

// After an action that might affect progress
const progress = await CoachProgressService.recalculateAndSave(founderId, ventureId);

// Use progress for UI
console.log(`Completed steps: ${progress.completedSteps.length}/31`);
```

### Client-Side Event Logging (Activity Log API)

```typescript
// POST /api/v1/activity/log
const response = await fetch('/api/v1/activity/log', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    action: 'certificate_downloaded',
    title: 'Downloaded Certificate',
    metadata: { timestamp: new Date().toISOString() }
  })
});
```

### Checking Step Completion

```typescript
import { getStepCompletionEvents } from '@shared/config/coach-events';

// Get events that complete step 21 (ProofScore 70+)
const step21Events = getStepCompletionEvents(21);
// Returns: ['proofscore_70_reached']
```

---

## Important Implementation Details

### Founder-Level Events

The progress calculation includes both venture-specific events AND founder-level events (where `ventureId` is null):

```typescript
const activities = await db.select().from(userActivity)
  .where(and(
    eq(userActivity.founderId, founderId),
    or(
      inArray(userActivity.ventureId, ventureIds),
      isNull(userActivity.ventureId)  // Include founder-level events
    )
  ));
```

This ensures events like `dashboard_tutorial_completed` (which apply at the founder level) are counted.

### Empty Venture List Handling

If a founder has no ventures, the service returns an empty progress object immediately:

```typescript
if (ventureIds.length === 0) {
  return this.getEmptyProgress();
}
```

### Data vs Event-Derived Milestones

| Milestone Type | Source | Examples |
|----------------|--------|----------|
| **Real Data** | Database queries | `completedExperimentsCount`, `vaultUploadCount`, `proofScore`, `vaultScore` |
| **Event-Based** | user_activity table | `hasFirstUpload`, `hasReached70Score`, `hasDealRoomAccess`, `hasCertificateDownloaded` |

The hybrid approach ensures:
- Accurate counts from source tables (experiments, uploads)
- Milestone achievements tracked as discrete events
- Onboarding status determined by `venture.proofScore > 0` (not event-based)
