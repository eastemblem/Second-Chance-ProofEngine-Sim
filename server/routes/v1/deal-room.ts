import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { createSuccessResponse, createErrorResponse } from '../../utils/error-handler';
import { eastEmblemAPI } from '../../eastemblem-api';
import { emailService } from '../../services/emailService';
import { databaseService } from '../../services/database-service';
import { ActivityService } from '../../services/activity-service';
import { appLogger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/v1/investors
 * Fetch all investors from EastEmblem /deal-room endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Fetch from EastEmblem API (client-side caching via React Query)
    appLogger.info('Fetching investors from EastEmblem API');
    const investors = await eastEmblemAPI.getDealRoomInvestors();
    
    appLogger.info(`Successfully fetched ${investors.length} investors`);
    return res.json(createSuccessResponse(investors));
  } catch (error) {
    appLogger.error('Error fetching investors:', error);
    return res.status(500).json(createErrorResponse(
      500,
      'Failed to fetch investors',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
}));

/**
 * POST /api/v1/investors/request-introduction
 * Request introduction to an investor
 */
router.post('/request-introduction', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { investorId, investorDetails } = req.body;
    const founderId = (req as any).user?.founderId;

    if (!investorId) {
      return res.status(400).json(createErrorResponse(400, 'Investor ID is required'));
    }

    if (!investorDetails) {
      return res.status(400).json(createErrorResponse(400, 'Investor details are required'));
    }

    if (!founderId) {
      return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
    }

    // Get founder details
    const founder = await databaseService.getFounderById(founderId);
    if (!founder) {
      return res.status(404).json(createErrorResponse(404, 'Founder not found'));
    }

    // Get venture details (get all ventures and use the first one)
    const ventures = await databaseService.getVenturesByFounderId(founderId);
    if (!ventures || ventures.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'Venture not found'));
    }
    const venture = ventures[0];

    // Use investor details from frontend
    const investor = investorDetails;

    // Extract proof vault URL from folder structure
    let proofVaultUrl = '';
    if (venture.folderStructure) {
      try {
        const folderData = typeof venture.folderStructure === 'string' 
          ? JSON.parse(venture.folderStructure) 
          : venture.folderStructure;
        proofVaultUrl = folderData?.url || `https://app.box.com/folder/${folderData?.id || '0'}`;
      } catch {
        // JSON parse failed - check if it's already a valid URL, otherwise use empty string
        if (typeof venture.folderStructure === 'string' && 
            venture.folderStructure.startsWith('https://')) {
          proofVaultUrl = venture.folderStructure;
        } else {
          proofVaultUrl = '';
        }
      }
    }

    // Create Deal Room Funnel via EastEmblem API (async, non-blocking)
    eastEmblemAPI.createDealRoomFunnel(
      {
        id: founderId,
        name: founder.fullName || founder.email?.split('@')[0] || 'Founder',
        email: founder.email,
        role: founder.positionRole || 'Founder'
      },
      {
        name: venture.name || 'Unnamed Venture',
        industry: venture.industry || 'Not specified',
        geography: venture.geography || 'Not specified',
        growth_stage: venture.growthStage || 'Not specified',
        proof_score: venture.proofScore || 0,
        proof_vault: proofVaultUrl
      },
      {
        id: investor.investorId
      }
    ).then(result => {
      if (result.success) {
        appLogger.api(`Deal Room Funnel created for founder ${founderId} -> investor ${investor.investorId}`);
      } else {
        appLogger.error(`Deal Room Funnel creation failed: ${result.error}`);
      }
    }).catch(error => {
      appLogger.error('Deal Room Funnel creation error (non-blocking):', error);
    });

    // Send introduction request email using template
    const emailSent = await emailService.sendIntroductionRequestEmail(
      founder.fullName,
      founder.email,
      founder.positionRole || 'Founder',
      venture.name,
      venture.industry || 'Not specified',
      venture.geography || 'Not specified',
      venture.growthStage || 'Not specified',
      venture.proofScore || null,
      proofVaultUrl || null,
      investor.investorId,
      investor.stageOfGrowth,
      investor.sector,
      investor.regionGeography,
      investor.investmentTicketDisplay || investor.investmentTicket,
      investor.targetProofScore
    );

    if (!emailSent) {
      appLogger.error('Failed to send introduction request email', {
        founderId,
        investorId,
        ventureName: venture.name
      });
      return res.status(502).json(createErrorResponse(
        502,
        'Failed to send introduction request email',
        'Email service unavailable. Please try again later.'
      ));
    }

    // Log activity
    await ActivityService.logActivity(
      {
        founderId,
        ventureId: venture.ventureId,
      },
      {
        activityType: 'venture',
        action: 'introduction_requested',
        title: `Introduction requested to ${investor.investorId}`,
        description: `Founder requested introduction to investor ${investor.investorId} (${investor.sector})`,
        metadata: {
          investorId: investor.investorId,
          investorStage: investor.stageOfGrowth,
          investorSector: investor.sector,
        },
        entityType: 'investor',
        entityId: investor.investorId,
      }
    );

    appLogger.info(`Introduction request sent for founder ${founderId} to investor ${investorId}`);
    
    return res.json(createSuccessResponse({
      message: 'Introduction request sent successfully',
      investorId,
    }));
  } catch (error) {
    appLogger.error('Error requesting introduction:', error);
    return res.status(500).json(createErrorResponse(
      500,
      'Failed to request introduction',
      error instanceof Error ? error.message : 'Unknown error'
    ));
  }
}));

export default router;
