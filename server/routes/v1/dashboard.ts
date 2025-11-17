import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { databaseService } from '../../services/database-service';
import { lruCacheService } from '../../services/lru-cache-service';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';
import { ActivityService } from '../../services/activity-service';
import { COACH_EVENTS } from '../../../shared/config/coach-events';

const router = Router();

// Helper function for hierarchical folder categorization
function findMainCategoryForFile(folderId: string | null, folderLookup: Map<string, any>, depth = 0): string {
  if (depth > 5 || !folderId) return '0_Overview'; // Prevent infinite loops
  
  const currentFolder = folderLookup.get(folderId);
  if (!currentFolder) return '0_Overview';
  
  // If this folder name indicates a main category, return it
  if (currentFolder.folderName && currentFolder.folderName.match(/^[0-6]_/)) {
    return currentFolder.folderName;
  }
  
  // Otherwise, check parent folder
  if (currentFolder.parentFolderId && currentFolder.parentFolderId !== folderId) {
    return findMainCategoryForFile(currentFolder.parentFolderId, folderLookup, depth + 1);
  }
  
  return '0_Overview'; // Default fallback
}

// JWT authentication is now applied globally in v1/index.ts

// Dashboard validation endpoint - JWT AUTHENTICATED
router.get('/validation', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  if (!founderId) {
    appLogger.api('Authentication failed - no founderId');
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    appLogger.api(`📡 VALIDATION API: Fetching data for founder ${founderId}`);
    
    // Emit DASHBOARD_VISITED event for ProofCoach tracking
    try {
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
    } catch (eventError) {
      appLogger.api('Failed to log DASHBOARD_VISITED event:', eventError);
      // Don't fail the request if event logging fails
    }
    
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData) {
      return res.status(404).json({ error: "Founder not found" });
    }

    const { founder: founderData, venture: latestVenture, latestEvaluation } = dashboardData;
    
    appLogger.api(`📊 VALIDATION API: Venture ${latestVenture?.ventureId} retrieved from database`);
    
    // FIXED: Get proofScore from venture table (source of truth), not evaluation table
    const currentScore = latestVenture?.proofScore || 0;

    // CRITICAL: Extract ProofTags from venture table ONLY (single source of truth)
    let proofTagsUnlocked = 0;
    let proofTagsSource = null;
    let sourceType = 'none';
    
    // ALWAYS prefer venture.prooftags (includes pitch deck tags + experiment completion tags)
    if (latestVenture?.prooftags) {
      proofTagsSource = latestVenture.prooftags;
      sourceType = 'venture';
      appLogger.api(`✅ ProofTag source: VENTURE table (ventureId: ${latestVenture.ventureId})`);
    } else {
      // WARNING: venture.prooftags is missing, falling back to evaluation (may be stale!)
      appLogger.api(`⚠️ WARNING: venture.prooftags is NULL/empty for ventureId ${latestVenture?.ventureId}, falling back to evaluation table (STALE DATA)`);
      if (latestEvaluation?.prooftags) {
        proofTagsSource = latestEvaluation.prooftags;
        sourceType = 'evaluation';
        appLogger.api(`⚠️ ProofTag source: EVALUATION table (evaluationId: ${latestEvaluation.evaluationId}) - THIS MAY BE STALE!`);
      }
    }
    
    if (proofTagsSource) {
      try {
        let proofTagsData = proofTagsSource;
        
        // Handle string JSON that needs parsing
        if (typeof proofTagsData === 'string') {
          proofTagsData = JSON.parse(proofTagsData);
        }
        
        // The database shows it's an array of tag names, so count the array length
        if (Array.isArray(proofTagsData)) {
          proofTagsUnlocked = proofTagsData.length;
          appLogger.api(`📊 ProofTags count: ${proofTagsUnlocked} tags from ${sourceType.toUpperCase()} - First 3: ${JSON.stringify(proofTagsData.slice(0, 3))}`);
        } else if (proofTagsData && typeof proofTagsData === 'object') {
          // Handle different ProofTags JSON structures
          if (proofTagsData.unlockedTags && Array.isArray(proofTagsData.unlockedTags)) {
            proofTagsUnlocked = proofTagsData.unlockedTags.length;
          } else if (typeof proofTagsData.count === 'number') {
            proofTagsUnlocked = proofTagsData.count;
          } else {
            // Count non-null/true values in the tags object
            proofTagsUnlocked = Object.values(proofTagsData).filter(tag => tag && tag !== false && tag !== null).length;
          }
          appLogger.api(`📊 ProofTags count: ${proofTagsUnlocked} tags from ${sourceType.toUpperCase()} (object structure)`);
        }
      } catch (error) {
        appLogger.api(`❌ Error parsing prooftags JSON from ${sourceType}:`, error);
        proofTagsUnlocked = 0;
      }
    } else {
      appLogger.api(`⚠️ No ProofTags found in venture OR evaluation tables for founderId ${founderId}`);
    }

    // FIXED: Return the actual certificate and report URLs from database (these are the real URLs)
    const certificateUrl = latestVenture?.certificateUrl || latestVenture?.certificate_url || null;
    const reportUrl = latestVenture?.reportUrl || latestVenture?.report_url || null;

    const validationData = {
      proofScore: currentScore,
      proofTagsUnlocked: proofTagsUnlocked,
      totalProofTags: 21,
      evaluationDate: latestEvaluation?.created_at?.toISOString(),
      founderName: founderData?.fullName || founderData?.email?.split('@')[0] || 'Founder',
      ventureName: latestVenture?.name || 'Your Venture',
      filesUploaded: 0, // Will be calculated from actual document count
      status: currentScore >= 90 ? 'Deal Room Ready' : currentScore >= 70 ? 'Investor Ready' : 'Building Validation',
      investorReady: currentScore >= 70,
      dealRoomAccess: currentScore >= 90,
      certificateUrl,
      reportUrl
      // REMOVED: vaultScore - this is provided by the vault API instead
    };

    // Get files count from storage service
    const { storage } = await import('../../storage');
    const totalFiles = await storage.getDocumentUploadCountByVenture(dashboardData.venture.ventureId);
    validationData.filesUploaded = totalFiles;

    appLogger.api(`✅ VALIDATION API: Returning data - ProofScore: ${currentScore}, ProofTags: ${proofTagsUnlocked}, Files: ${totalFiles}`);
    res.json(validationData);
  } catch (error) {
    appLogger.api("FIXED: Dashboard validation error:", error);
    res.status(500).json({ error: "Failed to load validation data" });
  }
}));

