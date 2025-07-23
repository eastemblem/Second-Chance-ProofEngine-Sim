import express, { Request, Response } from 'express';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { founder } from '@shared/schema';
import { 
  validatePassword, 
  hashPassword, 
  comparePasswords, 
  generateVerificationToken, 
  generateTokenExpiry,
  isTokenExpired 
} from '../utils/auth';
import { emailService } from '../services/emailService';

const router = express.Router();

// Extend express session interface
declare module 'express-session' {
  interface SessionData {
    founderId?: string;
    email?: string;
    isAuthenticated?: boolean;
  }
}

// Email verification endpoint
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
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
    console.error('Email verification error:', error);
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
    console.error('Set password error:', error);
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
    console.error('Login error:', error);
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
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Get current user endpoint
router.get('/me', (req: Request, res: Response) => {
  if (!req.session.isAuthenticated || !req.session.founderId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    founderId: req.session.founderId,
    email: req.session.email,
    isAuthenticated: true
  });
});

// Middleware to check authentication
export function requireAuth(req: Request, res: Response, next: any) {
  if (!req.session.isAuthenticated || !req.session.founderId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export default router;