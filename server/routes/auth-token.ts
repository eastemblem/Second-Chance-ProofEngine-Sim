import express from 'express';
import bcrypt from 'bcryptjs';
import { databaseService } from '../services/database-service';
import { 
  generateAuthToken, 
  verifyAuthToken, 
  createAuthResponse,
  logout,
  AuthenticatedRequest
} from '../middleware/token-auth';
import { asyncHandler, createSuccessResponse, createErrorResponse } from '../utils/error-handler';
import { appLogger } from '../utils/logger';
import { ActivityService } from '../services/activity-service';
import { db } from '../db';
import { onboardingSession, founder as founderTable } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import * as amplitudeService from '../services/amplitude-service';
const router = express.Router();

// Clean encryption middleware applied at routing level

/**
 * Register new user with token-based authentication
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, fullName, password, startupName, positionRole, industry, geography } = req.body;

  // Validate required fields
  if (!email || !fullName || !password || !positionRole) {
    return res.status(400).json(createErrorResponse(400, 'Missing required fields'));
  }

  // Check if user already exists
  const existingFounder = await databaseService.getFounderByEmail(email);
  if (existingFounder) {
    return res.status(409).json(createErrorResponse(409, 'User already exists with this email'));
  }

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create founder
    const newFounder = {
      fullName,
      email,
      positionRole,
      passwordHash,
      isTechnical: false,
      emailVerified: true // Auto-verify for now
    };
    const founder = await databaseService.createFounder(newFounder);

    // Create venture if startup name provided
    let venture = null;
    if (startupName) {
      const newVenture = {
        founderId: founder.founderId,
        name: startupName,
        industry: industry || 'Technology',
        geography: geography || 'Global',
        revenueStage: 'None' as const,
        mvpStatus: 'Mockup' as const,
        businessModel: 'To be defined',
        description: 'New startup venture'
      };
      venture = await databaseService.createVenture(newVenture);
    }

    // Generate authentication token
    const authResponse = createAuthResponse({
      founderId: founder.founderId,
      email: founder.email,
      startupName: venture?.name
    }, {
      founder: {
        founderId: founder.founderId,
        fullName: founder.fullName,
        email: founder.email,
        positionRole: founder.positionRole
      },
      venture: venture ? {
        ventureId: venture.ventureId,
        name: venture.name,
        industry: venture.industry,
        geography: venture.geography,
        growthStage: venture.growthStage
      } : null
    });

    // Set HTTP-only cookie for additional security
    res.cookie('authToken', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });

    // Log account registration activity
    const context = ActivityService.getContextFromRequest(req);
    await ActivityService.logAccountActivity(
      { ...context, founderId: founder.founderId, ventureId: venture?.ventureId },
      'signup',
      'Account created successfully',
      `New founder account created for ${fullName}`,
      { 
        founderId: founder.founderId,
        email: founder.email,
        hasVenture: !!venture
      }
    );

    // Log venture creation activity if venture was created
    if (venture) {
      await ActivityService.logVentureActivity(
        { ...context, founderId: founder.founderId },
        'create',
        `Created venture "${venture.name}"`,
        venture.ventureId,
        `Venture setup completed in ${venture.industry} industry`,
        {
          ventureId: venture.ventureId,
          industry: venture.industry,
          geography: venture.geography
        }
      );
    }

    appLogger.auth(`✅ User registered and authenticated: ${email}`, { founderId: founder.founderId });
    res.json(authResponse);

  } catch (error) {
    appLogger.auth('Registration error:', error);
    res.status(500).json(createErrorResponse(500, 'Registration failed'));
  }
}));

/**
 * Login with email and password
 */
