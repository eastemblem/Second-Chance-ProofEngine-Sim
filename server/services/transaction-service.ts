import { db } from "../db";
import { cacheService } from "./cache-service";

/**
 * Transaction Service for atomic database operations
 */
export class TransactionService {
  /**
   * Execute multiple operations in a single transaction
   */
  async executeTransaction<T>(
    operations: (tx: typeof db) => Promise<T>
  ): Promise<T> {
    try {
      return await db.transaction(async (tx) => {
        return await operations(tx);
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Onboarding transaction: Create founder + venture + evaluation atomically
   */
  async createOnboardingData(data: {
    founder: any;
    venture: any;
    evaluation?: any;
  }): Promise<{
    founder: any;
    venture: any;
    evaluation?: any;
  }> {
    return await this.executeTransaction(async (tx) => {
      // Import tables inside transaction to avoid circular dependencies
      const { founders, ventures, evaluations } = await import("@shared/schema");

      // Create founder
      const [founder] = await tx.insert(founders).values(data.founder).returning();

      // Create venture with founder ID  
      const ventureData = { ...data.venture, founderId: founder.founderId };
      const [venture] = await tx.insert(ventures).values(ventureData).returning();

      // Create evaluation if provided
      let evaluation = undefined;
      if (data.evaluation) {
        const evaluationData = { ...data.evaluation, ventureId: venture.ventureId };
        [evaluation] = await tx.insert(evaluations).values(evaluationData).returning();
      }

      // Clear caches after successful transaction
      await this.invalidateRelatedCaches(founder.id, venture.id);

      return { founder, venture, evaluation };
    });
  }

  /**
   * Document upload transaction: Create document record + update venture
   */
  async createDocumentWithVentureUpdate(data: {
    document: any;
    ventureUpdates?: any;
  }): Promise<{
    document: any;
    venture?: any;
  }> {
    return await this.executeTransaction(async (tx) => {
      const { documentUploads, ventures } = await import("@shared/schema");

      // Create document record
      const [document] = await tx.insert(documentUploads).values(data.document).returning();

      // Update venture if needed
      let venture = undefined;
      if (data.ventureUpdates && data.document.ventureId) {
        const { eq } = await import("drizzle-orm");
        [venture] = await tx
          .update(ventures)
          .set({ ...data.ventureUpdates, updatedAt: new Date() })
          .where(eq(ventures.id, data.document.ventureId))
          .returning();
      }

      // Clear relevant caches
      if (data.document.ventureId) {
        await cacheService.invalidateCache?.('venture', data.document.ventureId);
      }

      return { document, venture };
    });
  }

  /**
   * Certificate/Report generation transaction
   */
  async updateVentureWithDocument(
    ventureId: string,
    ventureUpdates: any,
    documentData: any
  ): Promise<{
    venture: any;
    document: any;
  }> {
    return await this.executeTransaction(async (tx) => {
      const { ventures, documentUploads } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Update venture with certificate/report URL
      const [venture] = await tx
        .update(ventures)
        .set({ ...ventureUpdates, updatedAt: new Date() })
        .where(eq(ventures.id, ventureId))
        .returning();

      // Create document record
      const documentRecord = { ...documentData, ventureId };
      const [document] = await tx.insert(documentUploads).values(documentRecord).returning();

      // Clear caches
      await this.invalidateRelatedCaches(venture.founderId, ventureId);

      return { venture, document };
    });
  }

  /**
   * Evaluation update transaction with leaderboard cache refresh
   */
  async updateEvaluationAndRefreshLeaderboard(
    evaluationId: string,
    updates: any
  ): Promise<any> {
    return await this.executeTransaction(async (tx) => {
      const { evaluations } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      // Update evaluation
      const [evaluation] = await tx
        .update(evaluations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(evaluations.id, evaluationId))
        .returning();

      // Clear leaderboard cache since scores changed
      await cacheService.invalidateCache?.('leaderboard', 'global');

      return evaluation;
    });
  }

  /**
   * User authentication setup transaction
   */
  async setupUserAuthentication(
    founderId: string,
    authData: {
      passwordHash: string;
      emailVerified: boolean;
      verificationToken?: string;
      tokenExpiresAt?: Date;
    }
  ): Promise<any> {
    return await this.executeTransaction(async (tx) => {
      const { founders } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const [founder] = await tx
        .update(founders)
        .set({ ...authData, updatedAt: new Date() })
        .where(eq(founders.id, founderId))
        .returning();

      // Clear founder cache
      await cacheService.invalidateCache?.('founder', founderId);

      return founder;
    });
  }

  /**
   * Helper to invalidate related caches after transactions
   */
  private async invalidateRelatedCaches(founderId?: string, ventureId?: string): Promise<void> {
    if (founderId) {
      await cacheService.invalidateCache?.('founder', founderId);
      await cacheService.invalidateCache?.('dashboard', founderId);
    }
    if (ventureId) {
      await cacheService.invalidateCache?.('venture', ventureId);
    }
    // Always refresh leaderboard for data changes
    await cacheService.invalidateCache?.('leaderboard', 'global');
  }
}

export const transactionService = new TransactionService();