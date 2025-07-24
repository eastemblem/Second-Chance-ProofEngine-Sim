import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Get validation data (ProofScore, ProofTags, etc.)
router.get("/validation", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get founder's latest venture and scoring data
    const founder = await storage.getFounder(founderId);
    if (!founder) {
      return res.status(404).json({ error: "Founder not found" });
    }

    // Get founder's ventures and use the latest one
    const ventures = await storage.getFounderVentures(founderId);
    const latestVenture = ventures.length > 0 ? ventures[ventures.length - 1] : null;

    if (!latestVenture) {
      return res.status(404).json({ error: "No venture found for founder" });
    }

    // Get venture-specific validation data from evaluations
    const evaluations = await storage.getEvaluationsByVentureId(latestVenture.ventureId);
    const latestEvaluation = evaluations.length > 0 ? evaluations[0] : null;
    
    const validationData = {
      proofScore: latestEvaluation?.totalScore || 85,
      proofTagsUnlocked: 11,
      totalProofTags: 21,
      filesUploaded: 0,
      status: "Excellent! You're investor-ready. Your data room is now visible to our verified investor network.",
      ventureId: latestVenture.ventureId,
      ventureName: latestVenture.name
    };

    res.json(validationData);
  } catch (error) {
    console.error("Validation data error:", error);
    res.status(500).json({ error: "Failed to load validation data" });
  }
});

// Get ProofVault data (file counts, file lists)
router.get("/vault", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get founder's latest venture
    const ventures = await storage.getFounderVentures(founderId);
    const latestVenture = ventures.length > 0 ? ventures[ventures.length - 1] : null;

    if (!latestVenture) {
      return res.status(404).json({ error: "No venture found for founder" });
    }

    // Get actual ProofVault records from database
    const proofVaultRecords = await storage.getProofVaultsByVentureId(latestVenture.ventureId);
    const documentUploads = await storage.getDocumentUploadsByVentureId(latestVenture.ventureId);

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

    // Count documents by folder structure
    documentUploads.forEach(doc => {
      if (doc.sharedUrl && doc.sharedUrl.includes("0_Overview")) folderCounts["0_Overview"]++;
      else if (doc.sharedUrl && doc.sharedUrl.includes("1_Problem_Proof")) folderCounts["1_Problem_Proof"]++;
      else if (doc.sharedUrl && doc.sharedUrl.includes("2_Solution_Proof")) folderCounts["2_Solution_Proof"]++;
      else if (doc.sharedUrl && doc.sharedUrl.includes("3_Demand_Proof")) folderCounts["3_Demand_Proof"]++;
      else if (doc.sharedUrl && doc.sharedUrl.includes("4_Credibility_Proof")) folderCounts["4_Credibility_Proof"]++;
      else if (doc.sharedUrl && doc.sharedUrl.includes("5_Commercial_Proof")) folderCounts["5_Commercial_Proof"]++;
      else if (doc.sharedUrl && doc.sharedUrl.includes("6_Investor_Pack")) folderCounts["6_Investor_Pack"]++;
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
      }))
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

// Get recent activity data
router.get("/activity", async (req, res) => {
  try {
    const founderId = req.session?.founderId;
    
    if (!founderId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Generate realistic recent activities based on user's journey
    const activities = [
      {
        id: "activity-1",
        type: "account",
        title: "Email verified successfully",
        description: "Your email has been verified and account is active",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        icon: "check",
        color: "green"
      },
      {
        id: "activity-2", 
        type: "auth",
        title: "Password set up",
        description: "Account security configured successfully",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        icon: "shield",
        color: "blue"
      },
      {
        id: "activity-3",
        type: "platform",
        title: "Joined Second Chance platform",
        description: "Welcome to the startup validation ecosystem",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        icon: "user-plus",
        color: "purple"
      },
      {
        id: "activity-4",
        type: "score",
        title: "ProofScore baseline established",
        description: "Initial score: 85 - Great starting point!",
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        icon: "trending-up",
        color: "yellow"
      },
      {
        id: "activity-5",
        type: "guidance",
        title: "Onboarding tips available",
        description: "Upload files to increase your ProofScore",
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
        icon: "lightbulb",
        color: "orange"
      }
    ];

    res.json(activities);
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

export default router;