import { eq, desc } from "drizzle-orm";
import { founder, venture, type Founder, type InsertFounder } from "@shared/schema";
import { BaseRepository } from "./base-repository";

export class FounderRepository extends BaseRepository {
  /**
   * Get founder by ID with caching
   */
  async getById(id: string): Promise<Founder | undefined> {
    return await this.executeWithCache('founder', id, async () => {
      const [founderRecord] = await this.db.select().from(founder).where(eq(founder.founderId, id));
      return founderRecord;
    });
  }

  /**
   * Get founder by email
   */
  async getByEmail(email: string): Promise<Founder | undefined> {
    return await this.executeQuery(async () => {
      const [founderRecord] = await this.db.select().from(founder).where(eq(founder.email, email));
      return founderRecord;
    });
  }

  /**
   * Create new founder
   */
  async create(founderData: InsertFounder): Promise<Founder> {
    return await this.executeQuery(async () => {
      const [founderRecord] = await this.db.insert(founder).values(founderData).returning();
      return founderRecord;
    });
  }

  /**
   * Update founder
   */
  async update(id: string, updates: Partial<InsertFounder>): Promise<Founder | undefined> {
    const result = await this.executeQuery(async () => {
      const [founderRecord] = await this.db
        .update(founder)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(founder.founderId, id))
        .returning();
      return founderRecord;
    });

    if (result) {
      await this.invalidateCache('founder', id);
    }
    return result;
  }

  /**
   * Get founder with their latest venture (optimized for dashboard)
   */
  async getWithLatestVenture(founderId: string): Promise<any> {
    return await this.executeWithCache('dashboard', founderId, async () => {
      const result = await this.db
        .select({
          founder: founder,
          venture: venture
        })
        .from(founder)
        .leftJoin(venture, eq(venture.founderId, founder.founderId))
        .where(eq(founder.founderId, founderId))
        .orderBy(desc(venture.createdAt))
        .limit(1);

      if (result.length === 0) return null;

      return {
        ...result[0].founder,
        latestVenture: result[0].venture
      };
    });
  }

  /**
   * Update authentication fields
   */
  async updateAuth(id: string, authData: {
    passwordHash?: string;
    emailVerified?: boolean;
    verificationToken?: string;
    tokenExpiresAt?: Date;
    lastLoginAt?: Date;
  }): Promise<Founder | undefined> {
    return await this.update(id, authData);
  }

  /**
   * Set verification token
   */
  async setVerificationToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await this.executeQuery(async () => {
      await this.db
        .update(founder)
        .set({
          verificationToken: token,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(founder.founderId, id));
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<Founder | undefined> {
    return await this.executeQuery(async () => {
      const [founderRecord] = await this.db
        .update(founder)
        .set({
          emailVerified: true,
          verificationToken: null,
          tokenExpiresAt: null,
          updatedAt: new Date()
        })
        .where(eq(founder.verificationToken, token))
        .returning();
      return founderRecord;
    });
  }
}