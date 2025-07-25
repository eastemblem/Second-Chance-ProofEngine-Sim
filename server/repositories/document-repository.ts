import { eq, and, desc } from "drizzle-orm";
import { documentUpload, type DocumentUpload, type InsertDocumentUpload } from "@shared/schema";
import { BaseRepository } from "./base-repository";

export class DocumentRepository extends BaseRepository {
  /**
   * Get document by ID
   */
  async getById(id: string): Promise<DocumentUpload | undefined> {
    return await this.executeQuery(async () => {
      const [document] = await this.db.select().from(documentUpload).where(eq(documentUpload.uploadId, id));
      return document;
    });
  }

  /**
   * Get documents by venture ID
   */
  async getByVentureId(ventureId: string): Promise<DocumentUpload[]> {
    return await this.executeQuery(async () => {
      return await this.db
        .select()
        .from(documentUpload)
        .where(eq(documentUpload.ventureId, ventureId))
        .orderBy(desc(documentUpload.createdAt));
    });
  }

  /**
   * Get documents by type and venture
   */
  async getByTypeAndVenture(ventureId: string, documentType: string): Promise<DocumentUpload[]> {
    return await this.executeQuery(async () => {
      return await this.db
        .select()
        .from(documentUpload)
        .where(and(
          eq(documentUpload.ventureId, ventureId),
          eq(documentUpload.mimeType, documentType)
        ))
        .orderBy(desc(documentUpload.createdAt));
    });
  }

  /**
   * Create new document upload record
   */
  async create(documentData: InsertDocumentUpload): Promise<DocumentUpload> {
    return await this.executeQuery(async () => {
      const [document] = await this.db.insert(documentUpload).values(documentData).returning();
      
      // Invalidate venture cache since it has new documents
      if (document.ventureId) {
        await this.invalidateCache('venture', document.ventureId);
      }
      
      return document;
    });
  }

  /**
   * Update document upload record
   */
  async update(id: string, updates: Partial<InsertDocumentUpload>): Promise<DocumentUpload | undefined> {
    const result = await this.executeQuery(async () => {
      const [document] = await this.db
        .update(documentUpload)
        .set(updates)
        .where(eq(documentUpload.uploadId, id))
        .returning();
      return document;
    });

    if (result?.ventureId) {
      await this.invalidateCache('venture', result.ventureId);
    }
    return result;
  }

  /**
   * Update document status
   */
  async updateStatus(id: string, status: string): Promise<void> {
    await this.update(id, { status });
  }

  /**
   * Get ProofVault document counts by folder (for dashboard)
   */
  async getProofVaultCounts(ventureId: string): Promise<Record<string, number>> {
    return await this.executeQuery(async () => {
      const documents = await this.db
        .select()
        .from(documentUploads)
        .where(eq(documentUploads.ventureId, ventureId));

      // Count documents by extracting folder from shared_url
      const folderCounts: Record<string, number> = {
        '0_Overview': 0,
        '1_Problem_Proof': 0,
        '2_Solution_Proof': 0,
        '3_Demand_Proof': 0,
        '4_Credibility_Proof': 0,
        '5_Commercial_Proof': 0,
        '6_Investor_Pack': 0
      };

      documents.forEach(doc => {
        // Extract folder info from shared_url or folderId
        if (doc.sharedUrl) {
          // Simple mapping based on URL patterns or folder IDs
          // This would need proper implementation based on Box.com URL structure
          Object.keys(folderCounts).forEach(folder => {
            if (doc.sharedUrl?.includes(folder) || doc.folderId?.includes(folder)) {
              folderCounts[folder]++;
            }
          });
        }
      });

      return folderCounts;
    });
  }

  /**
   * Get latest documents by type (for certificates, reports)
   */
  async getLatestByType(ventureId: string, documentType: string): Promise<DocumentUpload | undefined> {
    return await this.executeQuery(async () => {
      const [document] = await this.db
        .select()
        .from(documentUploads)
        .where(and(
          eq(documentUploads.ventureId, ventureId),
          eq(documentUploads.documentType, documentType)
        ))
        .orderBy(desc(documentUploads.uploadedAt))
        .limit(1);
      return document;
    });
  }

  /**
   * Delete document record
   */
  async delete(id: string): Promise<boolean> {
    return await this.executeQuery(async () => {
      const result = await this.db.delete(documentUploads).where(eq(documentUploads.id, id));
      return result.rowCount > 0;
    });
  }
}