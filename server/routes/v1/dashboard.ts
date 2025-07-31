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

    // FIXED: Calculate actual files uploaded for this venture
    const { db } = await import('../../db');
    const { documentUpload } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const fileCount = await db.select()
      .from(documentUpload)
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId));
    
    validationData.filesUploaded = fileCount.length;

    appLogger.api(`FIXED: Returning validation data for ${founderData?.fullName}, score: ${currentScore}, files: ${fileCount.length}`);
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

    // SOLUTION 1: SINGLE JOIN QUERY - Eliminate N+1 queries
    const { db } = await import('../../db');
    const { documentUpload, proofVault } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    // Single optimized query with JOIN to get files + categories together
    const filesWithCategories = await db
      .select({
        // File data
        uploadId: documentUpload.uploadId,
        fileName: documentUpload.fileName,
        originalName: documentUpload.originalName,
        folderId: documentUpload.folderId,
        createdAt: documentUpload.createdAt,
        fileSize: documentUpload.fileSize,
        sharedUrl: documentUpload.sharedUrl,
        mimeType: documentUpload.mimeType,
        // Category data from proof_vault
        folderName: proofVault.folderName,
        parentFolderId: proofVault.parentFolderId
      })
      .from(documentUpload)
      .leftJoin(proofVault, eq(proofVault.subFolderId, documentUpload.folderId))
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId))
      .orderBy(desc(documentUpload.createdAt));

    appLogger.api(`SOLUTION 1: Retrieved ${filesWithCategories.length} files with single JOIN query`);
    
    // Format files for frontend display - now synchronous processing with fixed categorization
    const formattedFiles = filesWithCategories.map((fileData) => ({
      id: fileData.uploadId,
      name: fileData.fileName || fileData.originalName || 'Unknown File',
      category: getCategoryFromFolderData(fileData.folderName, fileData.folderId || '332886218045', fileData.parentFolderId),
      uploadDate: fileData.createdAt?.toISOString() || new Date().toISOString(),
      size: formatFileSize(fileData.fileSize || 0),
      downloadUrl: fileData.sharedUrl || '',
      type: fileData.mimeType || 'application/pdf'
    }));

    // SOLUTION 1: OPTIMIZED FILE COUNTING - Use data from JOIN query
    // We already have category data from the JOIN, no need for additional queries
    
    // SOLUTION 1: OPTIMIZED FILE COUNTING - Count directly from formatted files
    const fileCounts = { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 };
    
    // Count files by category - synchronous processing using already resolved categories
    for (const file of formattedFiles) {
      switch (file.category) {
        case 'Overview': fileCounts.overview++; break;
        case 'Problem Proofs': fileCounts.problemProof++; break;
        case 'Solution Proofs': fileCounts.solutionProof++; break;
        case 'Demand Proofs': fileCounts.demandProof++; break;
        case 'Credibility Proofs': fileCounts.credibilityProof++; break;
        case 'Commercial Proofs': fileCounts.commercialProof++; break;
        case 'Investor Pack': fileCounts.investorPack++; break;
        default: fileCounts.overview++; // Fallback to overview
      }
    }
    
    appLogger.api(`SOLUTION 1: File counts - Overview: ${fileCounts.overview}, Problem: ${fileCounts.problemProof}, Solution: ${fileCounts.solutionProof}, Demand: ${fileCounts.demandProof}, Credibility: ${fileCounts.credibilityProof}, Commercial: ${fileCounts.commercialProof}, Investor: ${fileCounts.investorPack}`);
    // SOLUTION 1: File counting is now done above using formatted files - no complex logic needed

    const vaultData = {
      overviewCount: fileCounts.overview,
      problemProofCount: fileCounts.problemProof,
      solutionProofCount: fileCounts.solutionProof,
      demandProofCount: fileCounts.demandProof,
      credibilityProofCount: fileCounts.credibilityProof,
      commercialProofCount: fileCounts.commercialProof,
      investorPackCount: fileCounts.investorPack,
      totalFiles: formattedFiles.length,
      ventureId: dashboardData.venture.ventureId,
      ventureName: dashboardData.venture.name,
      files: formattedFiles, // REAL FILES from database
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

// Dashboard activity endpoint - JWT AUTHENTICATED
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const founderId = (req as any).user?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Authentication token required" });
  }
  
  try {
    const { db } = await import('../../db');
    const { userActivity } = await import('@shared/schema');
    const { eq, desc } = await import('drizzle-orm');

    // Get real activity data from database
    const activities = await db.select()
      .from(userActivity)
      .where(eq(userActivity.founderId, founderId))
      .orderBy(desc(userActivity.createdAt))
      .limit(10);

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

    res.json(formattedActivities);
  } catch (error) {
    console.error("Dashboard activity error:", error);
    res.status(500).json({ error: "Failed to load activity data" });
  }
}));

// Helper functions - SOLUTION 1: FIXED category resolution using database analysis
function getCategoryFromFolderData(folderName: string | null, folderId: string, parentFolderId: string | null): string {
  // Direct main category mapping based on folder names
  if (folderName) {
    if (folderName === '0_Overview') return 'Overview';
    if (folderName === '1_Problem_Proof') return 'Problem Proofs';
    if (folderName === '2_Solution_Proof') return 'Solution Proofs';
    if (folderName === '3_Demand_Proof') return 'Demand Proofs';
    if (folderName === '4_Credibility_Proof') return 'Credibility Proofs';
    if (folderName === '5_Commercial_Proof') return 'Commercial Proofs';
    if (folderName === '6_Investor_Pack') return 'Investor Pack';
    
    // Handle subfolders by parent folder ID
    if (parentFolderId) {
      // Credibility Proofs subfolders (parent: 332967069435)
      if (parentFolderId === '332967069435' || parentFolderId === '332967186088') {
        return 'Credibility Proofs';
      }
      // Commercial Proofs subfolders (parent: 332965602986)
      if (parentFolderId === '332965602986') {
        return 'Commercial Proofs';
      }
      // Investor Pack subfolders (parent: 332965845097)
      if (parentFolderId === '332965845097') {
        return 'Investor Pack';
      }
      // Overview subfolders (parent: 332966519631)
      if (parentFolderId === '332966519631') {
        return 'Overview';
      }
    }
  }
  
  // Direct folder ID mapping for main category folders
  const folderMap: Record<string, string> = {
    '332966519631': 'Overview',
    '332966891030': 'Problem Proofs',
    '332966738286': 'Solution Proofs', 
    '332965861836': 'Demand Proofs',
    '332967069435': 'Credibility Proofs',
    '332965602986': 'Commercial Proofs',
    '332965845097': 'Investor Pack'
  };
  
  return folderMap[folderId] || 'Overview';
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