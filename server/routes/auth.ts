import express, { Request, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { founder } from '@shared/schema';
import { storage } from '../storage';
import { 
  validatePassword, 
  hashPassword, 
  comparePasswords, 
  generateVerificationToken, 
  generateTokenExpiry,
  isTokenExpired 
} from '../utils/auth';
import { emailService } from '../services/emailService';
import { appLogger } from '../utils/logger';

const router = express.Router();

// Extend express session interface
declare module 'express-session' {
  interface SessionData {
    founderId?: string;
    email?: string;
    isAuthenticated?: boolean;
  }
}

// Email verification endpoint - support both path and query parameter formats
router.get('/verify-email/:token?', async (req: Request, res: Response) => {
  try {
    // Support both /verify-email/token and /verify-email?token=token formats
    const token = req.params.token || req.query.token as string;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Find founder with matching token
    const [founderRecord] = await db
      .select()
      .from(founder)
      .where(eq(founder.verificationToken, token));

    if (!founderRecord) {
      return res.redirect('/set-password?error=invalid');
    }

    // Check if already verified
    if (founderRecord.emailVerified) {
      return res.redirect(`/set-password?error=already_verified&email=${encodeURIComponent(founderRecord.email)}`);
    }

    // Check if token is expired
    if (founderRecord.tokenExpiresAt && isTokenExpired(founderRecord.tokenExpiresAt)) {
      return res.redirect(`/set-password?error=expired&email=${encodeURIComponent(founderRecord.email)}`);
    }

    // Update founder record - mark email as verified
    await db
      .update(founder)
      .set({
        emailVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date()
      })
      .where(eq(founder.founderId, founderRecord.founderId));

    // Redirect to set password page with success message
    res.redirect(`/set-password?verified=true&email=${encodeURIComponent(founderRecord.email)}`);
  } catch (error) {
    appLogger.auth('Email verification error:', { error: error instanceof Error ? error.message : String(error), token: req.params.token || req.query.token });
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Set password endpoint
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const setPasswordSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8)
    });

    const { email, password } = setPasswordSchema.parse(req.body);

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password validation failed',
        details: passwordValidation.errors 
      });
    }

    // Find founder by email and ensure email is verified
    const [founderRecord] = await db
      .select()
      .from(founder)
      .where(and(
        eq(founder.email, email),
        eq(founder.emailVerified, true)
      ));

    if (!founderRecord) {
      return res.status(400).json({ error: 'Email not found or not verified' });
    }

    // Hash password and update record
    const hashedPassword = await hashPassword(password);
    
    await db
      .update(founder)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(founder.founderId, founderRecord.founderId));

    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    appLogger.auth('Set password error:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to set password' });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });

    const { email, password } = loginSchema.parse(req.body);

    // Find founder by email
    const [founderRecord] = await db
      .select()
      .from(founder)
      .where(eq(founder.email, email));

    if (!founderRecord) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!founderRecord.emailVerified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    // Check if password is set
    if (!founderRecord.passwordHash) {
      return res.status(401).json({ error: 'Please set your password first' });
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, founderRecord.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login time
    await db
      .update(founder)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(founder.founderId, founderRecord.founderId));

    // Set session
    req.session.founderId = founderRecord.founderId;
    req.session.email = founderRecord.email;
    req.session.isAuthenticated = true;

    res.json({ 
      success: true, 
      message: 'Login successful',
      founder: {
        founderId: founderRecord.founderId,
        fullName: founderRecord.fullName,
        email: founderRecord.email
      }
    });
  } catch (error) {
    appLogger.auth('Login error:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      appLogger.auth('Logout error:', { error: err instanceof Error ? err.message : String(err), sessionId: req.sessionID });
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Get current user endpoint with latest venture
router.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.session.isAuthenticated || !req.session.founderId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const founderId = req.session.founderId;

    // Get founder details
    const founderRecord = await storage.getFounder(founderId);
    if (!founderRecord) {
      return res.status(404).json({ error: 'Founder not found' });
    }

    // Get founder's latest venture
    const ventures = await storage.getFounderVentures(founderId);
    const latestVenture = ventures.length > 0 ? ventures[ventures.length - 1] : null;

    // Return founder data with latest venture
    const { passwordHash, verificationToken, tokenExpiresAt, ...safeFounder } = founderRecord;
    
    res.json({
      ...safeFounder,
      isAuthenticated: true,
      venture: latestVenture,
      totalVentures: ventures.length
    });
  } catch (error) {
    appLogger.auth('Get user data error:', { error: error instanceof Error ? error.message : String(error), founderId: req.session.founderId });
    res.status(500).json({ error: 'Failed to retrieve user data' });
  }
});

