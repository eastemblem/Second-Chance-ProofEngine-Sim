import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { databaseService } from '../../services/database-service';

const router = Router();

// Dashboard validation endpoint - EXACT SAME LOGIC as routes.ts
router.get('/validation', asyncHandler(async (req: Request, res: Response) => {
  const founderId = req.session?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData) {
      return res.status(404).json({ error: "Founder not found" });
    }

    const { founder: founderData, venture: latestVenture, latestEvaluation } = dashboardData;
    const currentScore = latestEvaluation?.proofscore || 0;

    const validationData = {
      proofScore: currentScore,
      proofTagsUnlocked: latestEvaluation?.proof_tags_unlocked || 0,
      totalProofTags: 21,
      evaluationDate: latestEvaluation?.created_at?.toISOString(),
      founderName: founderData?.fullName || founderData?.email?.split('@')[0] || 'Founder',
      ventureName: latestVenture?.name || 'Your Venture',
      filesUploaded: 0, // FIXED: Will be calculated from actual document count
      status: currentScore >= 90 ? 'Deal Room Ready' : currentScore >= 70 ? 'Investor Ready' : 'Building Validation', // FIXED: Add status field
      investorReady: currentScore >= 70,
      dealRoomAccess: currentScore >= 90,
      certificateUrl: latestVenture?.certificateUrl,
      reportUrl: latestVenture?.reportUrl
    };

    // FIXED: Calculate actual files uploaded for this venture
    const { db } = await import('../../db');
    const { documentUpload } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const fileCount = await db.select()
      .from(documentUpload)
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId));
    
    validationData.filesUploaded = fileCount.length;

    console.log(`📊 FIXED: Returning validation data for ${founderData?.fullName}, score: ${currentScore}, files: ${fileCount.length}`);
    res.json(validationData);
  } catch (error) {
    console.error("FIXED: Dashboard validation error:", error);
    res.status(500).json({ error: "Failed to load validation data" });
  }
}));

// Dashboard vault endpoint - EXACT SAME LOGIC as routes.ts
router.get('/vault', asyncHandler(async (req: Request, res: Response) => {
  const founderId = req.session?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({ error: "Venture not found" });
    }

    // RETRIEVE ACTUAL FILES FROM DATABASE
    const { db } = await import('../../db');
    const { documentUpload } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Get all files for this venture ordered by upload time (most recent first)
    const { desc } = await import('drizzle-orm');
    const files = await db.select().from(documentUpload)
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId))
      .orderBy(desc(documentUpload.createdAt));
    
    // Format files for frontend display
    const formattedFiles = files.map(file => ({
      id: file.uploadId,
      name: file.fileName || file.originalName || 'Unknown File',
      category: getCategoryFromFolderId(file.folderId || '332844784735'), // Default to Overview folder
      uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
      size: formatFileSize(file.fileSize || 0),
      downloadUrl: file.sharedUrl || '',
      type: file.mimeType || 'application/pdf'
    }));

    // ENHANCED FILE COUNTING: Count files including those in subfolders
    const { proofVault } = await import('@shared/schema');
    
    // Get all proof vault folder mappings for this venture
    const folderMappings = await db.select().from(proofVault)
      .where(eq(proofVault.ventureId, dashboardData.venture.ventureId));
    
    // Create mapping from subFolderId to parent category
    const subfolderToParentMap: Record<string, string> = {};
    folderMappings.forEach(mapping => {
      const parentCategory = getCategoryFromFolderId(mapping.parentFolderId);
      subfolderToParentMap[mapping.subFolderId] = parentCategory;
      console.log(`📂 Subfolder mapping: ${mapping.subFolderId} → ${parentCategory} (parent: ${mapping.parentFolderId})`);
    });

    // DATABASE-FIRST APPROACH: Count files by category using recursive subfolder traversal
    const fileCounts = files.reduce((counts, file) => {
      let category;
      
      // RECURSIVE LOGIC: Find correct parent category for nested subfolders
      const findCorrectParentCategory = (folderId: string, depth = 0): string => {
        // Prevent infinite loops
        if (depth > 10) {
          console.warn(`⚠️ Maximum depth reached for folder ${folderId}`);
          return 'Overview';
        }
        
        // CRITICAL FIX: First check if current folder is already a main category folder
        const directCategory = getCategoryFromFolderId(folderId);
        if (directCategory !== 'Overview (default)') {
          // This IS a main category folder, use it directly
          console.log(`📁 File ${file.fileName} in main category folder ${folderId} → ${directCategory}`);
          return directCategory;
        }
        
        // Step 2: Check if this folder ID exists as a subfolder in proof_vault
        const subfolderMapping = folderMappings.find(mapping => mapping.subFolderId === folderId);
        
        if (subfolderMapping) {
          // Check if parent is a main category folder
          const parentCategory = getCategoryFromFolderId(subfolderMapping.parentFolderId);
          if (parentCategory !== 'Overview (default)') {
            // Parent is a main category folder - use it
            console.log(`📁 File ${file.fileName} in subfolder ${folderId} → parent category: ${parentCategory} (depth ${depth})`);
            return parentCategory;
          } else {
            // Parent is also a subfolder, continue recursion
            console.log(`📁 Nested subfolder: ${folderId} → parent ${subfolderMapping.parentFolderId} (depth ${depth})`);
            return findCorrectParentCategory(subfolderMapping.parentFolderId, depth + 1);
          }
        } else {
          // Fallback to Overview if no mapping found
          console.log(`📁 File ${file.fileName} no mapping found for ${folderId} → Overview fallback`);
          return 'Overview (default)';
        }
      };
      
      category = findCorrectParentCategory(file.folderId || '332844784735');
      
      switch(category) {
        case 'Overview':
        case 'Overview (default)': counts.overview++; break;
        case 'Problem Proofs': counts.problemProof++; break;
        case 'Solution Proofs': counts.solutionProof++; break;
        case 'Demand Proofs': counts.demandProof++; break;
        case 'Credibility Proofs': counts.credibilityProof++; break;
        case 'Commercial Proofs': counts.commercialProof++; break;
        case 'Investor Pack': counts.investorPack++; break;
        default: 
          console.warn(`⚠️ Unknown category: ${category} for file ${file.fileName}`);
          counts.overview++;
          break;
      }
      return counts;
    }, { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 });

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

// Dashboard activity endpoint - EXACT SAME LOGIC as routes.ts
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const founderId = req.session?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Not authenticated" });
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

// Helper functions preserved from routes.ts
function getCategoryFromFolderId(folderId: string): string {
  // FIXED: Map actual Box.com folder IDs to category names based on real folder structure
  const folderMap: Record<string, string> = {
    '332844784735': 'Overview',     // 0_Overview
    '332844933261': 'Problem Proofs', // 1_Problem_Proof  
    '332842993678': 'Solution Proofs', // 2_Solution_Proof
    '332843828465': 'Demand Proofs',   // 3_Demand_Proof
    '332843291772': 'Credibility Proofs', // 4_Credibility_Proof
    '332845124499': 'Commercial Proofs',  // 5_Commercial_Proof
    '332842251627': 'Investor Pack'       // 6_Investor_Pack
  };
  
  const category = folderMap[folderId];
  if (category) {
    console.log(`📁 Mapping folder ID '${folderId}' to category: ${category}`);
    return category;
  } else {
    console.log(`📁 Mapping folder ID '${folderId}' to category: Overview (default)`);
    return 'Overview (default)';
  }
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