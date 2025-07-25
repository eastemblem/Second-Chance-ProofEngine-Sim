import { Router } from "express";
import { storage } from "../storage";
import { ActivityService } from "../services/activity-service";
import { databaseService } from "../services/database-service";
import { cacheService } from "../services/cache-service";
import { kvCacheService } from "../services/kv-cache-service";

const router = Router();

// OPTIMIZED: Get validation data (ProofScore, ProofTags, etc.)
router.get("/validation", async (req, res) => {
  try {
    // Add cache headers for validation data (5 minutes)
    res.set({
      'Cache-Control': 'public, max-age=300',
      'ETag': `"validation-${Math.floor(Date.now() / 300000)}"`,
      'Vary': 'Accept-Encoding'
    });

    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // OPTIMIZATION: Single query instead of 4 separate database calls
    const dashboardData = await databaseService.executeWithTiming(
      'dashboard-validation',
      () => databaseService.getFounderWithLatestVenture(founderId)
    );

    if (!dashboardData) {
      return res.status(404).json({ error: "Founder not found" });
    }

    if (!dashboardData.venture) {
      return res.status(404).json({ error: "No venture found for founder" });
    }

    const latestEvaluation = dashboardData.latestEvaluation;
    
    const validationData = {
      proofScore: latestEvaluation?.proofscore || 0, // Use actual score, no fallback
      proofTagsUnlocked: 11,
      totalProofTags: 21,
      filesUploaded: 0,
      status: "Excellent! You're investor-ready. Your data room is now visible to our verified investor network.",
      ventureId: dashboardData.venture.ventureId,
      ventureName: dashboardData.venture.name,
      // NEW: Rich scoring data available from stored API response
      hasFullApiResponse: !!latestEvaluation?.fullApiResponse,
      dimensionScores: latestEvaluation?.dimensionScores || {},
      apiResponsePreview: latestEvaluation?.fullApiResponse ? {
        hasKeyInsights: !!(latestEvaluation.fullApiResponse as any)?.key_insights || !!(latestEvaluation.fullApiResponse as any)?.output?.key_insights,
        hasDetailedScores: !!(latestEvaluation.fullApiResponse as any)?.output,
        totalCategories: (latestEvaluation.fullApiResponse as any)?.output ? Object.keys((latestEvaluation.fullApiResponse as any).output).length : 0
      } : null
    };

    res.json(validationData);
  } catch (error) {
    console.error("Validation data error:", error);
    res.status(500).json({ error: "Failed to load validation data" });
  }
});

