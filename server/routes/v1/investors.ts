import { Router } from 'express';
import { asyncHandler } from '../middleware/error';
import { createSuccessResponse, createErrorResponse } from '../../utils/error-handler';
import { eastEmblemAPI } from '../../eastemblem-api';
import { emailService } from '../../services/emailService';
import { databaseService } from '../../services/database-service';
import { ActivityService } from '../../services/activity-service';
import { appLogger } from '../../utils/logger';
import { lruCacheService } from '../../services/lru-cache-service';

const router = Router();

/**
 * GET /api/v1/investors
 * Fetch all investors from EastEmblem /deal-room endpoint
 */
router.get('/', asyncHandler(async (req, res) => {
  try {
    // Check cache first
    const cacheKey = 'deal_room_investors_all';
    const cached = await lruCacheService.get(cacheKey);
    
    if (cached) {
      appLogger.info('Returning cached investors list');
      return res.json(createSuccessResponse(cached));
    }

    // Fetch from EastEmblem API
    appLogger.info('Fetching investors from EastEmblem API');
    const investors = await eastEmblemAPI.getDealRoomInvestors();
    
    // Cache for 15 minutes
    await lruCacheService.set(cacheKey, investors, 15 * 60 * 1000);
    
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
router.post('/request-introduction', asyncHandler(async (req, res) => {
  try {
    const { investorId, investorDetails } = req.body;
    const founderId = (req as any).user?.founderId;

    if (!investorId) {
      return res.status(400).json(createErrorResponse(400, 'Investor ID is required'));
    }

    if (!founderId) {
      return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
    }

    // Get founder details
    const founder = await databaseService.getFounderById(founderId);
    if (!founder) {
      return res.status(404).json(createErrorResponse(404, 'Founder not found'));
    }

    // Get venture details
    const venture = await databaseService.getVentureByFounderId(founderId);
    if (!venture) {
      return res.status(404).json(createErrorResponse(404, 'Venture not found'));
    }

    // Use investor details from frontend if provided, otherwise fetch from cache/API
    let investor = investorDetails;
    if (!investor) {
      // Check cache first
      const cacheKey = 'deal_room_investors_all';
      const cachedInvestors = await lruCacheService.get(cacheKey);
      
      if (cachedInvestors) {
        investor = cachedInvestors.find((inv: any) => inv.investorId === investorId);
      } else {
        // Fallback to API if not in cache
        const investors = await eastEmblemAPI.getDealRoomInvestors();
        investor = investors.find((inv: any) => inv.investorId === investorId);
      }
      
      if (!investor) {
        return res.status(404).json(createErrorResponse(404, 'Investor not found'));
      }
    }

    // Send email to admin team
    const emailSubject = `Introduction Requested - ${venture.ventureName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Introduction Request</h2>
        
        <h3>Founder Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${founder.fullName}</li>
          <li><strong>Email:</strong> ${founder.email}</li>
          <li><strong>Role:</strong> ${founder.positionRole}</li>
        </ul>

        <h3>Venture Details:</h3>
        <ul>
          <li><strong>Venture Name:</strong> ${venture.ventureName}</li>
          <li><strong>Industry:</strong> ${venture.industry || 'N/A'}</li>
          <li><strong>Geography:</strong> ${venture.geography || 'N/A'}</li>
          <li><strong>Growth Stage:</strong> ${venture.growthStage || 'N/A'}</li>
        </ul>

        <h3>Investor Details:</h3>
        <ul>
          <li><strong>Investor ID:</strong> ${investor.investorId}</li>
          <li><strong>Stage Focus:</strong> ${investor.stageOfGrowth}</li>
          <li><strong>Sector:</strong> ${investor.sector}</li>
          <li><strong>Geography:</strong> ${investor.regionGeography}</li>
          <li><strong>Ticket Size:</strong> ${investor.investmentTicketDisplay}</li>
          <li><strong>Target ProofScore:</strong> ${investor.targetProofScore}+</li>
        </ul>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
          This request was submitted through the Second Chance Deal Room.
        </p>
      </div>
    `;

    // Send email via email service
    await emailService.sendEmail({
      to: process.env.ADMIN_EMAIL || 'team@eastemblem.com',
      subject: emailSubject,
      html: emailBody,
    });

    // Log activity
    await ActivityService.logActivity({
      founderId,
      ventureId: venture.ventureId,
      activityType: 'INVESTOR_INTERACTION',
      action: 'introduction_requested',
      metadata: {
        investorId: investor.investorId,
        investorStage: investor.stageOfGrowth,
        investorSector: investor.sector,
      },
      entityType: 'investor',
      entityId: investor.investorId,
    });

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
