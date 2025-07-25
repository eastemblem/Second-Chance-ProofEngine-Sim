import { Request } from 'express';
import { storage } from '../storage';
import { InsertUserActivity, UserActivity } from '@shared/schema';
import { appLogger } from "../utils/logger";

export interface ActivityContext {
  founderId?: string;
  ventureId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  
  /**
   * Extract activity context from Express request
   */
  static getContextFromRequest(req: Request): ActivityContext {
    return {
      founderId: req.session?.founderId,
      sessionId: req.sessionID,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }

  /**
   * Log a user activity
   */
  static async logActivity(
    context: ActivityContext,
    activity: {
      activityType: 'account' | 'venture' | 'document' | 'evaluation' | 'authentication' | 'navigation' | 'system';
      action: string;
      title: string;
      description?: string;
      metadata?: any;
      entityId?: string;
      entityType?: string;
    }
  ): Promise<UserActivity | null> {
    try {
      const activityData: InsertUserActivity = {
        founderId: context.founderId || null,
        ventureId: context.ventureId || null,
        sessionId: context.sessionId || null,
        activityType: activity.activityType,
        action: activity.action,
        title: activity.title,
        description: activity.description || null,
        metadata: activity.metadata || null,
        entityId: activity.entityId || null,
        entityType: activity.entityType || null,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
      };

      const createdActivity = await storage.createUserActivity(activityData);
      appLogger.business(`Activity logged: ${activity.action} - ${activity.title}`);
      return createdActivity;
    } catch (error) {
      appLogger.business('Failed to log activity:', error);
      return null;
    }
  }

  /**
   * Log account-related activities
   */
  static async logAccountActivity(
    context: ActivityContext,
    action: 'signup' | 'email_verify' | 'profile_update',
    title: string,
    description?: string,
    metadata?: any
  ) {
    return this.logActivity(context, {
      activityType: 'account',
      action,
      title,
      description,
      metadata
    });
  }

  /**
   * Log authentication activities
   */
  static async logAuthActivity(
    context: ActivityContext,
    action: 'login' | 'logout' | 'password_reset' | 'password_change',
    title: string,
    description?: string,
    metadata?: any
  ) {
    return this.logActivity(context, {
      activityType: 'authentication',
      action,
      title,
      description,
      metadata
    });
  }

  /**
   * Log venture-related activities
   */
  static async logVentureActivity(
    context: ActivityContext,
    action: 'create' | 'update' | 'complete',
    title: string,
    ventureId: string,
    description?: string,
    metadata?: any
  ) {
    return this.logActivity({...context, ventureId}, {
      activityType: 'venture',
      action,
      title,
      description,
      metadata,
      entityId: ventureId,
      entityType: 'venture'
    });
  }

  /**
   * Log document-related activities
   */
  static async logDocumentActivity(
    context: ActivityContext,
    action: 'upload' | 'download' | 'delete' | 'generate',
    title: string,
    documentId: string,
    fileName: string,
    folderName?: string,
    metadata?: any
  ) {
    return this.logActivity(context, {
      activityType: 'document',
      action,
      title,
      description: folderName ? `File: ${fileName} in ${folderName}` : `File: ${fileName}`,
      metadata: {
        fileName,
        folderName,
        ...metadata
      },
      entityId: documentId,
      entityType: 'document'
    });
  }

  /**
   * Log evaluation/scoring activities
   */
  static async logEvaluationActivity(
    context: ActivityContext,
    action: 'score_generate' | 'score_update' | 'analysis_complete',
    title: string,
    evaluationId: string,
    score?: number,
    metadata?: any
  ) {
    return this.logActivity(context, {
      activityType: 'evaluation',
      action,
      title,
      description: score ? `ProofScore: ${score}/100` : undefined,
      metadata: {
        score,
        ...metadata
      },
      entityId: evaluationId,
      entityType: 'evaluation'
    });
  }

  /**
   * Log navigation activities (for analytics)
   */
  static async logNavigationActivity(
    context: ActivityContext,
    action: 'page_visit' | 'feature_use' | 'button_click',
    title: string,
    page?: string,
    metadata?: any
  ) {
    return this.logActivity(context, {
      activityType: 'navigation',
      action,
      title,
      description: page,
      metadata
    });
  }

  /**
   * Log system activities
   */
  static async logSystemActivity(
    context: ActivityContext,
    action: 'notification_sent' | 'email_sent' | 'report_generated',
    title: string,
    description?: string,
    metadata?: any
  ) {
    return this.logActivity(context, {
      activityType: 'system',
      action,
      title,
      description,
      metadata
    });
  }

  /**
   * Get recent activities for a founder
   */
  static async getRecentActivities(
    founderId: string,
    limit: number = 10,
    activityType?: string
  ): Promise<UserActivity[]> {
    try {
      return await storage.getUserActivities(founderId, limit, activityType);
    } catch (error) {
      appLogger.business('Failed to get recent activities:', error);
      return [];
    }
  }

  /**
   * Bulk migrate existing data to activity log
   */
  static async migrateExistingData(founderId: string): Promise<void> {
    try {
      // Get founder data
      const founder = await storage.getFounder(founderId);
      if (!founder) return;

      const baseContext: ActivityContext = {
        founderId,
        sessionId: 'migration',
        ipAddress: '127.0.0.1',
        userAgent: 'System Migration'
      };

      // Migrate account creation
      await this.logActivity(baseContext, {
        activityType: 'account',
        action: 'signup',
        title: 'Joined Second Chance platform',
        description: 'Welcome to the startup validation ecosystem'
      });

      // Migrate email verification
      if (founder.emailVerified) {
        await this.logActivity(baseContext, {
          activityType: 'account',
          action: 'email_verify',
          title: 'Email verified successfully',
          description: 'Your email has been verified and account is active'
        });
      }

      // Migrate venture activities
      const ventures = await storage.getVenturesByFounderId(founderId);
      for (const venture of ventures) {
        await this.logVentureActivity(
          baseContext,
          'create',
          `Venture "${venture.name}" created`,
          venture.ventureId,
          `${venture.industry} startup in ${venture.geography}`
        );

        // Migrate evaluations
        const evaluations = await storage.getEvaluationsByVentureId(venture.ventureId);
        for (const evaluation of evaluations) {
          await this.logEvaluationActivity(
            {...baseContext, ventureId: venture.ventureId},
            'score_generate',
            'ProofScore established',
            evaluation.evaluationId,
            evaluation.proofscore,
            { initialScore: true }
          );
        }

        // Migrate document uploads
        const documents = await storage.getDocumentUploadsByVentureId(venture.ventureId);
        for (const doc of documents) {
          await this.logDocumentActivity(
            {...baseContext, ventureId: venture.ventureId},
            'upload',
            doc.originalName,
            doc.uploadId,
            doc.originalName,
            doc.folderId || 'Unknown folder'
          );
        }
      }

      appLogger.business(`Migration completed for founder ${founderId}`);
    } catch (error) {
      appLogger.business('Migration failed:', error);
    }
  }
}