// Dashboard vault endpoint - JWT AUTHENTICATED WITH OPTIMIZED CACHING
router.get('/vault', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Authentication token required" });
  }
  
  const cacheKey = `vault_${founderId}`;
  const performanceTimer = Date.now();
  
  try {
    // OPTIMIZATION 1: Check LRU cache first for recent vault data
    const cachedData = await lruCacheService.get('dashboard', cacheKey);
    if (cachedData) {
      appLogger.api(`CACHE HIT: Vault data served from cache in ${Date.now() - performanceTimer}ms`);
      return res.json(cachedData);
    }
    
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({ error: "Venture not found" });
    }

    // Get file counts by category using the same proven logic as before (but without returning files)
    const { db } = await import('../../db');
    const { documentUpload, proofVault } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    // OPTIMIZATION 2: Single optimized query with complete folder hierarchy data
    const filesWithCategories = await db
      .select({
        folderId: documentUpload.folderId,
        folderName: proofVault.folderName,
        parentFolderId: proofVault.parentFolderId
      })
      .from(documentUpload)
      .leftJoin(proofVault, eq(proofVault.subFolderId, documentUpload.folderId))
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId));

    // Get complete folder mappings for hierarchy resolution (single additional query)  
    const folderMappings = await db.select({
      subFolderId: proofVault.subFolderId,
      folderName: proofVault.folderName,
      parentFolderId: proofVault.parentFolderId
    })
    .from(proofVault)
    .where(eq(proofVault.ventureId, dashboardData.venture.ventureId));
    
    const queryTime = Date.now() - performanceTimer;
    appLogger.api(`PERFORMANCE: Database queries completed in ${queryTime}ms for ${filesWithCategories.length} files`);
    
    appLogger.api(`Using folder name pattern matching for ${folderMappings.length} folders - NO hardcoded IDs`);
    
    // WORKING CATEGORIZATION LOGIC: Process files using hierarchical folder traversal
    const fileCounts = { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 };
    
    // Create a lookup map for faster folder resolution
    const folderLookup = new Map();
    folderMappings.forEach(folder => {
      folderLookup.set(folder.subFolderId, folder);
    });
    
    // OPTIMIZED: Parallel processing with batch categorization
    const startTime = Date.now();
    let debugCount = 0;
    
    for (const fileData of filesWithCategories) {
      const category = findMainCategoryForFile(fileData.folderId, folderLookup);
      
      // Limited debug logging to reduce overhead
      if (debugCount < 5) {
        appLogger.api(`DEBUG: File in folder ${fileData.folderId} (${fileData.folderName}) -> Category: "${category}"`);
        debugCount++;
      }
      
      // Use direct assignment instead of switch for better performance
      if (category === '0_Overview') fileCounts.overview++;
      else if (category === '1_Problem_Proof') fileCounts.problemProof++;
      else if (category === '2_Solution_Proof') fileCounts.solutionProof++;
      else if (category === '3_Demand_Proof') fileCounts.demandProof++;
      else if (category === '4_Credibility_Proof') fileCounts.credibilityProof++;
      else if (category === '5_Commercial_Proof') fileCounts.commercialProof++;
      else if (category === '6_Investor_Pack') fileCounts.investorPack++;
      else fileCounts.overview++; // Default fallback
    }
    
    const processingTime = Date.now() - startTime;
    appLogger.api(`PERFORMANCE: Categorized ${filesWithCategories.length} files in ${processingTime}ms`);
    
    const totalFiles = filesWithCategories.length;
    appLogger.api(`Vault counts - Overview: ${fileCounts.overview}, Problem: ${fileCounts.problemProof}, Solution: ${fileCounts.solutionProof}, Demand: ${fileCounts.demandProof}, Credibility: ${fileCounts.credibilityProof}, Commercial: ${fileCounts.commercialProof}, Investor: ${fileCounts.investorPack}`);

    const vaultData = {
      overviewCount: fileCounts.overview,
      problemProofCount: fileCounts.problemProof,
      solutionProofCount: fileCounts.solutionProof,
      demandProofCount: fileCounts.demandProof,
      credibilityProofCount: fileCounts.credibilityProof,
      commercialProofCount: fileCounts.commercialProof,
      investorPackCount: fileCounts.investorPack,
      totalFiles: totalFiles,
      vaultScore: dashboardData.venture.vaultScore || 0, // Fetch VaultScore from venture table
      ventureId: dashboardData.venture.ventureId,
      ventureName: dashboardData.venture.name,
      folders: [ // FIXED: Add folder structure to match frontend interface
        { name: "0_Overview", displayName: "Overview", count: fileCounts.overview },
        { name: "1_Problem_Proof", displayName: "Problem Proofs", count: fileCounts.problemProof },
        { name: "2_Solution_Proof", displayName: "Solution Proofs", count: fileCounts.solutionProof },
        { name: "3_Demand_Proof", displayName: "Demand Proofs", count: fileCounts.demandProof },
        { name: "4_Credibility_Proof", displayName: "Credibility Proofs", count: fileCounts.credibilityProof },
        { name: "5_Commercial_Proof", displayName: "Commercial Proofs", count: fileCounts.commercialProof },
        { name: "6_Investor_Pack", displayName: "Investor Pack", count: fileCounts.investorPack }
      ],
      folderUrls: {
        // FIXED: Add parent folder URL for "Your Proof Vault" link
        root: dashboardData.venture?.folderStructure?.url || 
              `https://app.box.com/folder/${dashboardData.venture?.folderStructure?.id || '0'}`,
        // Individual category folder URLs
        ...Object.entries(dashboardData.venture?.folderStructure?.folders || {}).reduce((urls, [category, folderId]) => {
          urls[category] = `https://app.box.com/folder/${folderId}`;
          return urls;
        }, {} as Record<string, string>)
      }
    };

    // OPTIMIZATION 3: Cache the processed result for 2 minutes (faster than DB each time)
    await lruCacheService.set('dashboard', cacheKey, vaultData); // 2 minute cache
    
    const totalTime = Date.now() - performanceTimer;
    appLogger.api(`PERFORMANCE: Complete vault request processed in ${totalTime}ms (${filesWithCategories.length} files)`);
    
    res.json(vaultData);
  } catch (error) {
    appLogger.api("Dashboard vault error:", error);
    res.status(500).json({ error: "Failed to load vault data" });
  }
}));