// OPTIMIZED: Get ProofVault data (file counts, file lists)
router.get("/vault", async (req, res) => {
  try {
    // Add cache headers for vault data (10 minutes)
    res.set({
      'Cache-Control': 'public, max-age=600',
      'ETag': `"vault-${Math.floor(Date.now() / 600000)}"`,
      'Vary': 'Accept-Encoding'
    });

    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // OPTIMIZATION: Single optimized query for all dashboard data
    const dashboardData = await databaseService.executeWithTiming(
      'dashboard-vault',
      () => databaseService.getDashboardData(founderId)
    );

    if (!dashboardData || !dashboardData.venture) {
      return res.status(404).json({ error: "No venture found for founder" });
    }

    const { venture: latestVenture, documentUploads, proofVaultRecords } = dashboardData;

    // Count files by folder category
    const folderCounts = {
      "0_Overview": 0,
      "1_Problem_Proof": 0,
      "2_Solution_Proof": 0,
      "3_Demand_Proof": 0,
      "4_Credibility_Proof": 0,
      "5_Commercial_Proof": 0,
      "6_Investor_Pack": 0
    };

    // Create a mapping of subfolder IDs to folder names
    const folderMapping: Record<string, string> = {};
    proofVaultRecords.forEach(vault => {
      if (vault.subFolderId && vault.folderName) {
        folderMapping[vault.subFolderId] = vault.folderName;
      }
    });

    // Count documents by their folder_id mapping
    documentUploads.forEach(doc => {
      if (doc.folderId && folderMapping[doc.folderId]) {
        const folderName = folderMapping[doc.folderId];
        if (folderName in folderCounts) {
          folderCounts[folderName as keyof typeof folderCounts]++;
        } else {
          folderCounts["0_Overview"]++; // Default for unmapped folders
        }
      } else {
        // Fallback: try to categorize by shared URL patterns or document type
        if (doc.sharedUrl) {
          if (doc.sharedUrl.includes("0_Overview")) folderCounts["0_Overview"]++;
          else if (doc.sharedUrl.includes("1_Problem_Proof")) folderCounts["1_Problem_Proof"]++;
          else if (doc.sharedUrl.includes("2_Solution_Proof")) folderCounts["2_Solution_Proof"]++;
          else if (doc.sharedUrl.includes("3_Demand_Proof")) folderCounts["3_Demand_Proof"]++;
          else if (doc.sharedUrl.includes("4_Credibility_Proof")) folderCounts["4_Credibility_Proof"]++;
          else if (doc.sharedUrl.includes("5_Commercial_Proof")) folderCounts["5_Commercial_Proof"]++;
          else if (doc.sharedUrl.includes("6_Investor_Pack")) folderCounts["6_Investor_Pack"]++;
          else folderCounts["0_Overview"]++; // Default to Overview
        } else {
          // Default to Overview for documents without folder mapping
          folderCounts["0_Overview"]++;
        }
      }
    });

    console.log(`📊 ProofVault file counts for venture ${latestVenture.ventureId}:`, folderCounts);

    // Convert document uploads to file list
    const files = documentUploads.map(doc => ({
      id: doc.uploadId,
      name: doc.originalName,
      category: doc.sharedUrl ? getCategoryFromUrl(doc.sharedUrl) : "Unknown",
      uploadDate: doc.createdAt.toISOString().split('T')[0],
      size: formatFileSize(doc.fileSize || 0),
      downloadUrl: doc.sharedUrl || `/api/vault/download/${latestVenture.ventureId}/${doc.uploadId}`,
      ventureId: latestVenture.ventureId,
      status: doc.uploadStatus
    }));

    console.log(`📄 Found ${files.length} files for venture ${latestVenture.ventureId}`);

    // Extract folder URLs from venture's folder structure
    const folderUrls: Record<string, string> = {};
    if (latestVenture.folderStructure && typeof latestVenture.folderStructure === 'object') {
      const folderStructure = latestVenture.folderStructure as any;
      console.log(`📁 Processing folder structure for URLs:`, folderStructure);
      
      // Get the base shared URL if available
      const baseUrl = folderStructure.url || folderStructure.shared_url;
      
      // Map each folder to its Proof Vault URL
      if (folderStructure.folders) {
        Object.entries(folderStructure.folders).forEach(([folderKey, folderId]) => {
          // Use Proof Vault folder URL format: https://app.box.com/folder/{folderId}
          folderUrls[folderKey] = `https://app.box.com/folder/${folderId}`;
          console.log(`📂 Mapped ${folderKey} -> https://app.box.com/folder/${folderId}`);
        });
      }
      
      // If we have a base shared URL, use that for root access
      if (baseUrl) {
        folderUrls['root'] = baseUrl;
        console.log(`🏠 Root folder URL: ${baseUrl}`);
      }
    }

    const vaultData = {
      overviewCount: folderCounts["0_Overview"],
      problemProofCount: folderCounts["1_Problem_Proof"],
      solutionProofCount: folderCounts["2_Solution_Proof"],
      demandProofCount: folderCounts["3_Demand_Proof"],
      credibilityProofCount: folderCounts["4_Credibility_Proof"],
      commercialProofCount: folderCounts["5_Commercial_Proof"],
      investorPackCount: folderCounts["6_Investor_Pack"],
      totalFiles: documentUploads.length,
      ventureId: latestVenture.ventureId,
      ventureName: latestVenture.name,
      files: files,
      folders: proofVaultRecords.map(pv => ({
        id: pv.vaultId,
        name: pv.folderName,
        type: pv.artefactType,
        sharedUrl: pv.sharedUrl,
        fileCount: folderCounts[pv.folderName as keyof typeof folderCounts] || 0
      })),
      folderUrls: folderUrls
    };

    res.json(vaultData);
  } catch (error) {
    console.error("Vault data error:", error);
    res.status(500).json({ error: "Failed to load vault data" });
  }
});

