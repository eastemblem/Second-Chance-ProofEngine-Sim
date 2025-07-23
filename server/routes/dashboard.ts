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

    // Get venture-specific validation data
    // In production, this would fetch from actual scoring results for the specific venture
    const validationData = {
      proofScore: latestVenture.proofScore || 85,
      proofTagsUnlocked: 11,
      totalProofTags: 21,
      filesUploaded: 0,
      status: "Excellent! You're investor-ready. Your data room is now visible to our verified investor network.",
      ventureId: latestVenture.id,
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

    // Get venture-specific ProofVault data
    // In production, this would query actual file storage for the specific venture
    const vaultData = {
      overviewCount: 0,
      problemProofCount: 0,
      solutionProofCount: 0,
      demandProofCount: 0,
      totalFiles: 0,
      ventureId: latestVenture.id,
      ventureName: latestVenture.name,
      files: [
        // Example file structure for this venture
        // {
        //   id: "file-1",
        //   name: "Pitch Deck.pdf",
        //   category: "Overview",
        //   uploadDate: "2025-01-15",
        //   size: "2.4 MB",
        //   downloadUrl: `/api/vault/download/${latestVenture.id}/file-1`,
        //   ventureId: latestVenture.id
        // }
      ]
    };

    res.json(vaultData);
  } catch (error) {
    console.error("Vault data error:", error);
    res.status(500).json({ error: "Failed to load vault data" });
  }
});

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