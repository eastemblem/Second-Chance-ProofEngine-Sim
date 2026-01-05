# Dashboard APIs and Internal Workflows

## Overview

The Dashboard APIs provide the core data layer for the Second Chance platform's main user interface. These endpoints aggregate founder, venture, validation, and activity data with optimized caching and security checks. The APIs are designed for high performance with minimal database hits through a layered caching architecture.

---

## Table of Contents

1. [API Endpoints Overview](#api-endpoints-overview)
2. [Validation Endpoint](#validation-endpoint)
3. [Vault Endpoint](#vault-endpoint)
4. [Activity Endpoint](#activity-endpoint)
5. [Leaderboard Endpoint](#leaderboard-endpoint)
6. [DatabaseService Architecture](#databaseservice-architecture)
7. [Caching Architecture](#caching-architecture)
8. [Deal Room Access Verification](#deal-room-access-verification)
9. [ProofTags Resolution Workflow](#prooftags-resolution-workflow)
10. [Activity Logging Workflow](#activity-logging-workflow)
11. [File Categorization Workflow](#file-categorization-workflow)

---

## API Endpoints Overview

Dashboard endpoints require JWT authentication via `authenticateToken` middleware.

| Endpoint | Method | Auth | Purpose | Cache |
|----------|--------|------|---------|-------|
| `/api/v1/dashboard/validation` | GET | Required | ProofScore, ProofTags, Deal Room access | 5 min (header) |
| `/api/v1/dashboard/vault` | GET | Required | File counts, folder URLs, categories | LRU (5 min) |
| `/api/v1/dashboard/activity` | GET | Required | Recent user activities | 5 min (header) |
| `/api/v1/leaderboard` | GET | **None** | Top ventures by ProofScore | **None** |

**Note**: The leaderboard endpoint is public (no authentication required) and has no server-side caching.

---

## Validation Endpoint

### `GET /api/v1/dashboard/validation`

Returns the user's current validation status including ProofScore, ProofTags, and Deal Room access.

#### Request

**Headers**: `Authorization: Bearer <token>`

#### Response

```json
{
  "proofScore": 75,
  "proofTagsUnlocked": 12,
  "totalProofTags": 21,
  "evaluationDate": "2024-01-15T10:30:00.000Z",
  "founderName": "John Doe",
  "ventureName": "My Startup",
  "filesUploaded": 8,
  "status": "Investor Ready",
  "investorReady": true,
  "dealRoomAccess": true,
  "certificateUrl": "https://...",
  "reportUrl": "https://..."
}
```

**Field Details**:
- `status`: Dynamic string based on proofScore - "Deal Room Ready" (>=90), "Investor Ready" (>=70), or "Building Validation" (<70)
- `investorReady`: Boolean, true if proofScore >= 70
- `dealRoomAccess`: Boolean, true if proofScore >= 70 AND user has paid for Deal Room access
- `certificateUrl`/`reportUrl`: Only populated if `dealRoomAccess` is true (security gating)

#### Internal Workflow

```
Request arrives with JWT
         ↓
┌─────────────────────────────────────────────┐
│ 1. Extract founderId from JWT               │
│    - req.user.founderId                     │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 2. Log DASHBOARD_VISITED event              │
│    - ActivityService.logActivity()          │
│    - ProofCoach tracking                    │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 3. Fetch dashboard data                     │
│    - databaseService.getFounderWithLatest   │
│      Venture(founderId)                     │
│    - Returns: founder, venture, evaluation  │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 4. Check Deal Room access                   │
│    - paymentService.hasDealRoomAccess()     │
│    - proofScore >= 70 AND hasPaidAccess     │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 5. Resolve ProofTags                        │
│    - Priority: venture.prooftags            │
│    - Fallback: evaluation.prooftags         │
│    - Parse JSON, count tags                 │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 6. Log PROOFSCORE_VIEWED event              │
│    - If venture has proofScore > 0          │
│    - ActivityService.logActivity()          │
└─────────────────────────────────────────────┘
         ↓
Response with validation data
```

#### Data Sources

| Field | Source | Notes |
|-------|--------|-------|
| `proofScore` | `venture.proofScore` | Primary source (fallback: `evaluation.proofscore`) |
| `proofTagsUnlocked` | `venture.prooftags` | Primary source (fallback: `evaluation.prooftags`) |
| `filesUploaded` | `storage.getDocumentUploadCountByVenture()` | Count of documents in venture |
| `certificateUrl` | `venture.certificateUrl` | Only returned if `dealRoomAccess` is true |
| `reportUrl` | `venture.reportUrl` | Only returned if `dealRoomAccess` is true |
| `status` | Computed | Based on proofScore thresholds |
| `investorReady` | Computed | `proofScore >= 70` |
| `dealRoomAccess` | `paymentService.hasDealRoomAccess()` | `hasPaidAccess AND proofScore >= 70` |

---

## Vault Endpoint

### `GET /api/v1/dashboard/vault`

Returns file counts by category and folder URLs for the user's ProofVault.

#### Request

**Headers**: `Authorization: Bearer <token>`

#### Response

```json
{
  "overviewCount": 2,
  "marketCount": 3,
  "productCount": 1,
  "teamCount": 2,
  "totalCount": 8,
  "folderUrls": {
    "overview": "https://drive.google.com/...",
    "market": "https://drive.google.com/...",
    "product": "https://drive.google.com/...",
    "team": "https://drive.google.com/..."
  },
  "files": [
    {
      "id": "upload-uuid",
      "name": "pitch-deck.pdf",
      "category": "overview",
      "uploadDate": "2024-01-15T10:30:00.000Z",
      "size": "2.4 MB",
      "downloadUrl": "https://...",
      "type": "application/pdf"
    }
  ],
  "hasDealRoomAccess": true
}
```

#### Internal Workflow

```
Request arrives with JWT
         ↓
┌─────────────────────────────────────────────┐
│ 1. Check LRU cache                          │
│    - Key: vault_{founderId}                 │
│    - If hit: return cached data             │
└─────────────────────────────────────────────┘
         ↓ (cache miss)
┌─────────────────────────────────────────────┐
│ 2. Fetch dashboard data                     │
│    - databaseService.getFounderWithLatest   │
│      Venture(founderId)                     │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 3. Check Deal Room access (SECURITY)        │
│    - paymentService.hasDealRoomAccess()     │
│    - Controls downloadUrl visibility        │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 4. Query document_upload table              │
│    - Filter by ventureId                    │
│    - Order by createdAt                     │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 5. Categorize files                         │
│    - getCategoryFromFolderId()              │
│    - Map folderId to category name          │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 6. Format response                          │
│    - Include downloadUrl ONLY if paid       │
│    - Aggregate counts by category           │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 7. Cache result                             │
│    - lruCacheService.set()                  │
│    - TTL: 5 minutes                         │
└─────────────────────────────────────────────┘
         ↓
Response with vault data
```

#### Security: Download URL Gating

```typescript
const formattedFiles = files.map(file => ({
  ...fileData,
  // SECURITY: Only include downloadUrl if user has paid
  downloadUrl: hasDealRoomAccess ? (file.sharedUrl || '') : ''
}));
```

---

## Activity Endpoint

### `GET /api/v1/dashboard/activity`

Returns recent user activities with pagination.

#### Request

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `limit` (optional): Number of activities (default: 10)

#### Response

```json
[
  {
    "id": "activity-uuid",
    "title": "Uploaded pitch deck",
    "description": "Venture activity",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "type": "document",
    "icon": "file-text",
    "color": "blue"
  }
]
```

#### Internal Workflow

```
Request arrives with JWT
         ↓
┌─────────────────────────────────────────────┐
│ 1. Query user_activity table                │
│    - Filter by founderId                    │
│    - Order by createdAt DESC                │
│    - Limit to 10 (or specified limit)       │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 2. Format activities                        │
│    - Map activityType to icon               │
│    - Map activityType to color              │
│    - Format timestamps                      │
└─────────────────────────────────────────────┘
         ↓
Response with formatted activities
```

#### Activity Type Mapping

| Activity Type | Icon | Color |
|--------------|------|-------|
| `document` | `file-text` | `blue` |
| `payment` | `credit-card` | `green` |
| `venture` | `briefcase` | `purple` |
| `auth` | `shield` | `gray` |
| `account` | `user` | `orange` |

---

## Leaderboard Endpoint

### `GET /api/v1/leaderboard`

Returns top ventures ranked by ProofScore.

#### Request

**Query Parameters**:
- `limit` (optional): Number of entries (default: 10)

#### Response

```json
{
  "success": true,
  "data": [
    {
      "ventureName": "Top Startup",
      "totalScore": 94,
      "proofTagsCount": 18,
      "rank": 1,
      "analysisDate": "2024-01-15T10:30:00.000Z",
      "isReal": true
    }
  ],
  "source": "real",
  "totalEntries": 10,
  "realEntries": 10,
  "mockEntries": 0
}
```

#### Internal Workflow

```
Request arrives
         ↓
┌─────────────────────────────────────────────┐
│ 1. Fetch real leaderboard data              │
│    - storage.getLeaderboard(50)             │
│    - Query leaderboard table                │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 2. Format real entries                      │
│    - Assign ranks                           │
│    - Mark isReal: true                      │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 3. Fill gaps with mock data (if needed)     │
│    - Only if realData < limit               │
│    - Adjust mock scores below real          │
│    - Mark isReal: false                     │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 4. Sort and reassign ranks                  │
│    - Sort by totalScore DESC                │
│    - Reassign rank 1, 2, 3...               │
└─────────────────────────────────────────────┘
         ↓
Response with leaderboard data
```

#### Authentication

**This endpoint is public** - no JWT authentication is required. Anyone can view the leaderboard.

#### Caching

**No server-side caching** is implemented for the leaderboard endpoint. Each request queries the database directly via `storage.getLeaderboard()`.

#### Mock Data Behavior

When fewer than `limit` real entries exist:
1. Mock entries are added to fill the gap
2. Mock scores are adjusted to be lower than the lowest real score
3. Response indicates `source: "mixed"` and counts real vs mock entries
4. Mock entries are marked with `isReal: false`

**Data Source Transparency**: The response includes:
- `source`: `"real"` or `"mixed"` indicating data provenance
- `realEntries`: Count of actual database entries
- `mockEntries`: Count of placeholder entries

---

## DatabaseService Architecture

### Core Methods for Dashboard

The `DatabaseService` class provides optimized data fetching with caching:

#### `getDashboardData(founderId: string)`

Fetches comprehensive dashboard data in a single optimized query.

```typescript
async getDashboardData(founderId: string) {
  return await cacheService.getDashboardData(founderId, async () => {
    return await this.fetchDashboardDataFromDB(founderId);
  });
}
```

**Returns**:
```typescript
{
  founder: {
    founderId: string;
    fullName: string;
    email: string;
  };
  venture: {
    ventureId: string;
    name: string;
    folderStructure: any;
    certificateUrl: string | null;
    reportUrl: string | null;
    createdAt: Date;
  };
  evaluation: {
    evaluationId: string;
    proofscore: number;
    vaultscore: number;
    prooftags: any;
    fullApiResponse: any;
    dimensionScores: any;
    evaluationDate: Date;
  };
  documentUploads: DocumentUpload[];
  proofVaultRecords: ProofVault[];
}
```

#### `getFounderWithLatestVenture(founderId: string)`

Fetches founder with their most recent venture and evaluation.

```typescript
async getFounderWithLatestVenture(founderId: string) {
  return await cacheService.getFounder(founderId, async () => {
    return await this.fetchFounderWithLatestVentureFromDB(founderId);
  });
}
```

**SQL Strategy**:
- Single query with LEFT JOINs
- `founder` → `venture` → `evaluation`
- Ordered by `venture.createdAt DESC`, `evaluation.evaluationDate DESC`
- Limited to 1 result

#### `getCoachProgress(ventureId: string, founderId: string)`

Aggregates progress data for ProofCoach tracking.

**Parallel Queries**:
```typescript
const [
  experimentsCountResult,   // Completed experiments
  vaultUploadsResult,       // ProofVault uploads only
  allUploadsResult,         // All uploads
  artifactTypesResult,      // Distinct artifact types
  dealRoomAccess,           // Payment check
  coachStateResult          // Coach state record
] = await Promise.all([...]);
```

---

## Caching Architecture

### Implemented Caching Strategy

The platform uses primarily **in-memory LRU caching** for dashboard data:

```
┌─────────────────────────────────────────────┐
│             LRU Cache (Active)              │
│        (In-Memory, Sub-millisecond)         │
│                                             │
│  - lruCacheService.get(namespace, key)      │
│  - Used for: dashboard, founder, vault      │
│  - Per-namespace TTLs                       │
└─────────────────────────────────────────────┘
                    ↓ (miss)
┌─────────────────────────────────────────────┐
│             Database                        │
│              (PostgreSQL/Neon)              │
│                                             │
│  - Optimized queries with JOINs             │
│  - Results cached in LRU layer              │
└─────────────────────────────────────────────┘
```

**Note**: A KV store layer exists in `cache-service.ts` for ventures and leaderboard, but the leaderboard route currently queries the database directly without using the caching layer.

### Cache Keys (Active)

| Namespace | Key Pattern | Purpose | Used By |
|-----------|-------------|---------|---------|
| `dashboard` | `{founderId}` | Dashboard validation data | `/api/v1/dashboard/validation` |
| `dashboard` | `vault_{founderId}` | Vault file data | `/api/v1/dashboard/vault` |
| `founder` | `{founderId}` | Founder + venture data | DatabaseService |

### Uncached Endpoints

| Endpoint | Reason |
|----------|--------|
| `/api/v1/leaderboard` | Queries `storage.getLeaderboard()` directly (no cache layer) |
| `/api/v1/dashboard/activity` | Fresh query each request (uses Cache-Control headers only) |

### Cache Invalidation

```typescript
// After data mutations
cacheService.invalidateDashboard(founderId);
cacheService.invalidateFounder(founderId);
cacheService.invalidateVenture(ventureId);
cacheService.invalidateLeaderboard();
```

**Invalidation Triggers**:
- File upload → invalidate vault cache
- Payment completion → invalidate dashboard cache
- Experiment completion → invalidate validation cache
- ProofScore update → invalidate leaderboard cache

### CacheService Implementation

```typescript
async getDashboardData(founderId: string, fetchFn: () => Promise<any>) {
  // Try LRU cache first (sub-millisecond response)
  const cached = await lruCacheService.get('dashboard', founderId);
  if (cached !== null && cached !== undefined) {
    appLogger.cache(`Dashboard Cache HIT: ${founderId}`);
    return cached;
  }

  appLogger.cache(`Cache MISS: Fetching dashboard data ${founderId}`);
  const data = await fetchFn();
  
  // Only cache valid, non-null data
  if (data && data !== null && data !== undefined) {
    await lruCacheService.set('dashboard', founderId, data);
    appLogger.cache(`Dashboard Cache SET: ${founderId}`);
  }
  
  return data;
}
```

---

## Deal Room Access Verification

### Access Requirements

Users must satisfy **both** conditions to access Deal Room features:

1. **ProofScore >= 70** (qualifying score)
2. **Paid Access** (one-time payment completed)

### Verification Flow

```
┌─────────────────────────────────────────────┐
│ 1. Get ProofScore from venture              │
│    - venture.proofScore                     │
│    - hasQualifyingScore = score >= 70       │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 2. Check payment status                     │
│    - paymentService.hasDealRoomAccess()     │
│    - Queries payment records                │
│    - Returns boolean                        │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 3. Combine conditions                       │
│    - hasDealRoomAccess =                    │
│        hasPaidAccess && hasQualifyingScore  │
└─────────────────────────────────────────────┘
```

### Implementation

```typescript
// In dashboard routes
const { paymentService } = await import('../../services/payment-service.js');
const hasPaidAccess = await paymentService.hasDealRoomAccess(founderId);
const currentScore = dashboardData.venture?.proofScore || 0;
const hasQualifyingScore = currentScore >= 70;
const hasDealRoomAccess = hasPaidAccess && hasQualifyingScore;
```

### Access-Gated Features

| Feature | Gate Type |
|---------|-----------|
| File download URLs | `hasDealRoomAccess` |
| Certificate download | `hasDealRoomAccess` |
| Report download | `hasDealRoomAccess` |
| Investor matching | `hasDealRoomAccess` |

---

## ProofTags Resolution Workflow

### Priority Order

ProofTags are resolved with the following priority:

1. **`venture.prooftags`** - Includes pitch deck tags + experiment completion tags (PREFERRED)
2. **`evaluation.prooftags`** - Original pitch deck analysis tags (FALLBACK - may be stale)

### Resolution Logic

```typescript
let proofTagsSource = null;
let sourceType = 'none';

// ALWAYS prefer venture.prooftags
if (latestVenture?.prooftags) {
  proofTagsSource = latestVenture.prooftags;
  sourceType = 'venture';
  appLogger.api(`✅ ProofTag source: VENTURE table`);
} else {
  // WARNING: venture.prooftags is missing, falling back to evaluation
  appLogger.api(`⚠️ WARNING: venture.prooftags is NULL, falling back to evaluation`);
  if (latestEvaluation?.prooftags) {
    proofTagsSource = latestEvaluation.prooftags;
    sourceType = 'evaluation';
  }
}
```

### Parsing ProofTags

ProofTags can be stored in multiple formats:

```typescript
if (typeof proofTagsData === 'string') {
  proofTagsData = JSON.parse(proofTagsData);
}

if (Array.isArray(proofTagsData)) {
  // Array of tag names
  proofTagsUnlocked = proofTagsData.length;
} else if (proofTagsData && typeof proofTagsData === 'object') {
  // Object structure
  if (proofTagsData.unlockedTags && Array.isArray(proofTagsData.unlockedTags)) {
    proofTagsUnlocked = proofTagsData.unlockedTags.length;
  } else if (typeof proofTagsData.count === 'number') {
    proofTagsUnlocked = proofTagsData.count;
  } else {
    // Count non-null/true values
    proofTagsUnlocked = Object.values(proofTagsData)
      .filter(tag => tag && tag !== false && tag !== null).length;
  }
}
```

### Tag Sources

| Source | Description | When Updated |
|--------|-------------|--------------|
| Pitch Deck Analysis | Tags from EastEmblem API | After pitch deck scoring |
| Experiment Completion | Tags from validation map | After completing experiments |

---

## Activity Logging Workflow

### ActivityService Integration

Dashboard endpoints emit events for ProofCoach tracking:

```typescript
// Log DASHBOARD_VISITED event
await ActivityService.logActivity(
  { founderId },
  {
    activityType: 'venture',
    action: COACH_EVENTS.DASHBOARD_VISITED,
    title: 'Dashboard Visited',
    description: 'Accessed ProofCoach dashboard',
    metadata: { timestamp: new Date().toISOString() }
  }
);

// Log PROOFSCORE_VIEWED event
if (currentScore > 0) {
  await ActivityService.logActivity(
    { founderId },
    {
      activityType: 'venture',
      action: COACH_EVENTS.PROOFSCORE_VIEWED,
      title: 'ProofScore Viewed',
      description: `Current ProofScore: ${currentScore}`,
      metadata: { 
        proofScore: currentScore,
        ventureId: latestVenture.ventureId,
        timestamp: new Date().toISOString()
      }
    }
  );
}
```

### Error Handling

Activity logging failures do not fail the main request:

```typescript
try {
  await ActivityService.logActivity(...);
} catch (eventError) {
  appLogger.api('Failed to log event:', eventError);
  // Don't fail the request if event logging fails
}
```

### Event Types Logged by Dashboard

| Event | Trigger | ProofCoach Step |
|-------|---------|-----------------|
| `DASHBOARD_VISITED` | Any dashboard API call | Step 4 |
| `PROOFSCORE_VIEWED` | Validation API with score > 0 | Step 5 |

---

## File Categorization Workflow

### Category Mapping

Files are categorized based on their folder structure:

| Category | Description |
|----------|-------------|
| `overview` | General venture files, pitch deck |
| `market` | Market research, customer data |
| `product` | Product specifications, mockups |
| `team` | Team information, org charts |

### Categorization Logic

```typescript
async function getCategoryFromFolderId(folderId: string, founderId: string): Promise<string> {
  // Query proof_vault table for folder mappings
  const folderMappings = await db.select()
    .from(proofVault)
    .where(eq(proofVault.founderId, founderId));
  
  // Match folderId to category
  for (const mapping of folderMappings) {
    if (mapping.folderId === folderId) {
      return mapping.category || 'overview';
    }
  }
  
  // Default category
  return 'overview';
}
```

### File Count Aggregation

```typescript
async function categorizeFiles(files, folderMappings, founderId) {
  const counts = {
    overview: 0,
    market: 0,
    product: 0,
    team: 0
  };
  
  for (const file of files) {
    const category = await getCategoryFromFolderId(file.folderId, founderId);
    counts[category]++;
  }
  
  return counts;
}
```

---

## File Reference

| File | Purpose |
|------|---------|
| `server/routes/v1/dashboard.ts` | Main dashboard API endpoints (v1) |
| `server/routes/dashboard/index.ts` | Legacy dashboard endpoints |
| `server/routes/leaderboard.ts` | Leaderboard API handlers |
| `server/services/database-service.ts` | Optimized database queries |
| `server/services/cache-service.ts` | Multi-layer caching |
| `server/services/lru-cache-service.ts` | In-memory LRU cache |
| `server/services/kv-cache-service.ts` | Replit KV store integration |
| `server/services/payment-service.ts` | Deal Room payment verification |
| `server/services/activity-service.ts` | Activity logging |

---

## Performance Considerations

### Query Optimization

1. **Single Query with JOINs**: Dashboard data fetched in one query
2. **Parallel Queries**: Independent data fetched concurrently
3. **Minimal Columns**: Only required fields selected
4. **Indexed Lookups**: Queries use primary key indexes

### Caching Strategy

1. **LRU Cache First**: Sub-millisecond response for frequent requests
2. **5-Minute TTL**: Balance between freshness and performance
3. **Smart Invalidation**: Only invalidate affected cache entries
4. **No Empty Caching**: Null results are not cached

### Response Headers

```typescript
res.set('Cache-Control', 'public, max-age=300');
```

This allows CDNs and browsers to cache responses for 5 minutes.
