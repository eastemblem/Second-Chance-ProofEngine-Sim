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

    // Get founder's venture and scoring data
    const founder = await storage.getFounder(founderId);
    if (!founder) {
      return res.status(404).json({ error: "Founder not found" });
    }

    // Mock data based on existing ProofScore system
    // In production, this would fetch from actual scoring results
    const validationData = {
      proofScore: 85,
      proofTagsUnlocked: 11,
      totalProofTags: 21,
      filesUploaded: 0,
      status: "Excellent! You're investor-ready. Your data room is now visible to our verified investor network."
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

    // Mock data for ProofVault
    // In production, this would query actual file storage
    const vaultData = {
      overviewCount: 0,
      problemProofCount: 0,
      solutionProofCount: 0,
      demandProofCount: 0,
      totalFiles: 0,
      files: [
        // Example file structure
        // {
        //   id: "file-1",
        //   name: "Pitch Deck.pdf",
        //   category: "Overview",
        //   uploadDate: "2025-01-15",
        //   size: "2.4 MB",
        //   downloadUrl: "/api/vault/download/file-1"
        // }
      ]
    };

    res.json(vaultData);
  } catch (error) {
    console.error("Vault data error:", error);
    res.status(500).json({ error: "Failed to load vault data" });
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