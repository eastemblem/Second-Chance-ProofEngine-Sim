import { users, ventures, type User, type InsertUser, type Venture, type InsertVenture } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  getVenture(id: number): Promise<Venture | undefined>;
  getVenturesByUserId(userId: number): Promise<Venture[]>;
  createVenture(venture: InsertVenture): Promise<Venture>;
  updateVenture(id: number, venture: Partial<InsertVenture>): Promise<Venture>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getVenture(id: number): Promise<Venture | undefined> {
    const [venture] = await db.select().from(ventures).where(eq(ventures.id, id));
    return venture || undefined;
  }

  async getVenturesByUserId(userId: number): Promise<Venture[]> {
    return await db.select().from(ventures).where(eq(ventures.ownerId, userId));
  }

  async createVenture(insertVenture: InsertVenture): Promise<Venture> {
    const [venture] = await db
      .insert(ventures)
      .values(insertVenture)
      .returning();
    return venture;
  }

  async updateVenture(id: number, updateVenture: Partial<InsertVenture>): Promise<Venture> {
    const [venture] = await db
      .update(ventures)
      .set({ ...updateVenture, updatedAt: new Date() })
      .where(eq(ventures.id, id))
      .returning();
    return venture;
  }
}

export const storage = new DatabaseStorage();
