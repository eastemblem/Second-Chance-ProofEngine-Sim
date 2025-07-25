import { eq, desc, gte, and } from "drizzle-orm";
import { evaluation, venture, founder, type Evaluation, type InsertEvaluation } from "@shared/schema";
import { BaseRepository } from "./base-repository";

export class EvaluationRepository extends BaseRepository {
  /**
   * Get evaluation by ID
   */
  async getById(id: string): Promise<Evaluation | undefined> {
    return await this.executeQuery(async () => {
      const [evaluationRecord] = await this.db.select().from(evaluation).where(eq(evaluation.evaluationId, id));
      return evaluationRecord;
    });
  }

  /**
   * Get evaluations by venture ID
   */
  async getByVentureId(ventureId: string): Promise<Evaluation[]> {
    return await this.executeQuery(async () => {
      return await this.db
        .select()
        .from(evaluation)
        .where(eq(evaluation.ventureId, ventureId))
        .orderBy(desc(evaluation.createdAt));
    });
  }

  /**
   * Get latest evaluation for venture
   */
  async getLatestByVentureId(ventureId: string): Promise<Evaluation | undefined> {
    return await this.executeQuery(async () => {
      const [evaluationRecord] = await this.db
        .select()
        .from(evaluation)
        .where(eq(evaluation.ventureId, ventureId))
        .orderBy(desc(evaluation.createdAt))
        .limit(1);
      return evaluationRecord;
    });
  }

  /**
   * Create new evaluation
   */
  async create(evaluationData: InsertEvaluation): Promise<Evaluation> {
    return await this.executeQuery(async () => {
      const [evaluationRecord] = await this.db.insert(evaluation).values(evaluationData).returning();
      
      // Invalidate related caches
      if (evaluationRecord.ventureId) {
        await this.invalidateCache('venture', evaluationRecord.ventureId);
        // Need to get venture to invalidate founder cache
        const { venture } = await import("@shared/schema");
        const ventureResult = await this.db.select().from(venture).where(eq(venture.ventureId, evaluationRecord.ventureId)).limit(1);
        if (ventureResult[0]?.founderId) {
          await this.invalidateCache('dashboard', ventureResult[0].founderId);
          await this.invalidateCache('leaderboard', 'global');
        }
      }
      
      return evaluationRecord;
    });
  }

  /**
   * Update evaluation
   */
  async update(id: string, updates: Partial<InsertEvaluation>): Promise<Evaluation | undefined> {
    const result = await this.executeQuery(async () => {
      const [evaluationRecord] = await this.db
        .update(evaluation)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(evaluation.evaluationId, id))
        .returning();
      return evaluationRecord;
    });

    if (result?.ventureId) {
      await this.invalidateCache('venture', result.ventureId);
      await this.invalidateCache('leaderboard', 'global');
    }
    return result;
  }

  /**
   * Get leaderboard data (top evaluations with founder/venture info)
   */
  async getLeaderboardData(limit: number = 10): Promise<any[]> {
    return await this.executeWithCache('leaderboard', 'global', async () => {
      return await this.db
        .select({
          evaluation: evaluation,
          venture: venture,
          founder: founder
        })
        .from(evaluation)
        .innerJoin(venture, eq(evaluation.ventureId, venture.ventureId))
        .innerJoin(founder, eq(venture.founderId, founder.founderId))
        .where(gte(evaluation.proofscore, 0))
        .orderBy(desc(evaluation.proofscore), desc(evaluation.createdAt))
        .limit(limit);
    });
  }

  /**
   * Get high-performing evaluations (score >= threshold)
   */
  async getHighPerformingEvaluations(scoreThreshold: number = 70): Promise<any[]> {
    return await this.executeQuery(async () => {
      return await this.db
        .select({
          evaluation: evaluation,
          venture: venture,
          founder: founder
        })
        .from(evaluation)
        .innerJoin(venture, eq(evaluation.ventureId, venture.ventureId))
        .innerJoin(founder, eq(venture.founderId, founder.founderId))
        .where(gte(evaluation.proofscore, scoreThreshold))
        .orderBy(desc(evaluation.proofscore));
    });
  }

  /**
   * Get evaluation statistics
   */
  async getStatistics(): Promise<{
    totalEvaluations: number;
    averageScore: number;
    highPerformers: number;
  }> {
    return await this.executeWithCache('leaderboard', 'stats', async () => {
      // This would need raw SQL or separate queries in Drizzle
      // Simplified version for now
      const allEvaluations = await this.db.select().from(evaluation);
      
      const totalEvaluations = allEvaluations.length;
      const averageScore = totalEvaluations > 0 
        ? allEvaluations.reduce((sum, eval) => sum + (eval.proofscore || 0), 0) / totalEvaluations 
        : 0;
      const highPerformers = allEvaluations.filter(eval => (eval.proofscore || 0) >= 70).length;

      return {
        totalEvaluations,
        averageScore: Math.round(averageScore * 100) / 100,
        highPerformers
      };
    });
  }
}