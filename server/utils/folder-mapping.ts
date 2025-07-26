import { storage } from "../storage";
import { appLogger } from "./logger";

/**
 * 100% DATABASE-DRIVEN folder mapping utility - NO FALLBACKS OR CACHING
 * All folder mappings must come from proof_vault table populated during onboarding
 */

interface DatabaseFolderMapping {
  categoryToFolderId: Record<string, string>;
  folderIdToCategory: Record<string, string>;
  availableCategories: string[];
}

/**
 * Load folder mappings directly from database - NO CACHING
 * @param founderId - Current user's founder ID
 * @returns Promise with folder mapping or throws error if no data
 */
export async function loadFolderMappingFromDatabase(founderId: string): Promise<DatabaseFolderMapping> {
  appLogger.database('Loading folder mapping from database (NO CACHE, NO FALLBACK)', { founderId });
  
  // Get user's ventures
  const ventures = await storage.getVenturesByFounderId(founderId);
  if (!ventures || ventures.length === 0) {
    throw new Error(`No ventures found for founder ${founderId}`);
  }

  const latestVenture = ventures[0];
  appLogger.database('Using venture for folder mapping', { ventureId: latestVenture.ventureId });

  // Get proof vault records using correct database field names
  const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
  
  if (proofVaultRecords.length === 0) {
    throw new Error(`No proof vault entries found for venture ${latestVenture.ventureId}. Please complete onboarding to create folder structure.`);
  }

  const categoryToFolderId: Record<string, string> = {};
  const folderIdToCategory: Record<string, string> = {};
  const availableCategories: string[] = [];
  
  appLogger.database('Processing proof vault records', { count: proofVaultRecords.length });
  
  // Process database mappings using correct field names from schema
  proofVaultRecords.forEach(pv => {
    // Schema shows: folderName (varchar) and subFolderId (varchar) - use these exact names
    if (pv.folderName && pv.subFolderId) {
      categoryToFolderId[pv.folderName] = pv.subFolderId;
      folderIdToCategory[pv.subFolderId] = getCategoryDisplayName(pv.folderName);
      availableCategories.push(pv.folderName);
      
      appLogger.database('Mapped folder from database', { 
        folderName: pv.folderName, 
        subFolderId: pv.subFolderId,
        displayName: getCategoryDisplayName(pv.folderName)
      });
    } else {
      appLogger.database('Skipping incomplete proof vault record', { 
        vaultId: pv.vaultId,
        folderName: pv.folderName,
        subFolderId: pv.subFolderId
      });
    }
  });

  if (Object.keys(categoryToFolderId).length === 0) {
    throw new Error('No valid folder mappings found in proof_vault table');
  }

  const mapping: DatabaseFolderMapping = {
    categoryToFolderId,
    folderIdToCategory,
    availableCategories: availableCategories.sort()
  };

  appLogger.database('Database folder mapping loaded successfully', { 
    categoriesCount: availableCategories.length,
    categories: availableCategories
  });
  
  return mapping;
}

/**
 * Get actual Box.com folder ID from category name
 * @param categoryName - Category name from database (e.g., '0_Overview')
 * @param founderId - Current user's founder ID
 * @returns Promise with Box.com folder ID or throws error
 */
export async function getFolderIdFromCategory(categoryName: string, founderId: string): Promise<string> {
  const mapping = await loadFolderMappingFromDatabase(founderId);
  
  const folderId = mapping.categoryToFolderId[categoryName];
  if (!folderId) {
    throw new Error(`No folder ID found for category '${categoryName}'. Available categories: ${mapping.availableCategories.join(', ')}`);
  }
  
  appLogger.database('Resolved category to folder ID', { categoryName, folderId });
  return folderId;
}

/**
 * Get category name from Box.com folder ID
 * @param folderId - Box.com folder ID
 * @param founderId - Current user's founder ID
 * @returns Promise with category display name or throws error
 */
export async function getCategoryFromFolderIdDB(folderId: string, founderId: string): Promise<string> {
  const mapping = await loadFolderMappingFromDatabase(founderId);
  
  const category = mapping.folderIdToCategory[folderId];
  if (!category) {
    throw new Error(`No category found for folder ID '${folderId}'`);
  }
  
  appLogger.database('Resolved folder ID to category', { folderId, category });
  return category;
}

/**
 * Get display name for category
 * @param folderName - Database folder name (e.g., '0_Overview')
 * @returns Human-readable display name
 */
export function getCategoryDisplayName(folderName: string): string {
  const displayMap: Record<string, string> = {
    '0_Overview': 'Overview',
    '1_Problem_Proof': 'Problem Proofs',
    '2_Solution_Proof': 'Solution Proofs', 
    '3_Demand_Proof': 'Demand Proofs',
    '4_Credibility_Proof': 'Credibility Proofs',
    '5_Commercial_Proof': 'Commercial Proofs',
    '6_Investor_Pack': 'Investor Pack'
  };
  
  return displayMap[folderName] || folderName;
}

/**
 * Clear folder mapping cache (legacy function for compatibility)
 * @param founderId - Founder ID 
 */
export function clearFolderMappingCache(founderId?: string): void {
  appLogger.database('Cache clear requested (NO-OP: using direct database queries)', { founderId });
  // No-op since we're using direct database queries without caching
}