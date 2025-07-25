import { eq, desc, and } from "drizzle-orm";
import { venture, evaluation, type Venture, type InsertVenture } from "@shared/schema";
import { BaseRepository } from "./base-repository";

export class VentureRepository extends BaseRepository {
  /**
   * Get venture by ID with caching
   */
  async getById(id: string): Promise<Venture | undefined> {
    return await this.executeWithCache('venture', id, async () => {
      const [ventureRecord] = await this.db.select().from(venture).where(eq(venture.ventureId, id));
      return ventureRecord;
    });
  }

  /**
   * Get ventures by founder ID
   */
  async getByFounderId(founderId: string): Promise<Venture[]> {
    return await this.executeQuery(async () => {
      return await this.db
        .select()
        .from(venture)
        .where(eq(venture.founderId, founderId))
        .orderBy(desc(venture.createdAt));
    });
  }

  /**
   * Get latest venture for founder
   */
  async getLatestByFounderId(founderId: string): Promise<Venture | undefined> {
    return await this.executeQuery(async () => {
      const [ventureRecord] = await this.db
        .select()
        .from(venture)
        .where(eq(venture.founderId, founderId))
        .orderBy(desc(venture.createdAt))
        .limit(1);
      return ventureRecord;
    });
  }

  /**
   * Create new venture
   */
  async create(ventureData: InsertVenture): Promise<Venture> {
    return await this.executeQuery(async () => {
      const [ventureRecord] = await this.db.insert(venture).values(ventureData).returning();
      
      // Invalidate founder cache since they now have a new venture
      if (ventureRecord.founderId) {
        await this.invalidateCache('founder', ventureRecord.founderId);
        await this.invalidateCache('dashboard', ventureRecord.founderId);
      }
      
      return ventureRecord;
    });
  }

  /**
   * Update venture
   */
  async update(id: string, updates: Partial<InsertVenture>): Promise<Venture | undefined> {
    const result = await this.executeQuery(async () => {
      const [ventureRecord] = await this.db
        .update(venture)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(venture.ventureId, id))
        .returning();
      return ventureRecord;
    });

    if (result) {
      await this.invalidateCache('venture', id);
      if (result.founderId) {
        await this.invalidateCache('dashboard', result.founderId);
      }
    }
    return result;
  }

  /**
   * Update certificate URL
   */
  async updateCertificateUrl(id: string, certificateUrl: string): Promise<void> {
    await this.update(id, {
      certificateUrl,
      certificateGeneratedAt: new Date()
    });
  }

  /**
   * Update report URL
   */
  async updateReportUrl(id: string, reportUrl: string): Promise<void> {
    await this.update(id, {
      reportUrl,
      reportGeneratedAt: new Date()
    });
  }

  /**
   * Update folder structure
   */
  async updateFolderStructure(id: string, folderStructure: any): Promise<void> {
    await this.update(id, { folderStructure });
  }

  /**
   * Get venture with latest evaluation (for dashboard)
   */
  async getWithLatestEvaluation(ventureId: string): Promise<any> {
    return await this.executeWithCache('dashboard', `venture_eval_${ventureId}`, async () => {
      const result = await this.db
        .select({
          venture: venture,
          evaluation: evaluation
        })
        .from(venture)
        .leftJoin(evaluation, eq(evaluation.ventureId, venture.ventureId))
        .where(eq(venture.ventureId, ventureId))
        .orderBy(desc(evaluation.createdAt))
        .limit(1);

      if (result.length === 0) return null;

      return {
        ...result[0].venture,
        latestEvaluation: result[0].evaluation
      };
    });
  }

  /**
   * Get ventures by founder with evaluation data (for leaderboard)
   */
  async getByFounderWithEvaluations(founderId: string): Promise<any[]> {
    return await this.executeQuery(async () => {
      return await this.db
        .select({
          venture: venture,
          evaluation: evaluation
        })
        .from(venture)
        .leftJoin(evaluation, eq(evaluation.ventureId, venture.ventureId))
        .where(eq(venture.founderId, founderId))
        .orderBy(desc(venture.createdAt));
    });
  }
}