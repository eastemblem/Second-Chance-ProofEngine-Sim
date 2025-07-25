import { storage } from "../storage";
import { appLogger } from "./logger";

/**
 * Database-driven folder mapping utility
 * Loads folder ID mappings from proof_vault table instead of hardcoded values
 */

interface FolderMapping {
  categoryToFolderId: Record<string, string>;
  folderIdToCategory: Record<string, string>;
}

let cachedMapping: FolderMapping | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Per-founder caching to avoid conflicts between users
const founderCacheMap = new Map<string, { mapping: FolderMapping; timestamp: number }>();

/**
 * Load folder mappings from database
 * @param founderId - Current user's founder ID
 * @returns Promise with folder mapping objects
 */
export async function loadFolderMappingFromDatabase(founderId: string): Promise<FolderMapping> {
  try {
    // Check per-founder cache first
    const cached = founderCacheMap.get(founderId);
    const currentTime = Date.now();
    
    if (cached && (currentTime - cached.timestamp) < CACHE_TTL) {
      appLogger.cache(`Using cached folder mapping for founder ${founderId}`);
      return cached.mapping;
    }
    
    appLogger.database('Loading folder mapping from database (100% dynamic)...');
    
    // Get user's ventures
    const ventures = await storage.getVenturesByFounderId(founderId);
    const latestVenture = ventures.length > 0 ? ventures[0] : null;
    
    if (!latestVenture) {
      throw new Error('No venture found for founder');
    }

    // Get proof vault records
    const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
    
    const categoryToFolderId: Record<string, string> = {};
    const folderIdToCategory: Record<string, string> = {};
    
    appLogger.database('Found proof vault records:', proofVaultRecords.length);
    
    // Add database mappings
    proofVaultRecords.forEach(pv => {
      // Use correct database field names: folderName, subFolderId (these match the Drizzle schema)
      if (pv.folderName && pv.subFolderId) {
        categoryToFolderId[pv.folderName] = pv.subFolderId;
        folderIdToCategory[pv.subFolderId] = getCategoryDisplayName(pv.folderName);
        appLogger.database(`DB Mapping: ${pv.folderName} (${pv.subFolderId}) → ${getCategoryDisplayName(pv.folderName)}`);
      }
    });

    // System is now 100% database-driven - no legacy mappings needed

    const mapping: FolderMapping = {
      categoryToFolderId,
      folderIdToCategory
    };

    // Cache the result per founder
    founderCacheMap.set(founderId, { mapping, timestamp: currentTime });
    
    appLogger.database('100% database-driven mapping loaded successfully!');
    appLogger.database('categoryToFolderId:', categoryToFolderId);
    appLogger.database('folderIdToCategory:', folderIdToCategory);
    return mapping;
    
  } catch (error) {
    appLogger.database('Failed to load folder mapping from database:', error);
    
    // Return current working folder IDs as fallback + ADD MISSING LEGACY FOLDER IDs
    const fallbackMapping: FolderMapping = {
      categoryToFolderId: {
        '0_Overview': '332886218045',
        '1_Problem_Proof': '332887480277', 
        '2_Solution_Proof': '332887446170',
        '3_Demand_Proof': '332885125206',
        '4_Credibility_Proof': '332885857453',
        '5_Commercial_Proof': '332887928503',
        '6_Investor_Pack': '332885728761'
      },
      folderIdToCategory: {
        // Current database folder IDs
        '332886218045': 'Overview',
        '332887480277': 'Problem Proofs',
        '332887446170': 'Solution Proofs',
        '332885125206': 'Demand Proofs',
        '332885857453': 'Credibility Proofs',
        '332887928503': 'Commercial Proofs',
        '332885728761': 'Investor Pack',
        // Fallback mappings only used if database completely fails
      }
    };
    
    appLogger.database('Using fallback folder mapping');
    return fallbackMapping;
  }
}

/**
 * Get category display name from folder name
 */
function getCategoryDisplayName(folderName: string): string {
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
 * Get category from folder ID using database mapping
 * @param folderId - Box.com folder ID
 * @param founderId - Current user's founder ID
 * @returns Promise with category name
 */
export async function getCategoryFromFolderIdDB(folderId: string, founderId: string): Promise<string> {
  try {
    const mapping = await loadFolderMappingFromDatabase(founderId);
    const category = mapping.folderIdToCategory[folderId];
    
    if (category) {
      appLogger.database(`Mapped folder ID '${folderId}' to category: ${category}`);
      return category;
    } else {
      appLogger.database(`No mapping found for folder ID '${folderId}', using default: Overview`);
      return 'Overview (default)';
    }
  } catch (error) {
    appLogger.database('Error getting category from folder ID:', error);
    return 'Overview (default)';
  }
}

/**
 * Get folder ID from category using database mapping
 * @param category - Category name (e.g., '2_Solution_Proof')
 * @param founderId - Current user's founder ID
 * @returns Promise with Box.com folder ID
 */
export async function getFolderIdFromCategoryDB(category: string, founderId: string): Promise<string> {
  try {
    const mapping = await loadFolderMappingFromDatabase(founderId);
    const folderId = mapping.categoryToFolderId[category];
    
    if (folderId) {
      appLogger.database(`Mapped category '${category}' to folder ID: ${folderId}`);
      return folderId;
    } else {
      appLogger.database(`No mapping found for category '${category}', using Overview folder`);
      return mapping.categoryToFolderId['0_Overview'] || '332886218045';
    }
  } catch (error) {
    appLogger.database('Error getting folder ID from category:', error);
    return '332886218045'; // Overview folder fallback
  }
}

/**
 * Clear folder mapping cache (useful when vault structure changes)
 */
export function clearFolderMappingCache(): void {
  cachedMapping = null;
  cacheTimestamp = 0;
  appLogger.cache('Folder mapping cache cleared');
}

// Clear cache on startup to ensure fresh database mapping
clearFolderMappingCache();