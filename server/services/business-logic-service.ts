import { z } from "zod";
import { eastEmblemAPI } from "../eastemblem-api";
import { onboardingService } from "./onboarding-service";
import { storage } from "../storage";
import { ActivityService } from "./activity-service";
import { circuitBreakers, retryWithBackoff } from "../middleware/advanced-error-handling";

// Business logic service - separates business rules from API routes
export class BusinessLogicService {
  
  // Founder onboarding business logic
  async processFounderOnboarding(founderData: any, sessionId: string) {
    // Business rule: Validate founder data completeness
    const requiredFields = ['fullName', 'email', 'startupName', 'stage'];
    const missingFields = requiredFields.filter(field => !founderData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Incomplete founder data: missing ${missingFields.join(', ')}`);
    }

    // Business rule: Check for duplicate email addresses
    const existingFounder = await storage.getFounderByEmail(founderData.email);
    if (existingFounder) {
      throw new Error('Founder with this email already exists');
    }

    // Process through onboarding service with circuit breaker
    return await circuitBreakers.database.execute(async () => {
      return await onboardingService.completeFounderStep(founderData, sessionId);
    });
  }

  // File upload business logic
  async processFileUpload(file: any, category: string, founderId: string, sessionId: string, artifactType: string, description: string) {
    // Business rule: Validate file type based on category
    const allowedTypes = this.getAllowedFileTypes(category);
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not allowed for category ${category}`);
    }