// Dashboard activity endpoint - JWT AUTHENTICATED with pagination
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Authentication token required" });
  }
  
  try {
    const { db } = await import('../../db');
    const { userActivity } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    // PAGINATION: Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    appLogger.api(`PAGINATION: Fetching activities - page: ${page}, limit: ${limit}, offset: ${offset}`);

    // Get activities with pagination
    const activities = await db.select()
      .from(userActivity)
      .where(eq(userActivity.founderId, founderId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination metadata
    const totalCountResult = await db.select({ count: userActivity.activityId })
      .from(userActivity)
      .where(eq(userActivity.founderId, founderId));
    
    const totalActivities = totalCountResult.length;
    const totalPages = Math.ceil(totalActivities / limit);
    const hasMore = page < totalPages;

    // Format activities for frontend display
    const formattedActivities = activities.map(activity => ({
      id: activity.activityId,
      type: activity.activityType,
      title: activity.title || activity.action || 'Activity',
      description: activity.description || `${activity.action} completed`,
      timestamp: activity.createdAt?.toISOString() || new Date().toISOString(),
      icon: getActivityIcon(activity.activityType, activity.action),
      color: getActivityColor(activity.activityType)
    }));

    const response = {
      activities: formattedActivities,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalActivities: totalActivities,
        hasMore: hasMore,
        limit: limit
      }
    };

    appLogger.api(`PAGINATION: Returning ${formattedActivities.length} activities (page ${page}/${totalPages})`);
    res.json(response);
  } catch (error) {
    appLogger.api('Dashboard activity error', { 
      founderId: (req as any).user?.founderId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({ error: "Failed to load activity data" });
  }
}));

