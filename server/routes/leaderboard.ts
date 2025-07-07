import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Mock data for leaderboard (when no real data exists)
const generateMockLeaderboard = () => [
  { ventureName: "TechFlow Solutions", totalScore: 92, rank: 1 },
  { ventureName: "GreenTech Innovations", totalScore: 88, rank: 2 },
  { ventureName: "DataDrive Analytics", totalScore: 85, rank: 3 },
  { ventureName: "CloudSync Systems", totalScore: 82, rank: 4 },
  { ventureName: "FinanceFirst Platform", totalScore: 79, rank: 5 },
  { ventureName: "HealthTech Connect", totalScore: 76, rank: 6 },
  { ventureName: "EduLearn Solutions", totalScore: 73, rank: 7 },
  { ventureName: "RetailBoost App", totalScore: 70, rank: 8 },
  { ventureName: "LogisticsPro Hub", totalScore: 67, rank: 9 },
  { ventureName: "StartupLaunch Kit", totalScore: 64, rank: 10 },
];

/**
 * Get leaderboard data
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get real leaderboard data
    const realData = await storage.getLeaderboard(limit);
    
    // If we have enough real data, use it
    if (realData.length >= 5) {
      const formattedData = realData.map((entry, index) => ({
        ventureName: entry.ventureName,
        totalScore: entry.totalScore,
        rank: index + 1,
        analysisDate: entry.analysisDate
      }));
      
      return res.json({
        success: true,
        data: formattedData,
        source: 'real'
      });
    }
    
    // Otherwise, mix real data with mock data
    const mockData = generateMockLeaderboard();
    const allEntries = [
      ...realData.map(entry => ({
        ventureName: entry.ventureName,
        totalScore: entry.totalScore,
        analysisDate: entry.analysisDate,
        isReal: true
      })),
      ...mockData.map(entry => ({
        ventureName: entry.ventureName,
        totalScore: entry.totalScore,
        isReal: false
      }))
    ];
    
    // Sort all entries by score descending and assign proper ranks
    const combinedData = allEntries
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        ventureName: entry.ventureName,
        totalScore: entry.totalScore,
        rank: index + 1,
        analysisDate: entry.analysisDate,
        isReal: entry.isReal
      }));
    
    res.json({
      success: true,
      data: combinedData,
      source: 'mixed'
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