    // Business rule: Check file size limits
    const maxSize = this.getMaxFileSize(category);
    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds limit ${maxSize} for category ${category}`);
    }

    // Business rule: Check user storage quota
    const currentUsage = await this.getUserStorageUsage(founderId);
    const quotaLimit = this.getStorageQuota(founderId);
    
    if (currentUsage + file.size > quotaLimit) {
      throw new Error('Storage quota exceeded');
    }

    // Upload with retry logic and circuit breaker
    const uploadResult = await retryWithBackoff(async () => {
      return await circuitBreakers.eastEmblem.execute(async () => {
        const sessionData = await this.getSessionData(sessionId);
        const folderId = this.getCategoryFolderId(category, sessionData);
        
        return await eastEmblemAPI.uploadFile(file.path, file.originalname, folderId);
      });
    });

    // Business rule: Create database record after successful Box upload
    if (uploadResult && uploadResult.id) {
      const sessionData = await this.getSessionData(sessionId);
      const ventureId = await this.getVentureIdFromFounder(founderId);
      
      const documentData = {
        sessionId: sessionData.sessionId || sessionId,
        ventureId,
        fileName: file.originalname,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: 'completed',
        processingStatus: 'completed',
        eastemblemFileId: uploadResult.id,
        sharedUrl: uploadResult.url || uploadResult.shared_url,
        folderId: this.getCategoryFolderId(category, sessionData),
        description,
        artifactType,
        categoryId: category,
        scoreAwarded: 0,
      };

      const databaseRecord = await storage.createDocumentUpload(documentData);
      
      return {
        ...uploadResult,
        databaseId: databaseRecord.uploadId,
        folderId: documentData.folderId
      };
    }

    return uploadResult;
  }

  // ProofScore calculation business logic
  async calculateProofScore(ventureId: string, pitchDeckData?: any) {
    // Business rule: Ensure venture exists and is complete
    const venture = await storage.getVenture(ventureId);
    if (!venture) {
      throw new Error('Venture not found');
    }

    // Business rule: Check if venture has minimum required data
    if (!this.hasMinimumVentureData(venture)) {
      throw new Error('Venture data incomplete for scoring');
    }

    // Business rule: Prevent duplicate scoring within 24 hours
    const recentEvaluation = await this.getRecentEvaluation(ventureId, 24 * 60 * 60 * 1000);
    if (recentEvaluation) {
      return {
        proofScore: recentEvaluation.proofscore,
        evaluationId: recentEvaluation.evaluationId,
        cached: true
      };
    }

    // Calculate score with external API
    return await circuitBreakers.eastEmblem.execute(async () => {
      // TODO: Implement proofScore calculation when API is ready
      const scoreData = { proofScore: 75 }; // Placeholder
      
      // Business rule: Store evaluation in database
      const evaluation = await storage.createEvaluation({
        ventureId,
        proofscore: scoreData.proofScore,
        evaluationDate: new Date(),
        dimensionScores: {},
        prooftags: [],
        fullApiResponse: scoreData
      });

      return {
        proofScore: scoreData.proofScore,
        evaluationId: evaluation.evaluationId,
        cached: false
      };
    });
  }

  // Vault management business logic
  async processVaultAccess(founderId: string, action: string) {
    // Business rule: Check user permissions
    const permissions = await this.getUserPermissions(founderId);
    if (!permissions.canAccessVault) {
      throw new Error('Vault access not permitted');
    }

    // Business rule: Track vault access for audit
    await ActivityService.logActivity(
      { founderId, sessionId: 'vault-access', ipAddress: 'system', userAgent: 'system' },
      {
        activityType: 'system',
        action,
        title: `Vault ${action}`,
        description: `User accessed vault: ${action}`
      }
    );

    return { accessGranted: true, timestamp: new Date().toISOString() };
  }

  // Certificate generation business logic
  async generateCertificate(founderId: string, evaluationId: string) {
    // Business rule: Validate evaluation exists and belongs to founder
    const evaluation = await this.validateEvaluationOwnership(founderId, evaluationId);
    
    // Business rule: Check if ProofScore meets certificate threshold
    const minimumScore = 60; // Business rule: minimum score for certificate
    if (evaluation.proofscore < minimumScore) {
      throw new Error(`ProofScore ${evaluation.proofscore} below certificate threshold ${minimumScore}`);
    }

    // Business rule: Prevent duplicate certificate generation
    const existingCertificate = await this.getExistingCertificate(evaluationId);
    if (existingCertificate) {
      return existingCertificate;
    }

    // TODO: Implement certificate generation when API is ready
    return {
      certificateId: `cert_${Date.now()}`,
      certificateUrl: '#',
      duplicate: false
    };
  }

  // Helper methods for business rules
  private getAllowedFileTypes(category: string): string[] {
    const typeMap: Record<string, string[]> = {
      '0_Overview': ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      '1_Problem_Proof': ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
      '2_Solution_Proof': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
      '3_Demand_Proof': ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
      '4_Credibility_Proof': ['application/pdf', 'image/jpeg', 'image/png', 'image/svg+xml'],
      '5_Commercial_Proof': ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '6_Investor_Pack': ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    };
    
    return typeMap[category] || typeMap['0_Overview'];
  }

  private getMaxFileSize(category: string): number {
    // Business rule: Different categories have different size limits
    const sizeMap: Record<string, number> = {
      '0_Overview': 10 * 1024 * 1024, // 10MB
      '1_Problem_Proof': 5 * 1024 * 1024, // 5MB
      '2_Solution_Proof': 10 * 1024 * 1024, // 10MB
      '3_Demand_Proof': 5 * 1024 * 1024, // 5MB
      '4_Credibility_Proof': 5 * 1024 * 1024, // 5MB
      '5_Commercial_Proof': 15 * 1024 * 1024, // 15MB
      '6_Investor_Pack': 20 * 1024 * 1024 // 20MB
    };
    
    return sizeMap[category] || 10 * 1024 * 1024;
  }

  private async getUserStorageUsage(founderId: string): Promise<number> {
    // Business rule: Calculate total storage used by founder
    const ventures = await storage.getVenturesByFounderId(founderId);
    let totalSize = 0;
    for (const venture of ventures) {
      const documents = await storage.getDocumentUploadsByVentureId(venture.ventureId);
      totalSize += documents.reduce((total: number, doc: any) => total + (doc.fileSize || 0), 0);
    }
    return totalSize;
  }

  private getStorageQuota(founderId: string): number {
    // Business rule: Generous storage quota for folder uploads
    return 500 * 1024 * 1024; // 500MB default quota (supports large folder uploads)
  }

  private hasMinimumVentureData(venture: any): boolean {
    // Business rule: Check if venture has required fields for scoring
    const requiredFields = ['name', 'stage', 'industry'];
    return requiredFields.every(field => venture[field]);
  }

  private async getRecentEvaluation(ventureId: string, timeWindow: number) {
    // Business rule: Check for recent evaluations within time window
    const cutoffTime = new Date(Date.now() - timeWindow);
    const evaluations = await storage.getEvaluationsByVentureId(ventureId);
    
    return evaluations.find(evaluation => 
      evaluation.createdAt && evaluation.createdAt > cutoffTime
    );
  }

  private async getUserPermissions(founderId: string) {
    // Business rule: Define user permissions (extensible for role-based access)
    const founder = await storage.getFounder(founderId);
    
    return {
      canAccessVault: !!founder,
      canUploadFiles: !!founder,
      canGenerateCertificate: !!founder,
      canDownloadReports: !!founder
    };
  }

  private async validateEvaluationOwnership(founderId: string, evaluationId: string) {
    // Business rule: Ensure founder owns the evaluation
    const evaluation = await storage.getEvaluation(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    const venture = await storage.getVenture(evaluation.ventureId);
    if (!venture || venture.founderId !== founderId) {
      throw new Error('Evaluation access denied');
    }

    return evaluation;
  }

  private async getExistingCertificate(evaluationId: string) {
    // Business rule: Check for existing certificates  
    // TODO: Implement certificate lookup when certificate table exists
    return null;
  }

  private getCategoryFolderId(category: string, sessionData: any): string {
    // Business logic: Map category to folder ID from session
    const folderStructure = sessionData.folderStructure;
    if (!folderStructure?.subfolders) {
      throw new Error('Folder structure not found');
    }

    const categoryMapping: Record<string, string> = {
      '0_Overview': 'Overview',
      '1_Problem_Proof': 'Problem Proofs',
      '2_Solution_Proof': 'Solution Proofs',
      '3_Demand_Proof': 'Demand Proofs',
      '4_Credibility_Proof': 'Credibility Proofs',
      '5_Commercial_Proof': 'Commercial Proofs',
      '6_Investor_Pack': 'Investor Pack'
    };

    const targetFolderName = categoryMapping[category];
    const folder = folderStructure.subfolders.find((f: any) => f.name === targetFolderName);
    
    if (!folder) {
      throw new Error(`Folder not found for category: ${category}`);
    }

    return folder.id;
  }

  private async getVentureIdFromFounder(founderId: string): Promise<string> {
    // Business rule: Get the founder's latest venture ID
    const ventures = await storage.getVenturesByFounderId(founderId);
    if (ventures.length === 0) {
      throw new Error('No venture found for founder');
    }
    
    // Return the most recent venture ID
    return ventures[0].ventureId;
  }

  private async getSessionData(sessionId: string) {
    // Import session management utility
    const { getSessionData } = await import("../utils/session-manager");
    return await getSessionData(sessionId);
  }
}

export const businessLogicService = new BusinessLogicService();