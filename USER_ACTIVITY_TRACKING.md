# User Activity Tracking Implementation

## Overview

The User Activity Tracking system provides a centralized, immutable audit log of all user interactions within the Second Chance platform. It serves as the foundation for analytics, debugging, user journey tracking, and the ProofCoach progress system.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Activity Types](#activity-types)
3. [ActivityService Class](#activityservice-class)
4. [Context Extraction](#context-extraction)
5. [Logging Methods](#logging-methods)
6. [Cache Invalidation](#cache-invalidation)
7. [Querying Activities](#querying-activities)
8. [Data Migration](#data-migration)
9. [Integration Points](#integration-points)

---

## Database Schema

### `user_activity` Table

The `user_activity` table stores all user interactions with the platform.

```typescript
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

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `activityId` | UUID | Unique identifier for each activity |
| `founderId` | UUID | The founder performing the action (nullable for anonymous) |
| `ventureId` | UUID | The venture context (nullable for account-level activities) |
| `sessionId` | VARCHAR | Browser session ID for session tracking |
| `activityType` | ENUM | Category of activity (see Activity Types) |
| `action` | VARCHAR | Specific action performed (e.g., 'file_upload', 'login') |
| `title` | VARCHAR | Display title for the activity |
| `description` | TEXT | Detailed description of the activity |
| `metadata` | JSONB | Additional structured data |
| `entityId` | VARCHAR | Reference to related entity (fileId, ventureId, etc.) |
| `entityType` | VARCHAR | Type of related entity ('file', 'venture', 'evaluation') |
| `ipAddress` | VARCHAR | IPv4/IPv6 address of request origin |
| `userAgent` | TEXT | Browser and device information |
| `createdAt` | TIMESTAMP | When the activity was logged |

---

## Activity Types

The platform categorizes activities into distinct types via the `activityTypeEnum`:

```typescript
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
```

### Activity Type Usage

| Type | Use Cases |
|------|-----------|
| `account` | signup, email_verify, profile_update |
| `venture` | create, update, complete |
| `document` | upload, download, delete, generate |
| `evaluation` | score_generate, score_update, analysis_complete |
| `authentication` | login, logout, password_reset, password_change |
| `navigation` | page_visit, feature_use, button_click |
| `payment` | Payment processing events |
| `validation` | Experiment and validation map activities |
| `system` | notification_sent, email_sent, report_generated |

---

## ActivityService Class

The `ActivityService` is a static class that provides centralized activity logging throughout the platform.

### Location

```
server/services/activity-service.ts
```

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ActivityService                           │
├─────────────────────────────────────────────────────────────┤
│  getContextFromRequest(req)  →  Extract context from request │
│  logActivity(context, activity)  →  Core logging method      │
│  logAccountActivity(...)  →  Account-specific logging        │
│  logAuthActivity(...)  →  Authentication logging             │
│  logVentureActivity(...)  →  Venture-specific logging        │
│  logDocumentActivity(...)  →  Document operations            │
│  logEvaluationActivity(...)  →  Scoring activities           │
│  logVaultScoreActivity(...)  →  VaultScore updates           │
│  logNavigationActivity(...)  →  Page visits and clicks       │
│  logSystemActivity(...)  →  System events                    │
│  getRecentActivities(founderId)  →  Query activities         │
│  migrateExistingData(founderId)  →  Bulk migration           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │       storage.createUser      │
              │         Activity()            │
              └───────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      user_activity table      │
              │        (PostgreSQL)           │
              └───────────────────────────────┘
```

---

## Context Extraction

### `getContextFromRequest(req: Request): ActivityContext`

Extracts activity context from Express request objects, supporting both JWT and session-based authentication.

```typescript
export interface ActivityContext {
  founderId?: string;
  ventureId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

#### Implementation

```typescript
static getContextFromRequest(req: Request): ActivityContext {
  // Try JWT authentication first (V1 endpoints)
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
```

---

## Logging Methods

### Core Method: `logActivity()`

The primary logging method that all specialized methods use internally.

```typescript
static async logActivity(
  context: ActivityContext,
  activity: {
    activityType: 'account' | 'venture' | 'document' | 'evaluation' | 'authentication' | 'navigation' | 'system';
    action: string;
    title: string;
    description?: string;
    metadata?: any;
    entityId?: string;
    entityType?: string;
  }
): Promise<UserActivity | null>
```

**Note**: The TypeScript method signature accepts 7 activity types, while the database schema defines 9 types (including `payment` and `validation`). Direct database inserts can use all 9 types.

### Specialized Logging Methods

#### Account Activities

```typescript
static async logAccountActivity(
  context: ActivityContext,
  action: 'signup' | 'email_verify' | 'profile_update',
  title: string,
  description?: string,
  metadata?: any
)
```

#### Authentication Activities

```typescript
static async logAuthActivity(
  context: ActivityContext,
  action: 'login' | 'logout' | 'password_reset' | 'password_change',
  title: string,
  description?: string,
  metadata?: any
)
```

#### Venture Activities

```typescript
static async logVentureActivity(
  context: ActivityContext,
  action: 'create' | 'update' | 'complete',
  title: string,
  ventureId: string,
  description?: string,
  metadata?: any
)
```

#### Document Activities

```typescript
static async logDocumentActivity(
  context: ActivityContext,
  action: 'upload' | 'download' | 'delete' | 'generate',
  title: string,
  documentId: string,
  fileName: string,
  folderName?: string,
  metadata?: any
)
```

#### Evaluation Activities

```typescript
static async logEvaluationActivity(
  context: ActivityContext,
  action: 'score_generate' | 'score_update' | 'analysis_complete',
  title: string,
  evaluationId: string,
  score?: number,
  metadata?: any
)
```

#### VaultScore Activities

```typescript
static async logVaultScoreActivity(
  context: ActivityContext,
  title: string,
  oldScore: number,
  newScore: number,
  uploadId: string,
  metadata?: any
)
```

#### Navigation Activities

```typescript
static async logNavigationActivity(
  context: ActivityContext,
  action: 'page_visit' | 'feature_use' | 'button_click',
  title: string,
  page?: string,
  metadata?: any
)
```

#### System Activities

```typescript
static async logSystemActivity(
  context: ActivityContext,
  action: 'notification_sent' | 'email_sent' | 'report_generated',
  title: string,
  description?: string,
  metadata?: any
)
```

---

## Cache Invalidation

When a new activity is logged, the dashboard activity cache is automatically invalidated:

```typescript
// Invalidate activity cache for founder when new activity is logged
if (context.founderId) {
  try {
    await lruCacheService.invalidate('dashboard', `activity_${context.founderId}`);
    appLogger.info(`🗑️ ACTIVITY: Cache invalidated for founder ${context.founderId}`);
  } catch (cacheError) {
    appLogger.error(`⚠️ ACTIVITY: Cache invalidation failed:`, cacheError);
    // Don't fail the activity logging if cache invalidation fails
  }
}
```

### Cache Key Pattern

| Namespace | Key Pattern | Purpose |
|-----------|-------------|---------|
| `dashboard` | `activity_{founderId}` | Recent activities for dashboard display |

---

## Querying Activities

### `getRecentActivities()`

Retrieves recent activities for a founder with optional filtering.

```typescript
static async getRecentActivities(
  founderId: string,
  limit: number = 10,
  activityType?: string
): Promise<UserActivity[]>
```

#### Usage Example

```typescript
// Get last 10 activities
const activities = await ActivityService.getRecentActivities(founderId);

// Get last 20 document activities
const docActivities = await ActivityService.getRecentActivities(founderId, 20, 'document');
```

---

## Data Migration

### `migrateExistingData()`

Bulk migrates historical data to the activity log for existing users.

```typescript
static async migrateExistingData(founderId: string): Promise<void>
```

#### Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Fetch founder data                                        │
│    - Get founder record                                      │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Create migration context                                  │
│    - sessionId: 'migration'                                  │
│    - ipAddress: '127.0.0.1'                                  │
│    - userAgent: 'System Migration'                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Migrate account activities                                │
│    - Account creation (signup)                               │
│    - Email verification (if verified)                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Migrate venture activities                                │
│    - For each venture: create activity                       │
│    - For each evaluation: score_generate activity            │
│    - For each document: upload activity                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Routes Using ActivityService

| Route | Activities Logged |
|-------|-------------------|
| `/api/v1/auth/login` | Authentication login |
| `/api/v1/auth/logout` | Authentication logout |
| `/api/v1/auth/signup` | Account signup |
| `/api/v1/dashboard/validation` | DASHBOARD_VISITED, PROOFSCORE_VIEWED |
| `/api/v1/files/upload` | Document upload |
| `/api/v1/experiments/*` | Experiment activities |
| Payment routes | Payment activities |

### Fire-and-Forget Pattern

Activity logging uses a fire-and-forget pattern to avoid impacting request performance:

```typescript
// Don't await - fire and forget
ActivityService.logActivity(context, {
  activityType: 'navigation',
  action: 'page_visit',
  title: 'Visited Dashboard'
}).catch(err => appLogger.error('Activity logging failed:', err));
```

### Error Resilience

Activity logging failures never block user flows:

```typescript
try {
  await ActivityService.logActivity(context, activity);
} catch (eventError) {
  appLogger.api('Failed to log event:', eventError);
  // Don't fail the request if event logging fails
}
```

---

## Best Practices

### 1. Always Include Context

```typescript
const context = ActivityService.getContextFromRequest(req);
await ActivityService.logActivity(context, { ... });
```

### 2. Use Typed Actions

Use the predefined action strings for consistency:
- Account: `'signup'`, `'email_verify'`, `'profile_update'`
- Auth: `'login'`, `'logout'`, `'password_reset'`, `'password_change'`
- Document: `'upload'`, `'download'`, `'delete'`, `'generate'`

### 3. Include Meaningful Metadata

```typescript
await ActivityService.logDocumentActivity(context, 'upload', 'Uploaded pitch deck', docId, fileName, folderName, {
  fileSize: '2.4 MB',
  mimeType: 'application/pdf',
  category: 'overview'
});
```

### 4. Use Entity References

Link activities to specific entities for querying:

```typescript
{
  entityId: ventureId,
  entityType: 'venture'
}
```