// Helper function to get category from URL
function getCategoryFromUrl(url: string): string {
  if (url.includes("0_Overview")) return "Overview";
  if (url.includes("1_Problem_Proof")) return "Problem Proof";
  if (url.includes("2_Solution_Proof")) return "Solution Proof";
  if (url.includes("3_Demand_Proof")) return "Demand Proof";
  if (url.includes("4_Credibility_Proof")) return "Credibility Proof";
  if (url.includes("5_Commercial_Proof")) return "Commercial Proof";
  if (url.includes("6_Investor_Pack")) return "Investor Pack";
  return "Unknown";
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Get recent activity data - NEW ACTIVITY SYSTEM
router.get("/activity", async (req, res) => {
  try {
    // Add cache headers for activity data (5 minutes)
    res.set({
      'Cache-Control': 'public, max-age=300',
      'ETag': `"activity-${Math.floor(Date.now() / 300000)}"`,
      'Vary': 'Accept-Encoding'
    });

    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get activities from the new activity tracking system
    let activities = await storage.getUserActivities(founderId, 10);
    
    // If no activities exist, try migration from old data
    if (activities.length === 0) {
      console.log(`🔄 No activities found for founder ${founderId}, attempting migration...`);
      await ActivityService.migrateExistingData(founderId);
      activities = await storage.getUserActivities(founderId, 10);
    }

    // Transform activities to frontend format
    const transformedActivities = activities.map(activity => {
      // Determine icon and color based on activity type and action
      let icon = "circle";
      let color = "gray";
      
      switch (activity.activityType) {
        case 'account':
          icon = activity.action === 'signup' ? 'user-plus' : 'check';
          color = activity.action === 'signup' ? 'purple' : 'green';
          break;
        case 'authentication':
          icon = activity.action === 'login' ? 'log-in' : 'log-out';
          color = 'blue';
          break;
        case 'venture':
          icon = 'building';
          color = 'blue';
          break;
        case 'document':
          if (activity.action === 'generate') {
            icon = activity.title.includes('Certificate') ? 'award' : 'bar-chart';
            color = activity.title.includes('Certificate') ? 'green' : 'blue';
          } else {
            // Determine icon by file extension from metadata
            const metadata = activity.metadata as any;
            const fileExt = metadata?.fileName?.split('.').pop()?.toLowerCase();
            if (fileExt === 'pdf') {
              icon = 'file-text';
              color = 'red';
            } else if (['ppt', 'pptx'].includes(fileExt || '')) {
              icon = 'presentation';
              color = 'orange';
            } else {
              icon = 'upload';
              color = 'purple';
            }
          }
          break;
        case 'evaluation':
          icon = 'trending-up';
          color = 'yellow';
          break;
        case 'navigation':
          icon = 'eye';
          color = 'gray';
          break;
        default:
          icon = 'circle';
          color = 'gray';
      }

      return {
        id: activity.activityId,
        type: activity.activityType,
        title: activity.title,
        description: activity.description || '',
        timestamp: activity.createdAt.toISOString(),
        icon: icon,
        color: color,
        metadata: activity.metadata
      };
    });

    // Sort by timestamp (most recent first) and limit to 5
    const sortedActivities = transformedActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    res.json(sortedActivities);
  } catch (error) {
    console.error("Activity data error:", error);
    res.status(500).json({ error: "Failed to load activity data" });
  }
});

// Get leaderboard data
router.get("/leaderboard", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Mock leaderboard data
    const leaderboardData = [
      { rank: 1, name: "Alex Chen", score: 92, isCurrentUser: false },
      { rank: 2, name: "Sarah Kim", score: 89, isCurrentUser: false },
      { rank: 3, name: "You", score: 85, isCurrentUser: true },
      { rank: 4, name: "Michael Park", score: 82, isCurrentUser: false },
      { rank: 5, name: "Lisa Wang", score: 78, isCurrentUser: false }
    ];

    res.json(leaderboardData);
  } catch (error) {
    console.error("Leaderboard data error:", error);
    res.status(500).json({ error: "Failed to load leaderboard data" });
  }
});

