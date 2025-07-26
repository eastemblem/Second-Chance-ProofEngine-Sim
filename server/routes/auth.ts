import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/error-handler';
import { storage } from '../storage';
import { createInsertSchema } from 'drizzle-zod';
import { founder } from '@shared/schema';

// Create user insert schema
const insertUserSchema = createInsertSchema(founder);
import { z } from 'zod';
import { appLogger } from '../utils/logger';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';

// Set to track blacklisted tokens
const blacklistedTokens = new Set<string>();

// Helper function to generate JWT token
function generateToken(user: any): string {
  return jwt.sign(
    {
      founderId: user.id,
      email: user.email,
      username: user.username,
      ventureId: user.ventureId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper function to verify JWT token
function verifyToken(token: string): any {
  try {
    if (blacklistedTokens.has(token)) {
      appLogger.auth('Token verification failed: Token blacklisted');
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    appLogger.auth('Token verified successfully for user:', (decoded as any).founderId);
    return decoded;
  } catch (error) {
    appLogger.auth('Token verification failed:', error.message);
    return null;
  }
}

// Session-based login (legacy compatibility)
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: validation.error.errors,
    });
  }

  const { email, password } = validation.data;
  
  appLogger.auth('Session login attempt for email:', email);

  try {
    // Get user from storage
    const user = await storage.getUserByEmail(email);
    if (!user) {
      appLogger.auth('Session login failed: User not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      appLogger.auth('Session login failed: Invalid password for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Create session
    (req.session as any).user = {
      id: user.id,
      email: user.email,
      username: user.username,
      ventureId: user.ventureId,
    };

    appLogger.auth('Session login successful for user:', user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          ventureId: user.ventureId,
        },
      },
    });
  } catch (error) {
    appLogger.auth('Session login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
}));

// JWT-based login
router.post('/token/login', asyncHandler(async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: validation.error.errors,
    });
  }

  const { email, password } = validation.data;
  
  appLogger.auth('JWT login attempt for email:', email);

  try {
    // Get user from storage
    const user = await storage.getUserByEmail(email);
    if (!user) {
      appLogger.auth('JWT login failed: User not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      appLogger.auth('JWT login failed: Invalid password for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    appLogger.auth('JWT login successful for user:', user.id);

    // Set secure cookie (optional additional security)
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          ventureId: user.ventureId,
        },
      },
    });
  } catch (error) {
    appLogger.auth('JWT login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
}));

// Register endpoint
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: validation.error.errors,
    });
  }

  const userData = validation.data;
  
  appLogger.auth('Registration attempt for email:', userData.email);

  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      appLogger.auth('Registration failed: Email already exists:', userData.email);
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    appLogger.auth('Registration successful for user:', newUser.id);

    // Generate JWT token for immediate login
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          ventureId: newUser.ventureId,
        },
      },
    });
  } catch (error) {
    appLogger.auth('Registration error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
}));

// Session logout
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const user = (req.session as any)?.user;
  
  if (user) {
    appLogger.auth('Session logout for user:', user.id);
  }

  req.session.destroy((err) => {
    if (err) {
      appLogger.auth('Session logout error:', err.message);
      return res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
}));

// JWT logout (blacklist token)
router.post('/token/logout', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    // Add token to blacklist
    blacklistedTokens.add(token);
    appLogger.auth('JWT token blacklisted for logout');
    
    // Clean up old blacklisted tokens periodically (optional)
    if (blacklistedTokens.size > 1000) {
      blacklistedTokens.clear();
      appLogger.auth('Blacklisted tokens cleared for memory management');
    }
  }

  res.clearCookie('authToken');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

// Token verification endpoint
router.get('/token/verify', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  res.json({
    success: true,
    data: {
      user: decoded,
      valid: true,
    },
  });
}));

// Get current user (session-based)
router.get('/user', asyncHandler(async (req: Request, res: Response) => {
  const user = (req.session as any)?.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  res.json({
    success: true,
    data: { user },
  });
}));

// Export utilities for use in middleware
export { generateToken, verifyToken, blacklistedTokens };
export default router;