// Removed unused function - using new hierarchical approach instead

// EXACT COPY from working files API
function getCategoryFromFolderNameWorking(folderName: string): string {
  const normalizedName = folderName.toLowerCase();
  
  if (normalizedName.includes('overview') || normalizedName.includes('0_')) return 'overview';
  if (normalizedName.includes('problem') || normalizedName.includes('1_')) return 'problem_proof';
  if (normalizedName.includes('solution') || normalizedName.includes('2_')) return 'solution_proof';
  if (normalizedName.includes('demand') || normalizedName.includes('3_')) return 'demand_proof';
  if (normalizedName.includes('credibility') || normalizedName.includes('4_')) return 'credibility_proof';
  if (normalizedName.includes('commercial') || normalizedName.includes('5_')) return 'commercial_proof';
  if (normalizedName.includes('investor') || normalizedName.includes('6_')) return 'investor_pack';
  
  return 'overview';
}

// EXACT COPY from working files API  
function getCategoryDisplayNameWorking(folderName: string): string {
  const category = getCategoryFromFolderNameWorking(folderName);
  const displayNames: Record<string, string> = {
    'overview': 'Overview',
    'problem_proof': 'Problem Proofs',
    'solution_proof': 'Solution Proofs',
    'demand_proof': 'Demand Proofs', 
    'credibility_proof': 'Credibility Proofs',
    'commercial_proof': 'Commercial Proofs',
    'investor_pack': 'Investor Pack'
  };
  
  return displayNames[category] || 'Overview';
}

// ROBUST: Non-recursive folder hierarchy map - NO STACK OVERFLOW RISK
function buildFolderCategoryMap(folderMappings: Array<{subFolderId: string; folderName: string; parentFolderId: string | null}>): Map<string, string> {
  const categoryMap = new Map<string, string>();
  
  // Define main category mappings
  const mainCategories = new Map<string, string>([
    ['0_Overview', 'Overview'],
    ['1_Problem_Proof', 'Problem Proofs'],
    ['2_Solution_Proof', 'Solution Proofs'], 
    ['3_Demand_Proof', 'Demand Proofs'],
    ['4_Credibility_Proof', 'Credibility Proofs'],
    ['5_Commercial_Proof', 'Commercial Proofs'],
    ['6_Investor_Pack', 'Investor Pack']
  ]);
  
  // Build parent lookup map for quick access
  const parentLookup = new Map<string, string>();
  folderMappings.forEach(folder => {
    if (folder.parentFolderId && folder.parentFolderId !== folder.subFolderId) {
      parentLookup.set(folder.subFolderId, folder.parentFolderId);
    }
  });
  
  // First pass: Map all main category folders by name
  folderMappings.forEach(folder => {
    if (folder.folderName && mainCategories.has(folder.folderName)) {
      const categoryName = mainCategories.get(folder.folderName)!;
      categoryMap.set(folder.subFolderId, categoryName);
    }
  });
  
  // Second pass: Iterative resolution (NO RECURSION)
  // Keep resolving until no more changes are made
  let changed = true;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    folderMappings.forEach(folder => {
      // Skip if already categorized or has no parent
      if (categoryMap.has(folder.subFolderId) || !folder.parentFolderId) {
        return;
      }
      
      // Skip circular references (parent pointing to self)
      if (folder.parentFolderId === folder.subFolderId) {
        categoryMap.set(folder.subFolderId, 'Overview'); // Default to Overview
        changed = true;
        return;
      }
      
      // Check if parent is already categorized
      if (categoryMap.has(folder.parentFolderId)) {
        categoryMap.set(folder.subFolderId, categoryMap.get(folder.parentFolderId)!);
        changed = true;
      }
    });
  }
  
  // Final pass: Default any remaining uncategorized folders to Overview
  folderMappings.forEach(folder => {
    if (!categoryMap.has(folder.subFolderId)) {
      categoryMap.set(folder.subFolderId, 'Overview');
    }
  });
  
  return categoryMap;
}



