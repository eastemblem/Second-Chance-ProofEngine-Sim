# Dashboard Endpoints Performance Analysis

## Performance Bottlenecks Identified

### 1. VAULT ENDPOINT (/api/v1/dashboard/vault) - CRITICAL ISSUES

**Current Performance Issues:**
- **N+1 Query Problem**: Individual `getCategoryFromFolderId()` calls for each file (lines 128, 146)
- **Synchronous File Processing**: `Promise.all()` with async categorization for each file
- **Complex Recursive Logic**: Deep nested folder traversal for each file (up to 10 levels)
- **Multiple Dynamic Imports**: Repeated `await import()` calls in loops
- **External API Calls**: EastEmblem API calls during categorization (line 221)
- **No Caching**: Complex folder categorization recalculated on every request

**Performance Impact:**
- If 50 files: 50+ individual database queries + recursive calls
- External API calls can add 2-5 seconds per uncategorized folder
- Complex recursive logic processes each file individually

### 2. ACTIVITY ENDPOINT (/api/v1/dashboard/activity) - MODERATE ISSUES

**Current Performance Issues:**
- **Simple Query**: Single database query (good)
- **No Caching**: Fresh query on every request
- **Inefficient Mapping**: Client-side processing for icons/colors

**Performance Impact:**
- Fast query but no optimization for repeated requests
- Minor processing overhead

### 3. LEADERBOARD ENDPOINT (/api/leaderboard) - MINIMAL ISSUES

**Current Performance Issues:**
- **Storage Layer Call**: Uses `storage.getLeaderboard(50)` (potentially unoptimized)
- **Mock Data Processing**: Unnecessary processing if real data sufficient
- **No Caching**: Recalculated on every request

## Optimization Solutions

### VAULT ENDPOINT - HIGH PRIORITY OPTIMIZATIONS

#### Solution 1: Implement Query Optimization & Caching
```typescript
// 1. Single JOIN query instead of N+1 queries
// 2. Cache folder categorization mapping
// 3. Batch process files by folder

const optimizedVaultQuery = async (ventureId: string) => {
  // Single query with JOINs
  const filesWithCategories = await db
    .select({
      file: documentUpload,
      folder: proofVault
    })
    .from(documentUpload)
    .leftJoin(proofVault, eq(proofVault.subFolderId, documentUpload.folderId))
    .where(eq(documentUpload.ventureId, ventureId))
    .orderBy(desc(documentUpload.createdAt));
    
  // Pre-build category mapping once
  const categoryMapping = await buildCategoryMapping(ventureId);
  
  return filesWithCategories;
};
```

#### Solution 2: Pre-computed Category Mapping
```typescript
// Cache folder-to-category mapping for 15 minutes
const categoryMappingCache = new Map<string, Map<string, string>>();

const buildCategoryMapping = async (ventureId: string): Promise<Map<string, string>> => {
  const cacheKey = `categories_${ventureId}`;
  
  if (categoryMappingCache.has(cacheKey)) {
    return categoryMappingCache.get(cacheKey)!;
  }
  
  // Single query to build complete mapping
  const folderMappings = await db.select().from(proofVault)
    .where(eq(proofVault.ventureId, ventureId));
    
  const mapping = new Map<string, string>();
  // Build complete folder hierarchy once
  for (const folder of folderMappings) {
    mapping.set(folder.subFolderId, resolveCategory(folder, folderMappings));
  }
  
  categoryMappingCache.set(cacheKey, mapping);
  setTimeout(() => categoryMappingCache.delete(cacheKey), 15 * 60 * 1000); // 15min TTL
  
  return mapping;
};
```

#### Solution 3: Eliminate External API Calls
```typescript
// Remove EastEmblem API calls from categorization
// Pre-populate proof_vault table during folder creation
// Use database-only approach with proper parent-child relationships
```

### ACTIVITY ENDPOINT - MODERATE PRIORITY OPTIMIZATIONS

#### Solution 1: Implement LRU Caching
```typescript
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  // Use existing LRU cache service
  const cacheKey = `activity_${founderId}`;
  
  let activities = await lruCacheService.get(cacheKey);
  
  if (!activities) {
    activities = await db.select()
      .from(userActivity)
      .where(eq(userActivity.founderId, founderId))
      .orderBy(desc(userActivity.createdAt))
      .limit(10);
      
    // Cache for 5 minutes
    await lruCacheService.set(cacheKey, activities, 5 * 60);
  }
  
  // Format activities (keep client-side processing minimal)
  res.json(formatActivities(activities));
}));
```

### LEADERBOARD ENDPOINT - LOW PRIORITY OPTIMIZATIONS

#### Solution 1: Database Query Optimization
```typescript
// Replace storage layer with direct optimized query
const getOptimizedLeaderboard = async (limit: number = 10) => {
  return await db
    .select({
      ventureName: venture.name,
      totalScore: evaluation.proofscore,
      analysisDate: evaluation.evaluationDate
    })
    .from(evaluation)
    .innerJoin(venture, eq(venture.ventureId, evaluation.ventureId))
    .orderBy(desc(evaluation.proofscore))
    .limit(limit);
};
```

## Implementation Priority

### Phase 1: VAULT Endpoint (Critical)
1. ✅ Implement single JOIN query
2. ✅ Add category mapping cache
3. ✅ Remove external API calls from critical path
4. ✅ Add LRU caching for complete vault data

### Phase 2: ACTIVITY Endpoint (Moderate)  
1. ✅ Add LRU caching (5-minute TTL)
2. ✅ Optimize icon/color mapping

### Phase 3: LEADERBOARD Endpoint (Low)
1. ✅ Direct database query
2. ✅ Add caching layer

## Expected Performance Improvements

- **VAULT Endpoint**: 80-90% reduction (from 5-10s to 0.5-1s)
- **ACTIVITY Endpoint**: 60-70% reduction (from 500ms to 150-200ms)  
- **LEADERBOARD Endpoint**: 40-50% reduction (from 300ms to 150-200ms)

## Monitoring & Validation

- Add performance timing logs
- Monitor cache hit rates
- Track query execution times
- Measure end-to-end response times