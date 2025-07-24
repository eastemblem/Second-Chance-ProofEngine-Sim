import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Remove mock data - only use real leaderboard data

/**
 * Get leaderboard data
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get real leaderboard data only
    const realData = await storage.getLeaderboard(limit);
    
    const formattedData = realData.map((entry, index) => ({
      ventureName: entry.ventureName,
      totalScore: entry.totalScore,
      rank: index + 1,
      analysisDate: entry.analysisDate
    }));
    
    res.json({
      success: true,
      data: formattedData,
      source: 'real',
      totalEntries: formattedData.length
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leaderboard"
    });
  }
}

/**
 * Create leaderboard entry after analysis
 */
export async function createLeaderboardEntry(req: Request, res: Response) {
  try {
    const createSchema = z.object({
      ventureId: z.string().uuid(),
      ventureName: z.string(),
      totalScore: z.number().min(0).max(100),
      dimensionScores: z.object({
        desirability: z.number(),
        feasibility: z.number(),
        viability: z.number(),
        traction: z.number(),
        readiness: z.number(),
      }).optional()
    });

    const validatedData = createSchema.parse(req.body);
    
    // Check if entry already exists for this venture
    const existing = await storage.getLeaderboardByVentureId(validatedData.ventureId);
    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: "Leaderboard entry already exists"
      });
    }
    
    const entry = await storage.createLeaderboardEntry(validatedData);
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error("Error creating leaderboard entry:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create leaderboard entry"
    });
  }
}