// NEW: Get full scoring insights for advanced ProofTag logic
router.get("/scoring-insights", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get founder's latest venture
    const ventures = await storage.getFounderVentures(founderId);
    const latestVenture = ventures.length > 0 ? ventures[ventures.length - 1] : null;

    if (!latestVenture) {
      return res.status(404).json({ error: "No venture found" });
    }

    // Get latest evaluation with full API response
    const latestEvaluation = await storage.getLatestEvaluationByVentureId(latestVenture.ventureId);
    
    if (!latestEvaluation?.fullApiResponse) {
      return res.status(404).json({ error: "No detailed scoring data available" });
    }

    const apiResponse = latestEvaluation.fullApiResponse as any;
    
    // Extract rich insights from stored API response
    const scoringInsights = {
      evaluation: {
        id: latestEvaluation.evaluationId,
        venture: latestVenture.name,
        score: latestEvaluation.proofscore,
        evaluationDate: latestEvaluation.evaluationDate,
        proofTags: latestEvaluation.prooftags
      },
      dimensionScores: latestEvaluation.dimensionScores,
      detailedScores: apiResponse.output || {},
      keyInsights: apiResponse.key_insights || apiResponse.output?.key_insights || [],
      recommendations: apiResponse.recommendations || [],
      // Example of rich data for advanced ProofTag logic
      availableData: {
        hasTeamInfo: !!(apiResponse.output?.team),
        hasMarketData: !!(apiResponse.output?.market_opportunity),
        hasFinancials: !!(apiResponse.output?.financials_projections_ask),
        hasTraction: !!(apiResponse.output?.traction),
        hasBusinessModel: !!(apiResponse.output?.business_model),
        totalCategories: apiResponse.output ? Object.keys(apiResponse.output).length : 0
      }
    };

    res.json({
      success: true,
      data: scoringInsights,
      message: "Complete scoring insights retrieved from stored API response"
    });
  } catch (error) {
    console.error("Error fetching scoring insights:", error);
    res.status(500).json({ error: "Failed to fetch scoring insights" });
  }
});

// Database health monitoring endpoint
router.get("/health", async (req, res) => {
  try {
    const health = await databaseService.healthCheck();
    const stats = await databaseService.getDatabaseStats();
    
    res.json({
      database: health,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

// Performance monitoring endpoint with cache statistics
router.get("/performance", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const startTime = Date.now();
    
    // Test optimized dashboard query performance with caching
    const dashboardData = await databaseService.getDashboardData(founderId);
    
    const queryTime = Date.now() - startTime;
    
    const kvStats = kvCacheService.isAvailable() ? await kvCacheService.getStats() : null;
    
    res.json({
      queryResponseTime: queryTime,
      hasOptimizedData: !!dashboardData,
      connectionHealth: await databaseService.healthCheck(),
      cacheStats: cacheService.getStats(),
      kvCacheStats: kvStats,
      message: queryTime < 50 ? "Excellent performance (cached)" : 
               queryTime < 100 ? "Excellent performance" : 
               queryTime < 500 ? "Good performance" : "Needs optimization"
    });
  } catch (error) {
    console.error("Performance test error:", error);
    res.status(500).json({ error: "Performance test failed" });
  }
});

// KV Cache management endpoint
router.post("/cache/cleanup", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!kvCacheService.isAvailable()) {
      return res.json({ 
        message: "KV store not available", 
        memoryCleanup: cacheService.getStats() 
      });
    }

    const cleanedCount = await kvCacheService.cleanup();
    
    res.json({
      success: true,
      cleanedEntries: cleanedCount,
      kvStats: await kvCacheService.getStats(),
      memoryStats: cacheService.getStats()
    });
  } catch (error) {
    console.error("Cache cleanup error:", error);
    res.status(500).json({ error: "Cache cleanup failed" });
  }
});

