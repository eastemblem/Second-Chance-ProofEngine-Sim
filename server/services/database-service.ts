import { db, pool } from "../db";
import { 
  founder, venture, teamMember, evaluation, documentUpload, proofVault, 
  leaderboard, userActivity, onboardingSession,
  type Founder, type Venture, type Evaluation, type DocumentUpload, type ProofVault,
  type InsertFounder, type InsertVenture
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { cacheService } from "./cache-service";
import { lruCacheService } from "./lru-cache-service";
import { appLogger } from "../utils/logger";

/**
 * Centralized Database Service Layer
 * Consolidates database operations and implements query optimization
 */
export class DatabaseService {
  
  /**
   * OPTIMIZED: Get complete dashboard data with caching
   * Replaces 4-5 separate database calls with one optimized join + cache layer
   */
  async getDashboardData(founderId: string) {
    return await cacheService.getDashboardData(founderId, async () => {
      return await this.fetchDashboardDataFromDB(founderId);
    });
  }

  /**
   * Internal method: Fetch dashboard data from database
   */
  private async fetchDashboardDataFromDB(founderId: string) {
    try {
      // Single optimized query with joins to get all dashboard data
      const result = await db
        .select({
          // Founder data
          founder: {
            founderId: founder.founderId,
            fullName: founder.fullName,
            email: founder.email,
          },
          // Venture data
          venture: {
            ventureId: venture.ventureId,
            name: venture.name,
            folderStructure: venture.folderStructure,
            createdAt: venture.createdAt,
          },
          // Latest evaluation data
          evaluation: {
            evaluationId: evaluation.evaluationId,
            proofscore: evaluation.proofscore,
            vaultscore: evaluation.vaultscore,
            prooftags: evaluation.prooftags,
            fullApiResponse: evaluation.fullApiResponse,
            dimensionScores: evaluation.dimensionScores,
            evaluationDate: evaluation.evaluationDate,
          }
        })
        .from(founder)
        .leftJoin(venture, eq(venture.founderId, founder.founderId))
        .leftJoin(evaluation, and(
          eq(evaluation.ventureId, venture.ventureId),
          eq(evaluation.isCurrent, true)
        ))
        .where(eq(founder.founderId, founderId))
        .orderBy(desc(venture.createdAt))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      const data = result[0];
      
      // If we have a venture, get additional data in parallel
      if (data.venture?.ventureId) {
        const [documentUploads, proofVaultRecords] = await Promise.all([
          this.getDocumentUploadsByVentureId(data.venture.ventureId),
          this.getProofVaultsByVentureId(data.venture.ventureId)
        ]);

        return {
          founder: data.founder,
          venture: data.venture,
          evaluation: data.evaluation,
          documentUploads,
          proofVaultRecords
        };
      }

      return {
        founder: data.founder,
        venture: data.venture,
        evaluation: data.evaluation,
        documentUploads: [],
        proofVaultRecords: []
      };
      
    } catch (error) {
      appLogger.database("Dashboard data query error:", error);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Get founder with their latest venture and evaluation with caching
   */
  async getFounderWithLatestVenture(founderId: string) {
    return await cacheService.getFounder(founderId, async () => {
      return await this.fetchFounderWithLatestVentureFromDB(founderId);
    });
  }

  /**
   * Internal method: Fetch founder with venture from database
   */
  async fetchFounderWithLatestVentureFromDB(founderId: string) {
    appLogger.database(`Database query - fetchFounderWithLatestVentureFromDB for founderId: ${founderId}`);
    
    try {
      const result = await db
        .select({
          founder: {
            founderId: founder.founderId,
            fullName: founder.fullName,
            email: founder.email,
            emailVerified: founder.emailVerified,
            lastLoginAt: founder.lastLoginAt,
          },
          venture: {
            ventureId: venture.ventureId,
            name: venture.name,
            description: venture.description,
            industry: venture.industry,
            geography: venture.geography,
            businessModel: venture.businessModel,
            revenueStage: venture.revenueStage,
            growthStage: venture.growthStage,
            folderStructure: venture.folderStructure,
            certificateUrl: venture.certificateUrl,
            reportUrl: venture.reportUrl,
            createdAt: venture.createdAt,
          },
          latestEvaluation: {
            evaluationId: evaluation.evaluationId,
            proofscore: evaluation.proofscore,
            vaultscore: evaluation.vaultscore,
            prooftags: evaluation.prooftags,
            fullApiResponse: evaluation.fullApiResponse,
            dimensionScores: evaluation.dimensionScores,
            evaluationDate: evaluation.evaluationDate,
          }
        })
        .from(founder)
        .leftJoin(venture, eq(venture.founderId, founder.founderId))
        .leftJoin(evaluation, eq(evaluation.ventureId, venture.ventureId))
        .where(eq(founder.founderId, founderId))
        .orderBy(desc(venture.createdAt), desc(evaluation.evaluationDate))
        .limit(1);

      appLogger.database(`Query result - rows found: ${result.length}`);
      if (result.length > 0) {
        const data = result[0];
        appLogger.database(`Query result details:`, {
          hasFounder: !!data.founder?.founderId,
          founderId: data.founder?.founderId,
          founderEmail: data.founder?.email,
          hasVenture: !!data.venture?.ventureId,
          ventureId: data.venture?.ventureId,
          ventureName: data.venture?.name,
          hasEvaluation: !!data.latestEvaluation?.evaluationId,
          evaluationId: data.latestEvaluation?.evaluationId,
          proofscore: data.latestEvaluation?.proofscore
        });
        
        return data;
      }

      appLogger.database(`No data found for founderId: ${founderId}`);
      return null;
      
    } catch (error) {
      appLogger.database(`Database query error in fetchFounderWithLatestVentureFromDB:`, error);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Get venture with evaluation data for scoring insights
   */
  async getVentureWithEvaluation(ventureId: string) {
    const result = await db
      .select({
        venture: {
          ventureId: venture.ventureId,
          name: venture.name,
          description: venture.description,
          founderId: venture.founderId,
        },
        evaluation: {
          evaluationId: evaluation.evaluationId,
          proofscore: evaluation.proofscore,
          vaultscore: evaluation.vaultscore,
          prooftags: evaluation.prooftags,
          fullApiResponse: evaluation.fullApiResponse,
          dimensionScores: evaluation.dimensionScores,
          evaluationDate: evaluation.evaluationDate,
        }
      })
      .from(venture)
      .leftJoin(evaluation, eq(evaluation.ventureId, venture.ventureId))
      .where(eq(venture.ventureId, ventureId))
      .orderBy(desc(evaluation.evaluationDate))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Batch operation: Get multiple ventures with their evaluations
   */
  async getVenturesWithEvaluations(ventureIds: string[]) {
    if (ventureIds.length === 0) return [];

    return await db
      .select({
        venture: {
          ventureId: venture.ventureId,
          name: venture.name,
          founderId: venture.founderId,
        },
        evaluation: {
          evaluationId: evaluation.evaluationId,
          proofscore: evaluation.proofscore,
          vaultscore: evaluation.vaultscore,
          prooftags: evaluation.prooftags,
          evaluationDate: evaluation.evaluationDate,
        }
      })
      .from(venture)
      .leftJoin(evaluation, eq(evaluation.ventureId, venture.ventureId))
      .where(sql`${venture.ventureId} = ANY(${ventureIds})`)
      .orderBy(desc(evaluation.evaluationDate));
  }

  /**
   * Optimized document uploads query with venture context
   */
  async getDocumentUploadsByVentureId(ventureId: string): Promise<DocumentUpload[]> {
    return await db
      .select()
      .from(documentUpload)
      .where(eq(documentUpload.ventureId, ventureId))
      .orderBy(desc(documentUpload.createdAt));
  }

  /**
   * Optimized proof vault query with venture context
   */
  async getProofVaultsByVentureId(ventureId: string): Promise<ProofVault[]> {
    return await db
      .select()
      .from(proofVault)
      .where(eq(proofVault.ventureId, ventureId))
      .orderBy(proofVault.folderName);
  }

  /**
   * Get founder by email for authentication
   */
  async getFounderByEmail(email: string): Promise<Founder | undefined> {
    const [founderRecord] = await db.select().from(founder).where(eq(founder.email, email));
    return founderRecord;
  }

  /**
   * Get founder by ID for authentication verification
   */
  async getFounderById(founderId: string): Promise<Founder | undefined> {
    const [founderRecord] = await db.select().from(founder).where(eq(founder.founderId, founderId));
    return founderRecord;
  }



  /**
   * Create new founder for registration
   */
  async createFounder(insertFounder: InsertFounder): Promise<Founder> {
    const [founderRecord] = await db.insert(founder).values(insertFounder).returning();
    return founderRecord;
  }

  /**
   * Create new venture for founder
   */
  async createVenture(insertVenture: InsertVenture): Promise<Venture> {
    // Filter out any fields that don't exist in the database schema
    const filteredVenture = {
      founderId: insertVenture.founderId,
      name: insertVenture.name,
      industry: insertVenture.industry,
      geography: insertVenture.geography,
      businessModel: insertVenture.businessModel,
      revenueStage: insertVenture.revenueStage,
      mvpStatus: insertVenture.mvpStatus,
      website: insertVenture.website,
      hasTestimonials: insertVenture.hasTestimonials,
      description: insertVenture.description,
      linkedinUrl: insertVenture.linkedinUrl,
      twitterUrl: insertVenture.twitterUrl,
      instagramUrl: insertVenture.instagramUrl,
    };
    
    const [ventureRecord] = await db.insert(venture).values(filteredVenture).returning();
    return ventureRecord;
  }

  /**
   * Get ventures by founder ID
   */
  async getVenturesByFounderId(founderId: string): Promise<Venture[]> {
    return await db.select().from(venture).where(eq(venture.founderId, founderId));
  }

  /**
   * Connection health check and monitoring
   */
  async healthCheck(): Promise<{ status: string; connections: number; uptime: number }> {
    try {
      const startTime = Date.now();
      await db.execute(sql`SELECT 1 as test`);
      const responseTime = Date.now() - startTime;

      // Get connection pool stats
      const poolStats = {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
      };

      return {
        status: responseTime < 100 ? 'healthy' : 'slow',
        connections: poolStats.totalConnections,
        uptime: responseTime
      };
    } catch (error) {
      appLogger.database("Database health check failed:", error);
      return {
        status: 'unhealthy',
        connections: 0,
        uptime: -1
      };
    }
  }

  /**
   * Query performance monitoring
   */
  async executeWithTiming<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        appLogger.performance(`Slow query detected - ${queryName}: ${duration}ms`);
      } else if (duration > 100) {
        appLogger.performance(`Query timing - ${queryName}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      appLogger.database(`Query failed - ${queryName}: ${duration}ms`, error);
      throw error;
    }
  }

  /**
   * Batch insert with transaction support
   */
  async batchInsert<T>(
    table: any,
    records: T[],
    batchSize: number = 100
  ): Promise<void> {
    if (records.length === 0) return;

    // Process in batches to avoid memory issues
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await db.insert(table).values(batch);
    }
  }

  /**
   * Cache invalidation triggers for data updates
   */
  invalidateFounderCache(founderId: string): void {
    cacheService.invalidateFounder(founderId);
  }

  invalidateVentureCache(ventureId: string): void {
    cacheService.invalidateVenture(ventureId);
  }

  /**
   * Get database statistics for monitoring
   */
  async getDatabaseStats() {
    try {
      const stats = await Promise.all([
        // Count total records in main tables
        db.select({ count: sql<number>`count(*)` }).from(founder),
        db.select({ count: sql<number>`count(*)` }).from(venture),
        db.select({ count: sql<number>`count(*)` }).from(evaluation),
        db.select({ count: sql<number>`count(*)` }).from(documentUpload),
        // Get recent activity
        db.select({ count: sql<number>`count(*)` })
          .from(venture)
          .where(sql`${venture.createdAt} > NOW() - INTERVAL '24 hours'`),
      ]);

      return {
        totalFounders: stats[0][0]?.count || 0,
        totalVentures: stats[1][0]?.count || 0,
        totalEvaluations: stats[2][0]?.count || 0,
        totalDocuments: stats[3][0]?.count || 0,
        recentVentures: stats[4][0]?.count || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      appLogger.database("Failed to get database stats:", error);
      return null;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();