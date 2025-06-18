import { founder, venture, type Founder, type InsertFounder, type Venture, type InsertVenture } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getFounder(id: string): Promise<Founder | undefined>;
  getFounderByEmail(email: string): Promise<Founder | undefined>;
  createFounder(founder: InsertFounder): Promise<Founder>;
  updateFounder(id: string, founder: Partial<InsertFounder>): Promise<Founder>;
  
  getVenture(id: string): Promise<Venture | undefined>;
  getVenturesByFounderId(founderId: string): Promise<Venture[]>;
  createVenture(venture: InsertVenture): Promise<Venture>;
  updateVenture(id: string, venture: Partial<InsertVenture>): Promise<Venture>;
}

export class DatabaseStorage implements IStorage {
  async getFounder(id: string): Promise<Founder | undefined> {
    const [founderRecord] = await db.select().from(founder).where(eq(founder.founderId, id));
    return founderRecord;
  }

  async getFounderByEmail(email: string): Promise<Founder | undefined> {
    const [founderRecord] = await db.select().from(founder).where(eq(founder.email, email));
    return founderRecord;
  }

  async createFounder(insertFounder: InsertFounder): Promise<Founder> {
    const [founderRecord] = await db.insert(founder).values(insertFounder).returning();
    return founderRecord;
  }

  async updateFounder(id: string, updateFounder: Partial<InsertFounder>): Promise<Founder> {
    const [founderRecord] = await db
      .update(founder)
      .set({ ...updateFounder, updatedAt: new Date() })
      .where(eq(founder.founderId, id))
      .returning();
    return founderRecord;
  }

  async getVenture(id: string): Promise<Venture | undefined> {
    const [ventureRecord] = await db.select().from(venture).where(eq(venture.ventureId, id));
    return ventureRecord;
  }

  async getVenturesByFounderId(founderId: string): Promise<Venture[]> {
    return await db.select().from(venture).where(eq(venture.founderId, founderId));
  }

  async createVenture(insertVenture: InsertVenture): Promise<Venture> {
    const [ventureRecord] = await db.insert(venture).values(insertVenture).returning();
    return ventureRecord;
  }

  async updateVenture(id: string, updateVenture: Partial<InsertVenture>): Promise<Venture> {
    const [ventureRecord] = await db
      .update(venture)
      .set({ ...updateVenture, updatedAt: new Date() })
      .where(eq(venture.ventureId, id))
      .returning();
    return ventureRecord;
  }
}

export const storage = new DatabaseStorage();