router.post('/login', asyncHandler(async (req, res) => {
  appLogger.auth('Login request received', {
    hasRawBody: !!req.body,
    hasDecryptedBody: !!req.decryptedBody,
    encryptionEnabled: req.encryptionEnabled || false,
    email: req.body?.email
  });
  
  const { email, password } = req.body;

  // Validate required fields with detailed logging
  if (!email || !password) {
    appLogger.auth('Login validation failed - missing required fields', {
      hasEmail: !!email,
      hasPassword: !!password,
      bodyKeys: Object.keys(req.body || {})
    });
    return res.status(400).json(createErrorResponse(400, 'Email and password are required'));
  }

  try {
    // Get founder by email
    appLogger.auth(`🔍 Login attempt for email: ${email}`);
    const founder = await databaseService.getFounderByEmail(email);
    
    if (!founder) {
      // Check if there's a pending pre-onboarding payment for this email
      const { preOnboardingPayments } = await import('@shared/schema');
      const [pendingPayment] = await db
        .select()
        .from(preOnboardingPayments)
        .where(and(
          eq(preOnboardingPayments.email, email),
          eq(preOnboardingPayments.status, 'completed')
        ))
        .limit(1);
      
      if (pendingPayment && !pendingPayment.claimedByFounderId) {
        appLogger.auth(`⚠️ User has pending payment but no account: ${email}`);
        return res.status(409).json({
          success: false,
          error: 'onboarding_incomplete',
          code: 'PENDING_PAYMENT',
          message: 'You have paid but haven\'t set up your account yet.',
          data: {
            email: email,
            resumeToken: pendingPayment.reservationToken,
            resumeUrl: `/onboarding?token=${pendingPayment.reservationToken}`
          }
        });
      }
      
      appLogger.auth(`❌ Founder not found for email: ${email}`);
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }
    
    // Check if founder has incomplete onboarding (no password set means onboarding incomplete)
    if (!founder.passwordHash) {
      // Find their onboarding session
      const [session] = await db
        .select()
        .from(onboardingSession)
        .where(eq(onboardingSession.founderId, founder.founderId))
        .orderBy(desc(onboardingSession.createdAt))
        .limit(1);
      
      appLogger.auth(`⚠️ Onboarding incomplete for founder: ${founder.founderId}`);
      return res.status(409).json({
        success: false,
        error: 'onboarding_incomplete',
        code: 'NO_PASSWORD',
        message: 'Please complete your account setup first.',
        data: {
          email: founder.email,
          founderId: founder.founderId,
          sessionId: session?.sessionId,
          currentStep: session?.currentStep || 'founder',
          resumeUrl: session?.sessionId 
            ? `/onboarding?resume=${session.sessionId}` 
            : '/onboarding'
        }
      });
    }

    appLogger.auth(`🔑 Verifying password for founder: ${founder.founderId}`);
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, founder.passwordHash);
    if (!isPasswordValid) {
      appLogger.auth(`❌ Password verification failed for founder: ${founder.founderId}`);
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }
    
    // Check if onboarding session is marked as complete
    const [session] = await db
      .select()
      .from(onboardingSession)
      .where(eq(onboardingSession.founderId, founder.founderId))
      .orderBy(desc(onboardingSession.createdAt))
      .limit(1);
    
    if (session && !session.isComplete) {
      appLogger.auth(`⚠️ Onboarding session incomplete for founder: ${founder.founderId}`);
      return res.status(409).json({
        success: false,
        error: 'onboarding_incomplete',
        code: 'SESSION_INCOMPLETE',
        message: 'Please finish setting up your account.',
        data: {
          email: founder.email,
          founderId: founder.founderId,
          sessionId: session.sessionId,
          currentStep: session.currentStep,
          completedSteps: session.completedSteps,
          resumeUrl: `/onboarding?resume=${session.sessionId}`
        }
      });
    }
    
    appLogger.auth(`✅ Password verified successfully for founder: ${founder.founderId}`);

    // Get associated venture
    const ventures = await databaseService.getVenturesByFounderId(founder.founderId);
    const primaryVenture = ventures[0] || null;

    // Update last login (simplified for now)
    appLogger.auth(`User ${founder.founderId} logged in at ${new Date()}`, { founderId: founder.founderId, email: founder.email });

    // Generate authentication token
    const authResponse = createAuthResponse({
      founderId: founder.founderId,
      email: founder.email,
      startupName: primaryVenture?.name
    }, {
      founder: {
        founderId: founder.founderId,
        fullName: founder.fullName,
        email: founder.email,
        positionRole: founder.positionRole,
        lastLoginAt: new Date().toISOString()
      },
      venture: primaryVenture ? {
        ventureId: primaryVenture.ventureId,
        name: primaryVenture.name,
        industry: primaryVenture.industry,
        geography: primaryVenture.geography,
        growthStage: primaryVenture.growthStage
      } : null
    });

    // Set HTTP-only cookie
    res.cookie('authToken', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });

    // Log authentication activity
    const context = ActivityService.getContextFromRequest(req);
    await ActivityService.logAuthActivity(
      { ...context, founderId: founder.founderId, ventureId: primaryVenture?.ventureId },
      'login',
      'User logged in successfully',
      `Successful login from ${context.ipAddress}`,
      {
        founderId: founder.founderId,
        email: founder.email,
        hasVenture: !!primaryVenture,
        loginTime: new Date().toISOString()
      }
    );

    appLogger.auth(`✅ User logged in: ${email}`, { founderId: founder.founderId, email });
    
    // Track login in Amplitude
    amplitudeService.trackLogin(
      founder.founderId,
      founder.email,
      primaryVenture?.ventureId
    );
    
    res.json(authResponse);

  } catch (error) {
    appLogger.auth('Login error:', error);
    res.status(500).json(createErrorResponse(500, 'Login failed'));
  }
}));

