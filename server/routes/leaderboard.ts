import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Remove mock data - only use real leaderboard data

// Mock leaderboard data to fill gaps when real data is insufficient  
const mockLeaderboardData = [
  { ventureName: "TechNova Solutions", totalScore: 94, isReal: false },
  { ventureName: "GreenWave Dynamics", totalScore: 91, isReal: false },
  { ventureName: "QuantumLeap Analytics", totalScore: 89, isReal: false },
  { ventureName: "EcoSmart Innovations", totalScore: 87, isReal: false },
  { ventureName: "DataFlow Systems", totalScore: 85, isReal: false },
  { ventureName: "NeuroTech Labs", totalScore: 83, isReal: false },
  { ventureName: "CloudBridge Networks", totalScore: 81, isReal: false },
  { ventureName: "BioGen Therapeutics", totalScore: 79, isReal: false },
  { ventureName: "SmartGrid Energy", totalScore: 77, isReal: false },
  { ventureName: "CyberShield Security", totalScore: 75, isReal: false }
];

/**
 * Get leaderboard data - ensures 10 entries with mock data if needed
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get real leaderboard data
    const realData = await storage.getLeaderboard(50); // Get more entries to work with
    
    // Format real data
    const formattedRealData = realData.map((entry, index) => ({
      ventureName: entry.ventureName,
      totalScore: entry.totalScore,
      rank: index + 1,
      analysisDate: entry.analysisDate,
      isReal: true
    }));
    
    // If we have fewer than requested limit, add mock data
    let finalData = [...formattedRealData];
    
    if (finalData.length < limit) {
      const needed = limit - finalData.length;
      let availableMockData = [...mockLeaderboardData];
      
      // Filter out mock entries that might conflict with real venture names
      const realVentureNames = new Set(formattedRealData.map(entry => entry.ventureName.toLowerCase()));
      availableMockData = availableMockData.filter(mock => 
        !realVentureNames.has(mock.ventureName.toLowerCase())
      );
      
      // Adjust mock scores to be lower than the lowest real score (if any real data exists)
      const lowestRealScore = formattedRealData.length > 0 
        ? Math.min(...formattedRealData.map(entry => entry.totalScore))
        : 100;
      
      // Add mock entries with adjusted scores
      for (let i = 0; i < Math.min(needed, availableMockData.length); i++) {
        const mockEntry = availableMockData[i];
        const adjustedScore = Math.min(mockEntry.totalScore, lowestRealScore - 1 - i);
        
        finalData.push({
          ventureName: mockEntry.ventureName,
          totalScore: Math.max(adjustedScore, 50), // Minimum score of 50
          rank: finalData.length + 1,
          analysisDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(), // Recent dates
          isReal: false
        });
      }
    }
    
    // Sort by score descending and reassign ranks
    finalData.sort((a, b) => b.totalScore - a.totalScore);
    finalData = finalData.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    const source = formattedRealData.length === finalData.length ? 'real' : 'mixed';
    
    res.json({
      success: true,
      data: finalData,
      source,
      totalEntries: finalData.length,
      realEntries: formattedRealData.length,
      mockEntries: finalData.length - formattedRealData.length
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