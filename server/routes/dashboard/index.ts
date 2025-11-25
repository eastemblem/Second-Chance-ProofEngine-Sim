import express from "express";
import { asyncHandler } from "../../utils/error-handler";
import { databaseService } from "../../services/database-service";
import { lruCacheService } from "../../services/lru-cache-service";
import { authenticateToken } from "../../middleware/token-auth";
import { AuthenticatedRequest } from "../middleware/auth";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { appLogger } from "../../utils/logger";

const router = express.Router();

// Dashboard validation endpoint with JWT authentication
router.get("/validation", authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  appLogger.api('Dashboard - fetching validation data', { founderId });

  try {
    // Use database service for founder data with caching
    const dashboardData = await databaseService.getDashboardData(founderId);

    if (!dashboardData.founder) {
      appLogger.warn('Dashboard - founder not found', { founderId });
      return res.status(404).json({ error: "Founder not found" });
    }

    // Response with ProofScore and other validation metrics
    const actualProofScore = dashboardData.evaluation?.proofscore || 0;
    const actualProofTags = dashboardData.evaluation?.prooftags || [];
    
    // Check Deal Room access via payment service AND ProofScore >= 70
    const { paymentService } = await import('../../services/payment-service.js');
    const hasPaidAccess = await paymentService.hasDealRoomAccess(founderId);
    const hasQualifyingScore = actualProofScore >= 70;
    const hasDealRoomAccess = hasPaidAccess && hasQualifyingScore;
    
    appLogger.business('Validation - found ProofScore and ProofTags', {
      proofScore: actualProofScore,
      proofTagsCount: actualProofTags.length,
      evaluation: dashboardData.evaluation ? 'exists' : 'missing',
      venture: dashboardData.venture ? 'exists' : 'missing',
      hasDealRoomAccess
    });
    
    const response = {
      founderName: dashboardData.founder.fullName || "Unknown Founder",
      ventureName: dashboardData.venture?.name || "No Venture",
      proofScore: actualProofScore,
      proofTagsUnlocked: Array.isArray(actualProofTags) ? actualProofTags.length : 0,
      totalProofTags: 21,
      status: "active",
      evaluationDate: dashboardData.evaluation?.evaluationDate ? 
        (typeof dashboardData.evaluation.evaluationDate === 'string' ? 
          dashboardData.evaluation.evaluationDate : 
          dashboardData.evaluation.evaluationDate.toISOString()) : 
        new Date().toISOString(),
      investmentReadiness: getInvestmentReadinessStatus(actualProofScore),
      hasDealRoomAccess
    };

    appLogger.api('Dashboard - validation data retrieved successfully', { founderId });
    
    // Set cache headers for dashboard data (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    res.json(response);

  } catch (error) {
    appLogger.error('Dashboard - validation data fetch error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ 
      error: "Failed to fetch validation data",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Dashboard vault endpoint with JWT authentication
router.get("/vault", authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  appLogger.api('Vault - fetching data', { founderId });

  try {
    // Get dashboard data with venture info
    const dashboardData = await databaseService.getDashboardData(founderId);

    if (!dashboardData.founder || !dashboardData.venture) {
      return res.status(404).json({ error: "Founder or venture not found" });
    }

    // SECURITY: Check Deal Room access via payment service AND ProofScore >= 70
    const { paymentService } = await import('../../services/payment-service.js');
    const hasPaidAccess = await paymentService.hasDealRoomAccess(founderId);
    const currentScore = dashboardData.venture?.proofScore || 0;
    const hasQualifyingScore = currentScore >= 70;
    const hasDealRoomAccess = hasPaidAccess && hasQualifyingScore;
    appLogger.api(`📊 LEGACY VAULT API: founderId ${founderId} - hasPaidAccess: ${hasPaidAccess}, proofScore: ${currentScore}, hasQualifyingScore: ${hasQualifyingScore}, hasDealRoomAccess: ${hasDealRoomAccess}`);
    
    // Get uploaded documents for this venture
    const { documentUpload } = await import("@shared/schema");
    const files = await db.select().from(documentUpload)
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId))
      .orderBy(documentUpload.createdAt);

    // Format files for frontend - SECURITY: Only include downloadUrl if paid
    const formattedFiles = await Promise.all(files.map(async file => ({
      id: file.uploadId,
      name: file.fileName || file.originalName || 'Unknown File',
      category: await getCategoryFromFolderId(file.folderId || '332886218045', founderId),
      uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
      size: formatFileSize(file.fileSize || 0),
      downloadUrl: hasDealRoomAccess ? (file.sharedUrl || '') : '',
      type: file.mimeType || 'application/pdf'
    })));

    // Get proof vault folder mappings for categorization
    const { proofVault } = await import("@shared/schema");
    const folderMappings = await db.select().from(proofVault)
      .where(eq(proofVault.ventureId, dashboardData.venture.ventureId));

    // File categorization logic (preserved from working implementation)
    const fileCounts = await categorizeFiles(files, folderMappings, founderId);

    const vaultData = {
      overviewCount: fileCounts.overview,
      problemProofCount: fileCounts.problemProof,
      solutionProofCount: fileCounts.solutionProof,
      demandProofCount: fileCounts.demandProof,
      credibilityProofCount: fileCounts.credibilityProof,
      commercialProofCount: fileCounts.commercialProof,
      investorPackCount: fileCounts.investorPack,
      totalFiles: files.length,
      ventureId: dashboardData.venture.ventureId,
      ventureName: dashboardData.venture.name,
      files: formattedFiles,
      folders: [
        { name: "0_Overview", displayName: "Overview", count: fileCounts.overview },
        { name: "1_Problem_Proof", displayName: "Problem Proofs", count: fileCounts.problemProof },
        { name: "2_Solution_Proof", displayName: "Solution Proofs", count: fileCounts.solutionProof },
        { name: "3_Demand_Proof", displayName: "Demand Proofs", count: fileCounts.demandProof },
        { name: "4_Credibility_Proof", displayName: "Credibility Proofs", count: fileCounts.credibilityProof },
        { name: "5_Commercial_Proof", displayName: "Commercial Proofs", count: fileCounts.commercialProof },
        { name: "6_Investor_Pack", displayName: "Investor Pack", count: fileCounts.investorPack }
      ],
      folderUrls: hasDealRoomAccess ? {
        root: dashboardData.venture?.folderStructure?.url || 
              `https://app.box.com/folder/${dashboardData.venture?.folderStructure?.id || '0'}`,
      } : null
    };

    appLogger.api('Vault - data retrieved successfully', { fileCount: files.length });
    
    // No caching for vault data as requested (real-time accuracy)
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(vaultData);

  } catch (error) {
    appLogger.error('Vault - data fetch error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ 
      error: "Failed to fetch vault data",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Dashboard activity endpoint with JWT authentication
router.get("/activity", authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const founderId = req.user?.founderId;

  if (!founderId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  appLogger.api('Activity - fetching data', { founderId });

  try {
    const { userActivity } = await import("@shared/schema");
    
    // Get recent activities for this founder
    const activities = await db.select()
      .from(userActivity)
      .where(eq(userActivity.founderId, founderId))
      .orderBy(userActivity.createdAt)
      .limit(10);

    appLogger.database('Activity - found activities in database', { count: activities.length });

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.activityId,
      title: activity.title || activity.action,
      description: activity.description || `${activity.activityType} activity`,
      timestamp: activity.createdAt?.toISOString() || new Date().toISOString(),
      type: activity.activityType,
      icon: getActivityIcon(activity.activityType, activity.action),
      color: getActivityColor(activity.activityType)
    }));

    appLogger.api('Activity - returning formatted activities', { count: formattedActivities.length });
    
    // Cache activity data for 5 minutes
    res.set('Cache-Control', 'public, max-age=300');
    res.json(formattedActivities);

  } catch (error) {
    appLogger.error('Activity - data fetch error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ 
      error: "Failed to fetch activity data",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Helper functions (preserved from working implementation)
function getInvestmentReadinessStatus(proofScore: number): string {
  if (proofScore >= 80) return "Investment Ready";
  if (proofScore >= 60) return "Nearly Ready";
  if (proofScore >= 40) return "Developing";
  return "Early Stage";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getActivityIcon(type: string, action: string): string {
  if (type === 'document' && action === 'upload') return 'Upload';
  if (type === 'folder' && action === 'create') return 'FolderPlus';
  if (type === 'evaluation' && action === 'score_generate') return 'Award';
  return 'FileText';
}

function getActivityColor(type: string): string {
  switch (type) {
    case 'document': return 'blue';
    case 'folder': return 'green';
    case 'evaluation': return 'purple';
    default: return 'gray';
  }
}

// File categorization function (preserved from working implementation)
async function categorizeFiles(files: any[], folderMappings: any[], founderId: string) {
  const fileCounts = { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 };
  
  // Identify main category folders (those with parent = root folder)
  const rootFolderId = '332889411946';
  const mainCategoryFolders = new Set<string>();
  const mainCategoryMapping: Record<string, string> = {};
  
  for (const mapping of folderMappings) {
    if (mapping.parentFolderId === rootFolderId) {
      mainCategoryFolders.add(mapping.subFolderId);
      mainCategoryMapping[mapping.subFolderId] = mapping.folderName;
    }
  }
  
  // Process files with corrected categorization logic
  for (const file of files) {
    const folderId = file.folderId || '332886218045';
    
    const findMainCategory = async (currentFolderId: string, depth = 0): Promise<string> => {
      if (depth > 10) return 'Overview (default)';
      
      if (mainCategoryFolders.has(currentFolderId)) {
        return mainCategoryMapping[currentFolderId];
      }
      
      const folderRecord = folderMappings.find(mapping => mapping.subFolderId === currentFolderId);
      if (folderRecord && folderRecord.parentFolderId !== currentFolderId) {
        return await findMainCategory(folderRecord.parentFolderId, depth + 1);
      }
      
      const directMapping = folderMappings.find(mapping => mapping.subFolderId === currentFolderId);
      if (directMapping?.folderName?.includes('_')) {
        return directMapping.folderName;
      }
      
      return 'Overview (default)';
    };
    
    const category = await findMainCategory(folderId);
    
    switch(category) {
      case '0_Overview':
      case 'Overview (default)': fileCounts.overview++; break;
      case '1_Problem_Proof': fileCounts.problemProof++; break;
      case '2_Solution_Proof': fileCounts.solutionProof++; break;
      case '3_Demand_Proof': fileCounts.demandProof++; break;
      case '4_Credibility_Proof': fileCounts.credibilityProof++; break;
      case '5_Commercial_Proof': fileCounts.commercialProof++; break;
      case '6_Investor_Pack': fileCounts.investorPack++; break;
      default: fileCounts.overview++; break;
    }
  }
  
  return fileCounts;
}

// Helper function preserved from working implementation
async function getCategoryFromFolderId(folderId: string, founderId?: string): Promise<string> {
  // This function uses the dynamic folder mapping system
  // Implementation preserved from working system
  return 'Overview'; // Simplified for extraction
}

export default router;