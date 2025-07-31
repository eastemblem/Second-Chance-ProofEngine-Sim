import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { databaseService } from '../../services/database-service';
import { appLogger } from '../../utils/logger';
import { authenticateToken } from '../../middleware/token-auth';

const router = Router();

// JWT authentication is now applied globally in v1/index.ts

// Dashboard validation endpoint - JWT AUTHENTICATED
router.get('/validation', asyncHandler(async (req: Request, res: Response) => {
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

    const { founder: founderData, venture: latestVenture, latestEvaluation } = dashboardData;
    const currentScore = latestEvaluation?.proofscore || 0;

    // FIXED: Extract ProofTags from JSON field and count unlocked tags
    let proofTagsUnlocked = 0;
    if (latestEvaluation?.prooftags) {
      try {
        let proofTagsData = latestEvaluation.prooftags;
        
        // Handle string JSON that needs parsing
        if (typeof proofTagsData === 'string') {
          proofTagsData = JSON.parse(proofTagsData);
        }
        
        // The database shows it's an array of tag names, so count the array length
        if (Array.isArray(proofTagsData)) {
          proofTagsUnlocked = proofTagsData.length;
          appLogger.api(`ProofTags found: ${proofTagsUnlocked} tags - ${JSON.stringify(proofTagsData.slice(0, 3))}...`);
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
        }
      } catch (error) {
        appLogger.api('Error parsing prooftags JSON:', error);
        proofTagsUnlocked = 0;
      }
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
    };

    // Get files count from storage service
    const { storage } = await import('../../storage');
    const totalFiles = await storage.getDocumentUploadCountByVenture(dashboardData.venture.ventureId);
    validationData.filesUploaded = totalFiles;

    appLogger.api(`FIXED: Returning validation data for ${founderData?.fullName}, score: ${currentScore}, files: ${totalFiles}`);
    res.json(validationData);
  } catch (error) {
    appLogger.api("FIXED: Dashboard validation error:", error);
    res.status(500).json({ error: "Failed to load validation data" });
  }
}));

// Dashboard vault endpoint - JWT AUTHENTICATED
router.get('/vault', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Authentication token required" });
  }
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({ error: "Venture not found" });
    }

    // Get file counts by category for vault statistics only
    const { storage } = await import('../../storage');
    const totalFiles = await storage.getDocumentUploadCountByVenture(dashboardData.venture.ventureId);
    
    // Get file counts by category using database-driven approach
    const { db } = await import('../../db');
    const { documentUpload, proofVault } = await import('@shared/schema');
    const { eq, sql } = await import('drizzle-orm');
    
    const fileCounts = { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 };
    
    // Get file counts by joining with proof vault for categorization (counts only, no file data)
    const fileCountsQuery = await db
      .select({
        folderId: documentUpload.folderId,
        folderName: proofVault.folderName,
        count: sql<number>`count(*)::int`
      })
      .from(documentUpload)
      .leftJoin(proofVault, eq(proofVault.subFolderId, documentUpload.folderId))
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId))
      .groupBy(documentUpload.folderId, proofVault.folderName);
    
    // Categorize file counts based on folder names
    for (const result of fileCountsQuery) {
      const category = getCategoryFromFolderName(result.folderName || '');
      switch (category) {
        case 'overview': fileCounts.overview += result.count; break;
        case 'problem_proof': fileCounts.problemProof += result.count; break;
        case 'solution_proof': fileCounts.solutionProof += result.count; break;
        case 'demand_proof': fileCounts.demandProof += result.count; break;
        case 'credibility_proof': fileCounts.credibilityProof += result.count; break;
        case 'commercial_proof': fileCounts.commercialProof += result.count; break;
        case 'investor_pack': fileCounts.investorPack += result.count; break;
        default: fileCounts.overview += result.count;
      }
    }
    
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

    res.json(vaultData);
  } catch (error) {
    console.error("Dashboard vault error:", error);
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
    console.error("Dashboard activity error:", error);
    res.status(500).json({ error: "Failed to load activity data" });
  }
}));

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

// SOLUTION 3: Pattern-based categorization - NO hardcoded folder IDs, NO recursion risk
function getCategoryFromFolderPattern(
  folderName: string | null, 
  folderId: string, 
  parentFolderId: string | null,
  folderMappings: Array<{subFolderId: string; folderName: string; parentFolderId: string | null}>
): string {
  // Step 1: Direct main category pattern matching (primary method)
  if (folderName) {
    const categoryMap = getCategoryFromPatternName(folderName);
    if (categoryMap) return categoryMap;
  }
  
  // Step 2: Check parent folder pattern (for subfolders)
  if (parentFolderId) {
    const parentFolder = folderMappings.find(f => f.subFolderId === parentFolderId);
    if (parentFolder?.folderName) {
      const parentCategory = getCategoryFromPatternName(parentFolder.folderName);
      if (parentCategory) return parentCategory;
    }
  }
  
  // Step 3: Iterative traversal up hierarchy (safe, non-recursive)
  let currentFolderId = parentFolderId;
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops
  
  while (currentFolderId && iterations < maxIterations) {
    const currentFolder = folderMappings.find(f => f.subFolderId === currentFolderId);
    if (!currentFolder) break;
    
    // Check if current folder matches a main category pattern
    if (currentFolder.folderName) {
      const category = getCategoryFromPatternName(currentFolder.folderName);
      if (category) return category;
    }
    
    // Move up to parent (break circular references)
    if (currentFolder.parentFolderId === currentFolderId) {
      break; // Prevent self-referencing loops
    }
    
    currentFolderId = currentFolder.parentFolderId;
    iterations++;
  }
  
  // Default fallback
  return 'Overview';
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
      console.error('Error getting category from database:', error);
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

export default router;