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
      proofScore: latestEvaluation?.proofscore || 85,
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

    // Get real activity data from database
    const activities = [];
    
    // Get founder data
    const founder = await storage.getFounder(founderId);
    if (!founder) {
      return res.status(404).json({ error: 'Founder not found' });
    }

    // Get latest venture
    const ventures = await storage.getVenturesByFounderId(founderId);
    const latestVenture = ventures?.[0];

    // 1. Account creation activity (oldest)
    activities.push({
      id: "activity-account-created",
      type: "platform",
      title: "Joined Second Chance platform",
      description: "Welcome to the startup validation ecosystem",
      timestamp: founder.createdAt.toISOString(),
      icon: "user-plus",
      color: "purple"
    });

    // 2. Email verification activity
    if (founder.emailVerified) {
      activities.push({
        id: "activity-email-verified",
        type: "account",
        title: "Email verified successfully",
        description: "Your email has been verified and account is active",
        timestamp: founder.lastLoginAt?.toISOString() || founder.createdAt.toISOString(),
        icon: "check",
        color: "green"
      });
    }

    // 3. Venture creation activity
    if (latestVenture) {
      activities.push({
        id: "activity-venture-created",
        type: "venture",
        title: `Venture "${latestVenture.name}" created`,
        description: `${latestVenture.industry} startup in ${latestVenture.geography}`,
        timestamp: latestVenture.createdAt.toISOString(),
        icon: "building",
        color: "blue"
      });

      // 4. ProofScore establishment
      const evaluations = await storage.getEvaluationsByVentureId(latestVenture.ventureId);
      if (evaluations && evaluations.length > 0) {
        const latestEvaluation = evaluations[0];
        let scoreDescription = `Initial score: ${latestEvaluation.proofscore}/100`;
        if (latestEvaluation.proofscore >= 90) scoreDescription += " - Investor Ready!";
        else if (latestEvaluation.proofscore >= 70) scoreDescription += " - Great starting point!";
        
        activities.push({
          id: "activity-proofscore",
          type: "score",
          title: "ProofScore established",
          description: scoreDescription,
          timestamp: latestEvaluation.createdAt.toISOString(),
          icon: "trending-up",
          color: "yellow"
        });
      }

      // 5. Document upload activities (most recent)
      const documentUploads = await storage.getDocumentUploadsByVentureId(latestVenture.ventureId);
      documentUploads.slice(0, 3).forEach((doc, index) => {
        let title = `Uploaded ${doc.originalName}`;
        let description = `Document uploaded successfully`;
        let icon = "file-text";
        let color = "gray";
        
        // Customize based on document type
        if (doc.originalName.includes('Certificate')) {
          title = 'Validation certificate generated';
          description = 'Your achievement certificate is ready for download';
          icon = "award";
          color = "green";
        } else if (doc.originalName.includes('Report')) {
          title = 'Analysis report generated';
          description = 'Comprehensive validation report available';
          icon = "bar-chart";
          color = "blue";
        } else if (doc.originalName.toLowerCase().includes('deck')) {
          title = 'Pitch deck uploaded';
          description = 'Pitch deck uploaded and analyzed';
          icon = "upload";
          color = "purple";
        }

        activities.push({
          id: `activity-document-${doc.uploadId}`,
          type: "document",
          title: title,
          description: description,
          timestamp: doc.createdAt.toISOString(),
          icon: icon,
          color: color
        });
      });
    }

    // Sort by timestamp (most recent first) and limit to 5
    const sortedActivities = activities
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

export default router;