// Helper function to get category from folder name
function getCategoryFromFolderName(folderName: string): string {
  const normalizedName = folderName.toLowerCase();
  
  if (normalizedName.includes('overview') || normalizedName.includes('0_')) return 'overview';
  if (normalizedName.includes('problem') || normalizedName.includes('1_')) return 'problem_proof';
  if (normalizedName.includes('solution') || normalizedName.includes('2_')) return 'solution_proof';
  if (normalizedName.includes('demand') || normalizedName.includes('3_')) return 'demand_proof';
  if (normalizedName.includes('credibility') || normalizedName.includes('4_')) return 'credibility_proof';
  if (normalizedName.includes('commercial') || normalizedName.includes('5_')) return 'commercial_proof';
  if (normalizedName.includes('investor') || normalizedName.includes('6_')) return 'investor_pack';
  
  return 'overview';
}

// Helper function: Convert folder name patterns to category names
function getCategoryFromPatternName(folderName: string): string | null {
  const patterns: Record<string, string> = {
    '0_Overview': 'Overview',
    '1_Problem_Proof': 'Problem Proofs',
    '2_Solution_Proof': 'Solution Proofs',
    '3_Demand_Proof': 'Demand Proofs',
    '4_Credibility_Proof': 'Credibility Proofs',
    '5_Commercial_Proof': 'Commercial Proofs',
    '6_Investor_Pack': 'Investor Pack'
  };
  
  return patterns[folderName] || null;
}

// Keep original function for backward compatibility during transition
async function getCategoryFromFolderId(folderId: string, founderId?: string): Promise<string> {
  if (founderId) {
    try {
      const { getCategoryFromFolderIdDB } = await import('../../utils/folder-mapping');
      return await getCategoryFromFolderIdDB(folderId, founderId);
    } catch (error) {
      appLogger.api('Error getting category from database', { 
        folderId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  // Fallback to current working folder mapping
  const folderMap: Record<string, string> = {
    '332886218045': 'Overview',     // 0_Overview
    '332887480277': 'Problem Proofs', // 1_Problem_Proof  
    '332887446170': 'Solution Proofs', // 2_Solution_Proof
    '332885125206': 'Demand Proofs',   // 3_Demand_Proof
    '332885857453': 'Credibility Proofs', // 4_Credibility_Proof
    '332887928503': 'Commercial Proofs',  // 5_Commercial_Proof
    '332885728761': 'Investor Pack'       // 6_Investor_Pack
  };
  
  return folderMap[folderId] || 'Overview (default)';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getActivityIcon(activityType: string, action?: string): string {
  const iconMap: Record<string, string> = {
    'account': 'User',
    'authentication': 'Shield', 
    'venture': 'Building',
    'document': 'FileText',
    'evaluation': 'TrendingUp',
    'navigation': 'Navigation',
    'system': 'Settings'
  };
  
  // Special cases based on action
  if (action === 'email_verify') return 'CheckCircle';
  if (action === 'upload') return 'Upload';
  if (action === 'create') return 'Plus';
  if (action === 'score_generate') return 'Award';
  
  return iconMap[activityType] || 'Circle';
}

function getActivityColor(activityType: string): string {
  const colorMap: Record<string, string> = {
    'account': 'blue',
    'authentication': 'green',
    'venture': 'purple', 
    'document': 'yellow',
    'evaluation': 'green',
    'navigation': 'gray',
    'system': 'orange'
  };
  
  return colorMap[activityType] || 'gray';
}

// VaultScore endpoint - JWT AUTHENTICATED
router.get('/vault-score', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  if (!founderId) {
    appLogger.api('Authentication failed - no founderId');
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData) {
      return res.status(404).json({ error: "Founder not found" });
    }

    const { venture: latestVenture, latestEvaluation } = dashboardData;
    // FIXED: Get VaultScore from venture table (source of truth), not evaluation table
    const currentVaultScore = latestVenture?.vaultScore || 0;

    appLogger.api(`VaultScore retrieved for founder ${founderId}: ${currentVaultScore}`);

    res.json({
      success: true,
      data: {
        vaultScore: currentVaultScore,
        ventureId: latestVenture?.ventureId || null,
        evaluationId: latestEvaluation?.evaluationId || null
      }
    });
  } catch (error) {
    appLogger.api('VaultScore retrieval failed', { 
      founderId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    res.status(500).json({ error: "Failed to retrieve VaultScore" });
  }
}));

export default router;