// Cache invalidation endpoint for testing
router.post("/cache/invalidate/:type", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    const cacheType = req.params.type;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    switch (cacheType) {
      case 'founder':
        cacheService.invalidateFounder(founderId);
        databaseService.invalidateFounderCache(founderId);
        if (kvCacheService.isAvailable()) {
          await kvCacheService.delete(`founder_${founderId}`, { namespace: 'founder' });
        }
        break;
      case 'dashboard':
        cacheService.invalidateDashboard(founderId);
        if (kvCacheService.isAvailable()) {
          await kvCacheService.delete(`dashboard_${founderId}`, { namespace: 'dashboard' });
        }
        break;
      case 'all':
        cacheService.invalidateFounder(founderId);
        cacheService.invalidateDashboard(founderId);
        databaseService.invalidateFounderCache(founderId);
        if (kvCacheService.isAvailable()) {
          await kvCacheService.clearNamespace('founder');
          await kvCacheService.clearNamespace('dashboard');
        }
        break;
      default:
        return res.status(400).json({ error: "Invalid cache type" });
    }

    res.json({
      success: true,
      invalidated: cacheType,
      founderId,
      cacheStats: cacheService.getStats()
    });
  } catch (error) {
    console.error("Cache invalidation error:", error);
    res.status(500).json({ error: "Cache invalidation failed" });
  }
});

// Test endpoint for performance monitoring without authentication
router.get("/test-performance", async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Use a test founder ID for demonstration
    const testFounderId = "test-founder-123";
    
    // Test optimized dashboard query performance with caching
    const mockData = {
      founder: { id: testFounderId, name: "Test Founder" },
      venture: { id: "test-venture", name: "Test Venture" },
      evaluation: { proofScore: 85 }
    };
    
    // Test KV cache operations
    const data = await cacheService.getDashboardData(testFounderId, async () => mockData);
    
    const queryTime = Date.now() - startTime;
    
    const kvStats = kvCacheService.isAvailable() ? await kvCacheService.getStats() : { available: false, error: "KV store not available" };
    
    res.json({
      queryResponseTime: queryTime,
      hasOptimizedData: true,
      connectionHealth: await databaseService.healthCheck(),
      cacheStats: cacheService.getStats(),
      kvCacheStats: kvStats,
      message: queryTime < 50 ? "Excellent performance (cached)" : 
               queryTime < 100 ? "Excellent performance" : 
               queryTime < 500 ? "Good performance" : "Needs optimization",
      testMode: true
    });
  } catch (error) {
    console.error("Performance test error:", error);
    res.status(500).json({ error: "Performance test failed" });
  }
});

// Test cache cleanup without authentication
router.post("/test-cache-cleanup", async (req, res) => {
  try {
    if (!kvCacheService.isAvailable()) {
      return res.json({ 
        message: "KV store not available", 
        memoryCleanup: cacheService.getStats(),
        testMode: true
      });
    }

    let cleanedCount = 0;
    try {
      cleanedCount = await kvCacheService.cleanup();
    } catch (error) {
      console.error("KV cleanup error:", error);
    }
    
    res.json({
      success: true,
      cleanedEntries: cleanedCount,
      kvStats: await kvCacheService.getStats(),
      cacheStats: cacheService.getStats(),
      testMode: true
    });
  } catch (error) {
    console.error("Cache cleanup error:", error);
    res.status(500).json({ error: "Cache cleanup failed" });
  }
});

// Test cache invalidation without authentication
router.post("/test-cache-invalidate/:type", async (req, res) => {
  try {
    const cacheType = req.params.type;
    const testFounderId = "test-founder-123";

    switch (cacheType) {
      case 'founder':
        cacheService.invalidateFounder(testFounderId);
        if (kvCacheService.isAvailable()) {
          await kvCacheService.delete(`founder_${testFounderId}`, { namespace: 'founder' });
        }
        break;
      case 'dashboard':
        cacheService.invalidateDashboard(testFounderId);
        if (kvCacheService.isAvailable()) {
          await kvCacheService.delete(`dashboard_${testFounderId}`, { namespace: 'dashboard' });
        }
        break;
      case 'all':
        cacheService.invalidateFounder(testFounderId);
        cacheService.invalidateDashboard(testFounderId);
        if (kvCacheService.isAvailable()) {
          await kvCacheService.clearNamespace('founder');
          await kvCacheService.clearNamespace('dashboard');
        }
        break;
      default:
        return res.status(400).json({ error: "Invalid cache type" });
    }

    res.json({
      success: true,
      invalidated: cacheType,
      founderId: testFounderId,
      cacheStats: cacheService.getStats(),
      testMode: true
    });
  } catch (error) {
    console.error("Cache invalidation error:", error);
    res.status(500).json({ error: "Cache invalidation failed" });
  }
});

export default router;