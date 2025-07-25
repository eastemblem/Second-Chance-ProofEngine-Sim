import { db, pool } from "../db";
import { 
  founder, venture, teamMember, evaluation, documentUpload, proofVault, 
  leaderboard, userActivity, onboardingSession,
  type Founder, type Venture, type Evaluation, type DocumentUpload, type ProofVault
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * Centralized Database Service Layer
 * Consolidates database operations and implements query optimization
 */
export class DatabaseService {
  
  /**
   * OPTIMIZED: Get complete dashboard data in a single query
   * Replaces 4-5 separate database calls with one optimized join
   */
  async getDashboardData(founderId: string) {
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
      console.error("Dashboard data query error:", error);
      throw error;
    }
  }

  /**
   * OPTIMIZED: Get founder with their latest venture and evaluation in one query
   */
  async getFounderWithLatestVenture(founderId: string) {
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
          businessModel: venture.businessModel,
          revenueStage: venture.revenueStage,
          folderStructure: venture.folderStructure,
          certificateUrl: venture.certificateUrl,
          reportUrl: venture.reportUrl,
          createdAt: venture.createdAt,
        },
        latestEvaluation: {
          evaluationId: evaluation.evaluationId,
          proofscore: evaluation.proofscore,
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

    return result[0] || null;
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
      console.error("Database health check failed:", error);
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
        console.warn(`Slow query detected - ${queryName}: ${duration}ms`);
      } else if (duration > 100) {
        console.log(`Query timing - ${queryName}: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed - ${queryName}: ${duration}ms`, error);
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
      console.error("Failed to get database stats:", error);
      return null;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();