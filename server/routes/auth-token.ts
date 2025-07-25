import express from 'express';
import bcrypt from 'bcryptjs';
import { databaseService } from '../services/database-service';
import { CacheService } from '../utils/cache-service';
import { 
  generateAuthToken, 
  verifyAuthToken, 
  createAuthResponse,
  logout,
  AuthenticatedRequest
} from '../middleware/token-auth';
import { asyncHandler, createSuccessResponse, createErrorResponse } from '../utils/error-handler';

const router = express.Router();

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
  const existingFounders = await databaseService.getFoundersByEmail(email);
  if (existingFounders.length > 0) {
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

    console.log(`✅ User registered and authenticated: ${email}`);
    res.json(authResponse);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse(500, 'Registration failed'));
  }
}));

/**
 * Login with email and password
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(createErrorResponse(400, 'Email and password are required'));
  }

  try {
    // Get founder by email
    const founders = await databaseService.getFoundersByEmail(email);
    const founder = founders[0];
    if (!founder || !founder.passwordHash) {
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, founder.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json(createErrorResponse(401, 'Invalid credentials'));
    }

    // Get associated venture
    const ventures = await databaseService.getVenturesByFounderId(founder.founderId);
    const primaryVenture = ventures[0] || null;

    // Update last login
    await databaseService.updateFounder(founder.founderId, {
      lastLoginAt: new Date()
    });

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

    console.log(`✅ User logged in: ${email}`);
    res.json(authResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse(500, 'Login failed'));
  }
}));

/**
 * Logout - clear token
 */
router.post('/logout', (req: AuthenticatedRequest, res) => {
  logout(req, res);
  console.log(`✅ User logged out: ${req.user?.email || 'unknown'}`);
});

/**
 * Verify token and get user info
 */
router.get('/verify', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;

  if (!token) {
    return res.status(401).json(createErrorResponse(401, 'No token provided'));
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json(createErrorResponse(401, 'Invalid token'));
  }

  try {
    // Verify user still exists
    const founder = await databaseService.getFounderById(decoded.founderId);
    if (!founder) {
      return res.status(401).json(createErrorResponse(401, 'User not found'));
    }

    // Get associated venture
    const ventures = await databaseService.getVenturesByFounderId(founder.founderId);
    const primaryVenture = ventures[0] || null;

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
    console.error('Token verification error:', error);
    res.status(500).json(createErrorResponse(500, 'Token verification failed'));
  }
}));

/**
 * Refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.authToken;

  if (!token) {
    return res.status(401).json(createErrorResponse(401, 'No token provided'));
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json(createErrorResponse(401, 'Invalid token'));
  }

  try {
    // Verify user still exists
    const founder = await databaseService.getFounderById(decoded.founderId);
    if (!founder) {
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

    console.log(`🔄 Token refreshed for user: ${decoded.email}`);
    res.json(authResponse);

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json(createErrorResponse(500, 'Token refresh failed'));
  }
}));

export default router;