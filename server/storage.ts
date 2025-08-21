import { founder, venture, teamMember, proofVault, leaderboard, evaluation, documentUpload, userActivity, paymentTransactions, userSubscriptions, paymentLogs, type Founder, type InsertFounder, type Venture, type InsertVenture, type TeamMember, type InsertTeamMember, type ProofVault, type InsertProofVault, type Leaderboard, type InsertLeaderboard, type Evaluation, type InsertEvaluation, type DocumentUpload, type InsertDocumentUpload, type UserActivity, type InsertUserActivity, type PaymentTransaction, type InsertPaymentTransaction, type UserSubscription, type InsertUserSubscription, type PaymentLog, type InsertPaymentLog } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getFounder(id: string): Promise<Founder | undefined>;
  getFounderByEmail(email: string): Promise<Founder | undefined>;
  createFounder(founder: InsertFounder): Promise<Founder>;
  updateFounder(id: string, founder: Partial<InsertFounder>): Promise<Founder>;
  
  getVenture(id: string): Promise<Venture | undefined>;
  getVenturesByFounderId(founderId: string): Promise<Venture[]>;
  getFounderVentures(founderId: string): Promise<Venture[]>;
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
  
  // Evaluation methods
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  getEvaluationsByVentureId(ventureId: string): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation>;
  deleteEvaluation(id: string): Promise<void>;
  
  // Leaderboard methods
  getLeaderboard(limit?: number): Promise<Leaderboard[]>;
  createLeaderboardEntry(entry: InsertLeaderboard): Promise<Leaderboard>;
  getLeaderboardByVentureId(ventureId: string): Promise<Leaderboard | undefined>;
  updateLeaderboard(id: string, entry: Partial<InsertLeaderboard>): Promise<Leaderboard>;
  
  // Document Upload methods
  getDocumentUpload(id: string): Promise<DocumentUpload | undefined>;
  getDocumentUploadsByVentureId(ventureId: string): Promise<DocumentUpload[]>;
  getPaginatedDocumentUploads(ventureId: string, limit: number, offset: number): Promise<DocumentUpload[]>;
  getDocumentUploadCountByVenture(ventureId: string): Promise<number>;
  createDocumentUpload(document: InsertDocumentUpload): Promise<DocumentUpload>;
  updateDocumentUpload(id: string, document: Partial<InsertDocumentUpload>): Promise<DocumentUpload>;
  deleteDocumentUpload(id: string): Promise<void>;
  
  // User Activity methods
  getUserActivity(id: string): Promise<UserActivity | undefined>;
  getUserActivities(founderId: string, limit?: number, activityType?: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  deleteUserActivity(id: string): Promise<void>;

  // Payment Transaction methods
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  getPaymentTransactionByOrderRef(orderRef: string): Promise<PaymentTransaction | undefined>;
  getPaymentTransactions(founderId: string): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: string, transaction: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction>;
  cancelPaymentTransaction(orderRef: string, founderId: string): Promise<{ success: boolean }>;

  // User Subscription methods
  getUserSubscription(id: string): Promise<UserSubscription | undefined>;
  getUserSubscriptions(founderId: string): Promise<UserSubscription[]>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription>;

  // Payment Log methods
  getPaymentLog(id: string): Promise<PaymentLog | undefined>;
  getPaymentLogs(transactionId: string): Promise<PaymentLog[]>;
  createPaymentLog(log: InsertPaymentLog): Promise<PaymentLog>;
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

  async getFounderVentures(founderId: string): Promise<Venture[]> {
    return await db.select().from(venture)
      .where(eq(venture.founderId, founderId))
      .orderBy(desc(venture.createdAt));
  }

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



  // Evaluation methods
  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    const [evaluationRecord] = await db.select().from(evaluation).where(eq(evaluation.evaluationId, id));
    return evaluationRecord;
  }

  async getEvaluationsByVentureId(ventureId: string): Promise<Evaluation[]> {
    return db.select().from(evaluation).where(eq(evaluation.ventureId, ventureId)).orderBy(desc(evaluation.evaluationDate));
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const [evaluationRecord] = await db.insert(evaluation).values(insertEvaluation).returning();
    return evaluationRecord;
  }

  async updateEvaluation(id: string, updateEvaluation: Partial<InsertEvaluation>): Promise<Evaluation> {
    const [evaluationRecord] = await db.update(evaluation).set(updateEvaluation).where(eq(evaluation.evaluationId, id)).returning();
    return evaluationRecord;
  }

  async deleteEvaluation(id: string): Promise<void> {
    await db.delete(evaluation).where(eq(evaluation.evaluationId, id));
  }

  async getLatestEvaluationByVentureId(ventureId: string): Promise<Evaluation | undefined> {
    const [evaluationRecord] = await db
      .select()
      .from(evaluation)
      .where(eq(evaluation.ventureId, ventureId))
      .orderBy(desc(evaluation.evaluationDate))
      .limit(1);
    return evaluationRecord;
  }

  // Document Upload methods
  async getDocumentUpload(id: string): Promise<DocumentUpload | undefined> {
    const [documentRecord] = await db.select().from(documentUpload).where(eq(documentUpload.uploadId, id));
    return documentRecord;
  }

  async getDocumentUploadsByVentureId(ventureId: string): Promise<DocumentUpload[]> {
    return db.select()
      .from(documentUpload)
      .where(eq(documentUpload.ventureId, ventureId))
      .orderBy(desc(documentUpload.createdAt));
  }

  async getPaginatedDocumentUploads(ventureId: string, limit: number, offset: number): Promise<DocumentUpload[]> {
    return db.select()
      .from(documentUpload)
      .where(eq(documentUpload.ventureId, ventureId))
      .orderBy(desc(documentUpload.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDocumentUploadCountByVenture(ventureId: string): Promise<number> {
    const result = await db.select({ count: documentUpload.uploadId })
      .from(documentUpload)
      .where(eq(documentUpload.ventureId, ventureId));
    return result.length;
  }

  async createDocumentUpload(insertDocument: InsertDocumentUpload): Promise<DocumentUpload> {
    const [documentRecord] = await db.insert(documentUpload).values(insertDocument).returning();
    return documentRecord;
  }

  async updateDocumentUpload(id: string, updateDocument: Partial<InsertDocumentUpload>): Promise<DocumentUpload> {
    const [documentRecord] = await db.update(documentUpload).set(updateDocument).where(eq(documentUpload.uploadId, id)).returning();
    return documentRecord;
  }

  async deleteDocumentUpload(id: string): Promise<void> {
    await db.delete(documentUpload).where(eq(documentUpload.uploadId, id));
  }

  // Leaderboard methods
  async getLeaderboard(limit: number = 10): Promise<Leaderboard[]> {
    return db.select().from(leaderboard).orderBy(desc(leaderboard.totalScore)).limit(limit);
  }

  async createLeaderboardEntry(insertLeaderboard: InsertLeaderboard): Promise<Leaderboard> {
    const [leaderboardRecord] = await db.insert(leaderboard).values(insertLeaderboard).returning();
    return leaderboardRecord;
  }

  async getLeaderboardByVentureId(ventureId: string): Promise<Leaderboard | undefined> {
    const [leaderboardRecord] = await db.select().from(leaderboard).where(eq(leaderboard.ventureId, ventureId));
    return leaderboardRecord;
  }

  async updateLeaderboard(id: string, updateEntry: Partial<InsertLeaderboard>): Promise<Leaderboard> {
    const [leaderboardRecord] = await db.update(leaderboard).set(updateEntry).where(eq(leaderboard.leaderboardId, id)).returning();
    return leaderboardRecord;
  }

  // User Activity methods
  async getUserActivity(id: string): Promise<UserActivity | undefined> {
    const [activityRecord] = await db.select().from(userActivity).where(eq(userActivity.activityId, id));
    return activityRecord;
  }

  async getUserActivities(founderId: string, limit: number = 10, activityType?: string): Promise<UserActivity[]> {
    if (activityType) {
      return db.select()
        .from(userActivity)
        .where(and(
          eq(userActivity.founderId, founderId),
          eq(userActivity.activityType, activityType as any)
        ))
        .orderBy(desc(userActivity.createdAt))
        .limit(limit);
    }
    
    return db.select()
      .from(userActivity)
      .where(eq(userActivity.founderId, founderId))
      .orderBy(desc(userActivity.createdAt))
      .limit(limit);
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const [activityRecord] = await db.insert(userActivity).values(insertActivity).returning();
    return activityRecord;
  }

  async deleteUserActivity(id: string): Promise<void> {
    await db.delete(userActivity).where(eq(userActivity.activityId, id));
  }

  // Payment Transaction methods
  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const [transactionRecord] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return transactionRecord;
  }

  async getPaymentTransactionByOrderRef(orderRef: string): Promise<PaymentTransaction | undefined> {
    const [transactionRecord] = await db.select().from(paymentTransactions).where(eq(paymentTransactions.orderReference, orderRef));
    return transactionRecord;
  }

  async getPaymentTransactions(founderId: string): Promise<PaymentTransaction[]> {
    return db.select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.founderId, founderId))
      .orderBy(desc(paymentTransactions.createdAt));
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [transactionRecord] = await db.insert(paymentTransactions).values(transaction).returning();
    return transactionRecord;
  }

  async updatePaymentTransaction(id: string, transaction: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction> {
    const [transactionRecord] = await db.update(paymentTransactions).set({
      ...transaction,
      updatedAt: new Date()
    }).where(eq(paymentTransactions.id, id)).returning();
    return transactionRecord;
  }

  async cancelPaymentTransaction(orderRef: string, founderId: string): Promise<{ success: boolean }> {
    try {
      const updateResult = await db.update(paymentTransactions)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(and(
          eq(paymentTransactions.orderReference, orderRef),
          eq(paymentTransactions.founderId, founderId)
        ))
        .returning();

      return { success: updateResult.length > 0 };
    } catch (error) {
      console.error('Failed to cancel payment transaction:', error);
      return { success: false };
    }
  }

  // User Subscription methods
  async getUserSubscription(id: string): Promise<UserSubscription | undefined> {
    const [subscriptionRecord] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id));
    return subscriptionRecord;
  }

  async getUserSubscriptions(founderId: string): Promise<UserSubscription[]> {
    return db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.founderId, founderId))
      .orderBy(desc(userSubscriptions.createdAt));
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [subscriptionRecord] = await db.insert(userSubscriptions).values(subscription).returning();
    return subscriptionRecord;
  }

  async updateUserSubscription(id: string, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [subscriptionRecord] = await db.update(userSubscriptions).set({
      ...subscription,
      updatedAt: new Date()
    }).where(eq(userSubscriptions.id, id)).returning();
    return subscriptionRecord;
  }

  // Payment Log methods
  async getPaymentLog(id: string): Promise<PaymentLog | undefined> {
    const [logRecord] = await db.select().from(paymentLogs).where(eq(paymentLogs.id, id));
    return logRecord;
  }

  async getPaymentLogs(transactionId: string): Promise<PaymentLog[]> {
    return db.select()
      .from(paymentLogs)
      .where(eq(paymentLogs.transactionId, transactionId))
      .orderBy(desc(paymentLogs.createdAt));
  }

  async createPaymentLog(log: InsertPaymentLog): Promise<PaymentLog> {
    const [logRecord] = await db.insert(paymentLogs).values(log).returning();
    return logRecord;
  }
}

export const storage = new DatabaseStorage();
