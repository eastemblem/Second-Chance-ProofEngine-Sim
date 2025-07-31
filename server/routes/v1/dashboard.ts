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

    // RETRIEVE ACTUAL FILES FROM DATABASE
    const { db } = await import('../../db');
    const { documentUpload } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    // Get all files for this venture ordered by upload time (most recent first)
    const { desc } = await import('drizzle-orm');
    const files = await db.select().from(documentUpload)
      .where(eq(documentUpload.ventureId, dashboardData.venture.ventureId))
      .orderBy(desc(documentUpload.createdAt));
    
    // Format files for frontend display - need to use async mapping
    const formattedFiles = await Promise.all(files.map(async (file) => ({
      id: file.uploadId,
      name: file.fileName || file.originalName || 'Unknown File',
      category: await getCategoryFromFolderId(file.folderId || '332886218045', founderId), // Default to Overview folder
      uploadDate: file.createdAt?.toISOString() || new Date().toISOString(),
      size: formatFileSize(file.fileSize || 0),
      downloadUrl: file.sharedUrl || '',
      type: file.mimeType || 'application/pdf'
    })));

    // ENHANCED FILE COUNTING: Count files including those in subfolders
    const { proofVault } = await import('@shared/schema');
    
    // Get all proof vault folder mappings for this venture
    const folderMappings = await db.select().from(proofVault)
      .where(eq(proofVault.ventureId, dashboardData.venture.ventureId));
    
    // Create mapping from subFolderId to parent category
    const subfolderToParentMap: Record<string, string> = {};
    for (const mapping of folderMappings) {
      // Use correct Drizzle field names
      const parentCategory = await getCategoryFromFolderId(mapping.parentFolderId, founderId);
      subfolderToParentMap[mapping.subFolderId] = parentCategory;
      console.log(`📂 Subfolder mapping: ${mapping.subFolderId} → ${parentCategory} (parent: ${mapping.parentFolderId})`);
    }

    // DATABASE-FIRST APPROACH: Count files by category using recursive subfolder traversal
    const fileCounts = { overview: 0, problemProof: 0, solutionProof: 0, demandProof: 0, credibilityProof: 0, commercialProof: 0, investorPack: 0 };
    
    // Process files individually with async categorization
    for (const file of files) {
      let category;
      
      // RECURSIVE LOGIC: Find correct parent category for nested subfolders
      const findCorrectParentCategory = async (folderId: string, depth = 0): Promise<string> => {
        // Prevent infinite loops
        if (depth > 10) {
          console.warn(`⚠️ Maximum depth reached for folder ${folderId}`);
          return 'Overview';
        }
        
        // CRITICAL FIX: Use direct mapping lookup from database instead of getCategoryFromFolderId
        // Check if this folder ID is directly mapped in our folderMappings (main category folders)
        const directMapping = folderMappings.find(mapping => mapping.subFolderId === folderId);
        
        if (directMapping) {
          // Get the display name for this folder
          const { getCategoryDisplayName } = await import('../../utils/folder-mapping');
          const categoryName = getCategoryDisplayName(directMapping.folderName);
          
          // Check if this is a main category folder (has underscore indicating main category)
          if (directMapping.folderName.includes('_') && directMapping.folderName.match(/^\d+_/)) {
            console.log(`📁 File ${file.fileName} in main category folder ${folderId} → ${categoryName}`);
            return categoryName;
          }
          
          // This is a subfolder, check its parent
          if (directMapping.parentFolderId && directMapping.parentFolderId !== folderId) {
            console.log(`📁 File ${file.fileName} in subfolder ${folderId} → checking parent ${directMapping.parentFolderId} (depth ${depth})`);
            return await findCorrectParentCategory(directMapping.parentFolderId, depth + 1);
          }
        }
        
        // Step 2: Check if this folder exists as a subfolder in other mappings
        const subfolderMapping = folderMappings.find(mapping => mapping.subFolderId === folderId && !mapping.folderName.match(/^\d+_/));
        
        if (subfolderMapping && subfolderMapping.parentFolderId) {
          // This is a subfolder, find its parent category
          console.log(`📁 Nested subfolder: ${folderId} → parent ${subfolderMapping.parentFolderId} (depth ${depth})`);
          return await findCorrectParentCategory(subfolderMapping.parentFolderId, depth + 1);
        }
        
        // Step 3: CRITICAL FIX - Check if this is a newly created folder by looking for parent references
        // When a folder is created under a main category, it might not be in proof_vault yet but files reference it
        const parentReference = folderMappings.find(mapping => mapping.parentFolderId === folderId);
        if (parentReference && parentReference.folderName && !parentReference.folderName.match(/^\d+_/)) {
          // This folder is referenced as a parent by subfolders - it might be a category folder
          // Check if we can find the main category by looking at the subfolder's parent structure
          const categoryFromSubfolder = folderMappings.find(mapping => 
            mapping.subFolderId === parentReference.parentFolderId && 
            mapping.folderName.match(/^\d+_/)
          );
          
          if (categoryFromSubfolder) {
            const { getCategoryDisplayName } = await import('../../utils/folder-mapping');
            const categoryName = getCategoryDisplayName(categoryFromSubfolder.folderName);
            console.log(`📁 File ${file.fileName} in newly created folder ${folderId} → traced to main category: ${categoryName}`);
            return categoryName;
          }
        }
        
        // Step 4: ENHANCED FALLBACK - Check via EastEmblem API for newly created folders
        try {
          const { eastEmblemAPI } = await import('../../eastemblem-api');
          if (eastEmblemAPI.isConfigured()) {
            // Get folder info from EastEmblem API to trace parent hierarchy
            const folderDetails = await eastEmblemAPI.getFolderDetails(folderId);
            
            if (folderDetails && folderDetails.parent && folderDetails.parent.id) {
              console.log(`📁 File ${file.fileName} in API-traced folder ${folderId} → checking parent ${folderDetails.parent.id} (depth ${depth})`);
              return await findCorrectParentCategory(folderDetails.parent.id, depth + 1);
            }
          }
        } catch (apiError) {
          console.log(`⚠️ EastEmblem API trace failed for folder ${folderId}:`, apiError);
        }
        
        // Step 5: PATTERN MATCHING FALLBACK - Use known subfolder patterns
        const anyReference = folderMappings.find(mapping => 
          mapping.parentFolderId === folderId || 
          mapping.subFolderId === folderId
        );
        
        if (anyReference) {
          // Try to find main category by examining the reference pattern
          if (anyReference.folderName === 'badges' || anyReference.folderName === 'awards' || 
              anyReference.folderName === 'png' || anyReference.folderName === 'svg') {
            
            // Check if the parentFolderId is a main category reference
            const parentCategoryMapping = folderMappings.find(mapping => 
              mapping.folderName === anyReference.parentFolderId && 
              mapping.folderName.match(/^\d+_/)
            );
            
            if (parentCategoryMapping) {
              const { getCategoryDisplayName } = await import('../../utils/folder-mapping');
              const categoryName = getCategoryDisplayName(parentCategoryMapping.folderName);
              console.log(`📁 File ${file.fileName} in subfolder ${folderId} → mapped via pattern to: ${categoryName}`);
              return categoryName;
            }
            
            // CRITICAL FIX: If parentFolderId is a category name string like "2_Solution_Proof", map it directly
            if (anyReference.parentFolderId && anyReference.parentFolderId.match(/^\d+_/)) {
              const { getCategoryDisplayName } = await import('../../utils/folder-mapping');
              const categoryName = getCategoryDisplayName(anyReference.parentFolderId);
              console.log(`📁 File ${file.fileName} in subfolder ${folderId} → direct parent category: ${categoryName}`);
              return categoryName;
            }
          }
        }
        
        // Step 6: LAST RESORT INFERENCE - For completely untracked folders, check file upload context
        // This handles the case where badges/awards folders are created under Solution Proofs but get new Box IDs
        if (depth === 0) {
          // This is the original file folder, not a recursive call
          // Check if any other files in similar folders have been categorized
          const similarFilePatterns = files.filter(f => 
            f.folderId === folderId && 
            (f.fileName?.includes('Badge') || f.fileName?.includes('Award') || 
             f.fileName?.includes('badge') || f.fileName?.includes('award') ||
             f.fileName?.includes('.svg') || f.fileName?.includes('.png'))
          );
          
          if (similarFilePatterns.length > 0) {
            // This looks like a badges/awards folder based on file names
            // Check if this user has uploaded to Solution Proofs recently
            const recentSolutionUploads = files.filter(f => 
              f.createdAt && new Date(f.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            );
            
            if (recentSolutionUploads.length > 10) { // Many recent uploads suggests folder upload
              console.log(`📁 File ${file.fileName} in untracked folder ${folderId} → inferred as Solution Proofs based on badge/award pattern and recent upload activity`);
              return 'Solution Proofs';
            }
          }
        }
        
        // Step 7: SPECIFIC BADGE FOLDER FIX - Handle known subfolder patterns with string parent references
        // Looking for folders where parentFolderId is a string like "1_Problem_Proof" or "2_Solution_Proof" 
        const stringParentMapping = folderMappings.find(mapping => 
          (mapping.folderName === 'badges' || mapping.folderName === 'awards' || 
           mapping.folderName === 'png' || mapping.folderName === 'svg') &&
          mapping.parentFolderId && 
          typeof mapping.parentFolderId === 'string' &&
          mapping.parentFolderId.match(/^\d+_/)
        );
        
        if (stringParentMapping) {
          // Found a subfolder with string parent reference - use it directly
          const { getCategoryDisplayName } = await import('../../utils/folder-mapping');
          const categoryName = getCategoryDisplayName(stringParentMapping.parentFolderId);
          console.log(`📁 File ${file.fileName} in untracked folder ${folderId} → inferred from string parent "${stringParentMapping.parentFolderId}": ${categoryName}`);
          return categoryName;
        }
        
        // Final fallback to Overview if no mapping found
        console.log(`📁 File ${file.fileName} no mapping found for ${folderId} → Overview fallback`);
        return 'Overview';
      };
      
      category = await findCorrectParentCategory(file.folderId || '332886218045');
      
      switch(category) {
        case 'Overview':
        case 'Overview (default)': fileCounts.overview++; break;
        case 'Problem Proofs': fileCounts.problemProof++; break;
        case 'Solution Proofs': fileCounts.solutionProof++; break;
        case 'Demand Proofs': fileCounts.demandProof++; break;
        case 'Credibility Proofs': fileCounts.credibilityProof++; break;
        case 'Commercial Proofs': fileCounts.commercialProof++; break;
        case 'Investor Pack': fileCounts.investorPack++; break;
        default: 
          console.warn(`⚠️ Unknown category: ${category} for file ${file.fileName}`);
          fileCounts.overview++;
          break;
      }
    }

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

// Helper functions - using database-driven folder mapping
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