/**
 * Logout - invalidate JWT token
 */
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;
  
  if (token) {
    // Import invalidateToken function
    const { invalidateToken } = await import('../middleware/token-auth');
    
    // Try to extract founderId from token for activity logging
    let founderId = null;
    try {
      const { verifyAuthToken } = await import('../middleware/token-auth');
      const decoded = verifyAuthToken(token);
      founderId = decoded?.founderId;
    } catch (error) {
      // Token might be expired, but we can still log logout attempt
    }
    
    // Log logout activity
    const context = ActivityService.getContextFromRequest(req);
    await ActivityService.logAuthActivity(
      { ...context, founderId: founderId || undefined },
      'logout',
      'User logged out successfully',
      `Logout from ${context.ipAddress}`,
      {
        founderId,
        logoutTime: new Date().toISOString()
      }
    );
    
    // Add token to blacklist
    invalidateToken(token);
    
    // Clear HTTP-only cookie
    res.clearCookie('authToken');
    
    // Track logout in Amplitude
    if (founderId) {
      amplitudeService.trackLogout(founderId);
    }
    
    appLogger.auth('✅ JWT token invalidated and user logged out');
  }
  
  res.json({ 
    success: true, 
    message: 'Logout successful - token invalidated' 
  });
}));

/**
 * Verify token and get user info
 */
router.get('/verify', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;

  if (!token) {
    appLogger.auth('Token verification failed - no token provided');
    return res.status(401).json(createErrorResponse(401, 'No token provided'));
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    appLogger.auth('Token verification failed - invalid token');
    return res.status(401).json(createErrorResponse(401, 'Invalid token'));
  }

  try {
    // Verify user still exists
    const founder = await databaseService.getFounderById(decoded.founderId);
    if (!founder) {
      appLogger.auth('Token verification failed - user not found in database', { founderId: decoded.founderId });
      return res.status(401).json(createErrorResponse(401, 'User not found'));
    }

    // Get associated venture
    const ventures = await databaseService.getVenturesByFounderId(founder.founderId);
    const primaryVenture = ventures[0] || null;

    appLogger.auth('Token verification successful', {
      founderId: founder.founderId,
      email: founder.email,
      hasVenture: !!primaryVenture
    });

    res.json(createSuccessResponse({
      user: {
        founderId: founder.founderId,
        email: founder.email,
        fullName: founder.fullName,
        positionRole: founder.positionRole,
        startupName: primaryVenture?.name
      },
      venture: primaryVenture ? {
        ventureId: primaryVenture.ventureId,
        name: primaryVenture.name,
        industry: primaryVenture.industry,
        geography: primaryVenture.geography,
        growthStage: primaryVenture.growthStage
      } : null,
      tokenValid: true,
      expiresAt: decoded.exp
    }));

  } catch (error) {
    appLogger.auth('Token verification error:', error);
    res.status(500).json(createErrorResponse(500, 'Token verification failed'));
  }
}));

/**
 * Refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;

  if (!token) {
    appLogger.auth('Token refresh failed - no token provided');
    return res.status(401).json(createErrorResponse(401, 'No token provided'));
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    appLogger.auth('Token refresh failed - invalid token');
    return res.status(401).json(createErrorResponse(401, 'Invalid token'));
  }

  try {
    // Verify user still exists
    const founder = await databaseService.getFounderById(decoded.founderId);
    if (!founder) {
      appLogger.auth('Token refresh failed - user not found in database', { founderId: decoded.founderId });
      return res.status(401).json(createErrorResponse(401, 'User not found'));
    }

    // Get associated venture for complete data
    const ventures = await databaseService.getVenturesByFounderId(founder.founderId);
    const primaryVenture = ventures[0] || null;

    // Generate new token with complete user and venture data
    const authResponse = createAuthResponse({
      founderId: decoded.founderId,
      email: decoded.email,
      startupName: primaryVenture?.name || decoded.startupName
    }, {
      founder: {
        founderId: founder.founderId,
        fullName: founder.fullName,
        email: founder.email,
        positionRole: founder.positionRole
      },
      venture: primaryVenture ? {
        ventureId: primaryVenture.ventureId,
        name: primaryVenture.name,
        industry: primaryVenture.industry,
        geography: primaryVenture.geography,
        growthStage: primaryVenture.growthStage
      } : null
    });

    // Set new cookie
    res.cookie('authToken', authResponse.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    appLogger.auth(`🔄 Token refreshed for user: ${decoded.email}`);
    res.json(authResponse);

  } catch (error) {
    appLogger.auth('Token refresh error:', error);
    res.status(500).json(createErrorResponse(500, 'Token refresh failed'));
  }
}));

/**
 * Resume onboarding - lookup session by email or session ID
 */
