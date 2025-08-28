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
        geography: venture.geography
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
      appLogger.auth(`❌ Founder not found for email: ${email}`);
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }
    
    if (!founder.passwordHash) {
      appLogger.auth(`❌ No password hash found for founder: ${founder.founderId}`);
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }

    appLogger.auth(`🔑 Verifying password for founder: ${founder.founderId}`);
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, founder.passwordHash);
    if (!isPasswordValid) {
      appLogger.auth(`❌ Password verification failed for founder: ${founder.founderId}`);
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
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
        geography: primaryVenture.geography
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
        geography: primaryVenture.geography
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

    // Generate new token
    const authResponse = createAuthResponse({
      founderId: decoded.founderId,
      email: decoded.email,
      startupName: decoded.startupName
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

export default router;