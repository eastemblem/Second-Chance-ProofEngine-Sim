import { founder, venture, teamMember, proofVault, type Founder, type InsertFounder, type Venture, type InsertVenture, type TeamMember, type InsertTeamMember, type ProofVault, type InsertProofVault } from "@shared/schema";
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
  
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  getTeamMembersByVentureId(ventureId: string): Promise<TeamMember[]>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, teamMember: Partial<InsertTeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: string): Promise<void>;
  
  getProofVault(id: string): Promise<ProofVault | undefined>;
  getProofVaultsByVentureId(ventureId: string): Promise<ProofVault[]>;
  createProofVault(proofVault: InsertProofVault): Promise<ProofVault>;
  updateProofVault(id: string, proofVault: Partial<InsertProofVault>): Promise<ProofVault>;
  deleteProofVault(id: string): Promise<void>;
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

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const [teamMemberRecord] = await db.select().from(teamMember).where(eq(teamMember.memberId, id));
    return teamMemberRecord;
  }

  async getTeamMembersByVentureId(ventureId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMember).where(eq(teamMember.ventureId, ventureId));
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const [teamMemberRecord] = await db.insert(teamMember).values(insertTeamMember).returning();
    return teamMemberRecord;
  }

  async updateTeamMember(id: string, updateTeamMember: Partial<InsertTeamMember>): Promise<TeamMember> {
    const [teamMemberRecord] = await db
      .update(teamMember)
      .set(updateTeamMember)
      .where(eq(teamMember.memberId, id))
      .returning();
    return teamMemberRecord;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMember).where(eq(teamMember.memberId, id));
  }

  async getProofVault(id: string): Promise<ProofVault | undefined> {
    const [proofVaultRecord] = await db.select().from(proofVault).where(eq(proofVault.vaultId, id));
    return proofVaultRecord;
  }

  async getProofVaultsByVentureId(ventureId: string): Promise<ProofVault[]> {
    return db.select().from(proofVault).where(eq(proofVault.ventureId, ventureId));
  }

  async createProofVault(insertProofVault: InsertProofVault): Promise<ProofVault> {
    const [proofVaultRecord] = await db.insert(proofVault).values(insertProofVault).returning();
    return proofVaultRecord;
  }

  async updateProofVault(id: string, updateProofVault: Partial<InsertProofVault>): Promise<ProofVault> {
    const [proofVaultRecord] = await db
      .update(proofVault)
      .set(updateProofVault)
      .where(eq(proofVault.vaultId, id))
      .returning();
    return proofVaultRecord;
  }

  async deleteProofVault(id: string): Promise<void> {
    await db.delete(proofVault).where(eq(proofVault.vaultId, id));
  }
}

export const storage = new DatabaseStorage();