// Forgot password endpoint - generates reset token and sends email
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const forgotPasswordSchema = z.object({
      email: z.string().email()
    });

    const { email } = forgotPasswordSchema.parse(req.body);

    // Find founder by email
    const [founderRecord] = await db
      .select()
      .from(founder)
      .where(eq(founder.email, email));

    // Don't reveal if email exists or not for security
    if (!founderRecord) {
      return res.json({ 
        success: true, 
        message: 'If an account with this email exists, you will receive a password reset link shortly.' 
      });
    }

    // Generate reset token and expiry
    const resetToken = generateVerificationToken();
    const tokenExpiry = generateTokenExpiry();

    // Update founder with reset token
    await db
      .update(founder)
      .set({
        verificationToken: resetToken,
        tokenExpiresAt: tokenExpiry,
        updatedAt: new Date()
      })
      .where(eq(founder.founderId, founderRecord.founderId));

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        founderRecord.email,
        founderRecord.fullName,
        resetToken
      );
      appLogger.email(`Password reset email sent to ${founderRecord.email}`, { email: founderRecord.email });
    } catch (emailError) {
      appLogger.email('Failed to send password reset email:', { error: emailError instanceof Error ? emailError.message : String(emailError), email: founderRecord.email });
      // Continue without failing the request - user won't know email failed
    }

    res.json({ 
      success: true, 
      message: 'If an account with this email exists, you will receive a password reset link shortly.' 
    });
  } catch (error) {
    appLogger.auth('Forgot password error:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid email format', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password endpoint - validates token and redirects to frontend (GET)
router.get('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.redirect('/forgot-password?error=invalid');
    }

    // Find founder with matching reset token
    const [founderRecord] = await db
      .select()
      .from(founder)
      .where(eq(founder.verificationToken, token));

    if (!founderRecord) {
      return res.redirect('/forgot-password?error=invalid');
    }

    // Check if token is expired
    if (founderRecord.tokenExpiresAt && isTokenExpired(founderRecord.tokenExpiresAt)) {
      return res.redirect(`/forgot-password?error=expired&email=${encodeURIComponent(founderRecord.email)}`);
    }

    // Don't clear token here - save it for the POST request
    // Redirect to reset password page
    res.redirect(`/reset-password/${token}`);
  } catch (error) {
    appLogger.auth('Reset password GET error:', { error: error instanceof Error ? error.message : String(error), token: req.params.token });
    res.redirect('/forgot-password?error=invalid');
  }
});

// Reset password endpoint - handles password update form submission (POST)
router.post('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const resetPasswordSchema = z.object({
      password: z.string().min(8)
    });

    const { password } = resetPasswordSchema.parse(req.body);
    
    if (!token) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Find founder with matching reset token
    const [founderRecord] = await db
      .select()
      .from(founder)
      .where(eq(founder.verificationToken, token));

    if (!founderRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token is expired
    if (founderRecord.tokenExpiresAt && isTokenExpired(founderRecord.tokenExpiresAt)) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update founder with new password and clear reset token
    await db
      .update(founder)
      .set({
        passwordHash,
        verificationToken: null,
        tokenExpiresAt: null,
        updatedAt: new Date()
      })
      .where(eq(founder.founderId, founderRecord.founderId));

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    appLogger.auth('Reset password POST error:', { error: error instanceof Error ? error.message : String(error), token: req.params.token });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Middleware to check authentication
export function requireAuth(req: Request, res: Response, next: any) {
  if (!req.session.isAuthenticated || !req.session.founderId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export default router;