router.post('/resume-onboarding', asyncHandler(async (req, res) => {
  const { email, sessionId } = req.body;

  if (!email && !sessionId) {
    return res.status(400).json(createErrorResponse(400, 'Email or session ID is required'));
  }

  try {
    let session = null;
    let founder = null;

    if (sessionId) {
      // Lookup by session ID
      const [sessionResult] = await db
        .select()
        .from(onboardingSession)
        .where(eq(onboardingSession.sessionId, sessionId))
        .limit(1);
      session = sessionResult;
      
      if (session?.founderId) {
        founder = await databaseService.getFounderById(session.founderId);
      }
    } else if (email) {
      // Lookup by email - find founder first, then their session
      founder = await databaseService.getFounderByEmail(email);
      
      if (founder) {
        const [sessionResult] = await db
          .select()
          .from(onboardingSession)
          .where(eq(onboardingSession.founderId, founder.founderId))
          .orderBy(desc(onboardingSession.createdAt))
          .limit(1);
        session = sessionResult;
      } else {
        // Check for pending pre-onboarding payment
        const { preOnboardingPayments } = await import('@shared/schema');
        const [pendingPayment] = await db
          .select()
          .from(preOnboardingPayments)
          .where(and(
            eq(preOnboardingPayments.email, email),
            eq(preOnboardingPayments.status, 'completed')
          ))
          .limit(1);
        
        if (pendingPayment && !pendingPayment.claimedByFounderId) {
          return res.json(createSuccessResponse({
            found: true,
            type: 'pending_payment',
            email: email,
            resumeToken: pendingPayment.reservationToken,
            resumeUrl: `/onboarding?token=${pendingPayment.reservationToken}`
          }));
        }
        
        return res.json(createSuccessResponse({
          found: false,
          message: 'No onboarding session found for this email'
        }));
      }
    }

    if (!session) {
      return res.json(createSuccessResponse({
        found: false,
        message: 'No onboarding session found'
      }));
    }

    // Get venture data if available
    let venture = null;
    if (founder) {
      const ventures = await databaseService.getVenturesByFounderId(founder.founderId);
      venture = ventures[0] || null;
    }

    appLogger.auth(`📋 Onboarding session found for resume`, {
      sessionId: session.sessionId,
      founderId: founder?.founderId,
      currentStep: session.currentStep,
      isComplete: session.isComplete
    });

    res.json(createSuccessResponse({
      found: true,
      type: 'session',
      sessionId: session.sessionId,
      currentStep: session.currentStep,
      completedSteps: session.completedSteps || [],
      stepData: session.stepData || {},
      isComplete: session.isComplete,
      founder: founder ? {
        founderId: founder.founderId,
        fullName: founder.fullName,
        email: founder.email,
        phone: founder.phone,
        linkedinProfile: founder.linkedinProfile,
        gender: founder.gender,
        age: founder.age,
        positionRole: founder.positionRole,
        residence: founder.residence,
        isTechnical: founder.isTechnical,
        street: founder.street,
        city: founder.city,
        state: founder.state,
        country: founder.country
      } : null,
      venture: venture ? {
        ventureId: venture.ventureId,
        name: venture.name,
        industry: venture.industry,
        geography: venture.geography,
        businessModel: venture.businessModel,
        description: venture.description,
        mvpStatus: venture.mvpStatus,
        revenueStage: venture.revenueStage
      } : null,
      resumeUrl: `/onboarding?resume=${session.sessionId}`
    }));

  } catch (error) {
    appLogger.auth('Resume onboarding error:', error);
    res.status(500).json(createErrorResponse(500, 'Failed to lookup onboarding session'));
  }
}));

export default router;