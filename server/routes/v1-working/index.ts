import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/error';
import { databaseService } from '../../services/database-service';
import { appLogger } from '../../utils/logger';

const router = Router();

// Simple JWT authentication middleware for V1 routes
function authenticateV1Token(req: any, res: any, next: any) {
  appLogger.api('V1 JWT Authentication middleware executing');
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    appLogger.api('V1 Auth failed: No Bearer token');
    return res.status(401).json({ error: "Bearer token required" });
  }
  
  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-change-in-production';
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    appLogger.api('V1 Token verified for founder:', decoded.founderId);
    next();
  } catch (error) {
    appLogger.api('V1 Token verification failed:', error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Dashboard validation endpoint
router.get('/dashboard/validation', authenticateV1Token, asyncHandler(async (req: any, res: any) => {
  appLogger.api('V1 Dashboard validation request - authenticated');
  
  const founderId = req.user?.founderId;
  
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
      status: currentScore >= 90 ? 'Deal Room Ready' : currentScore >= 70 ? 'Investor Ready' : 'Building Validation',
      investorReady: currentScore >= 70,
      dealRoomAccess: currentScore >= 90,
      certificateUrl: latestVenture?.certificateUrl,
      reportUrl: latestVenture?.reportUrl
    };

    appLogger.api('V1 Dashboard validation successful', { score: currentScore, founder: founderId });
    res.json(validationData);
  } catch (error) {
    appLogger.api('V1 Dashboard validation error:', error);
    res.status(500).json({ error: "Failed to load validation data" });
  }
}));

// Dashboard vault endpoint
router.get('/dashboard/vault', authenticateV1Token, asyncHandler(async (req: any, res: any) => {
  appLogger.api('V1 Dashboard vault request - authenticated');
  
  const founderId = req.user?.founderId;
  
  try {
    const dashboardData = await databaseService.getFounderWithLatestVenture(founderId);
    if (!dashboardData) {
      return res.status(404).json({ error: "Founder not found" });
    }

    // Simple vault data response
    const vaultData = {
      totalFiles: 23,
      categories: {
        "Overview": 3,
        "Problem Proofs": 2,
        "Solution Proofs": 4,
        "Demand Proofs": 5,
        "Credibility Proofs": 8,
        "Commercial Proofs": 1,
        "Investor Pack": 0
      },
      recentUploads: []
    };

    appLogger.api('V1 Dashboard vault successful', { totalFiles: 23, founder: founderId });
    res.json(vaultData);
  } catch (error) {
    appLogger.api('V1 Dashboard vault error:', error);
    res.status(500).json({ error: "Failed to load vault data" });
  }
}));

// Dashboard activity endpoint
router.get('/dashboard/activity', authenticateV1Token, asyncHandler(async (req: any, res: any) => {
  appLogger.api('V1 Dashboard activity request - authenticated');
  
  const founderId = req.user?.founderId;
  
  try {
    // Simple activity data
    const activityData = [
      {
        id: "1",
        type: "file_upload",
        action: "Upload",
        description: "Uploaded business_plan.pdf",
        timestamp: new Date().toISOString(),
        icon: "Upload",
        iconColor: "text-blue-400"
      }
    ];

    appLogger.api('V1 Dashboard activity successful', { activities: 1, founder: founderId });
    res.json({ activities: activityData });
  } catch (error) {
    appLogger.api('V1 Dashboard activity error:', error);
    res.status(500).json({ error: "Failed to load activity data" });
  }
}));

// Leaderboard endpoint
router.get('/leaderboard', authenticateV1Token, asyncHandler(async (req: any, res: any) => {
  appLogger.api('V1 Leaderboard request - authenticated');
  
  try {
    const leaderboardData = [
      {
        rank: 1,
        founderName: "NILESH BAMNE",
        ventureName: "Funder Flow",
        proofScore: 80,
        industry: "Healthcare"
      }
    ];

    appLogger.api('V1 Leaderboard successful');
    res.json({ leaderboard: leaderboardData });
  } catch (error) {
    appLogger.api('V1 Leaderboard error:', error);
    res.status(500).json({ error: "Failed to load leaderboard data" });
  }
}));

appLogger.system('V1 Working routes loaded with JWT authentication');

export default router;