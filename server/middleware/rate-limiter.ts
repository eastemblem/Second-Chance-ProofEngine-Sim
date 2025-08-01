import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';
import { SecurityUtils } from '../lib/security-utils';

/**
 * Rate limiting configurations for different payment endpoints
 */

// General payment endpoints rate limiting
export const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 payment requests per windowMs
  message: {
    success: false,
    error: 'Too many payment requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return SecurityUtils.getClientIP(req);
  },
  handler: (req: Request, res: Response) => {
    console.warn(`Payment rate limit exceeded for IP: ${SecurityUtils.getClientIP(req)}`);
    res.status(429).json({
      success: false,
      error: 'Too many payment requests. Please try again later.',
      retryAfter: Math.ceil((req as any).rateLimit?.resetTime?.getTime() / 1000) || 900
    });
  }
});

// Payment status check rate limiting (more permissive)
export const paymentStatusRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 status checks per minute
  message: {
    success: false,
    error: 'Too many status check requests, please slow down.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return SecurityUtils.getClientIP(req);
  },
  handler: (req: Request, res: Response) => {
    console.warn(`Payment status rate limit exceeded for IP: ${SecurityUtils.getClientIP(req)}`);
    res.status(429).json({
      success: false,
      error: 'Too many status check requests. Please slow down.',
      retryAfter: Math.ceil((req as any).rateLimit?.resetTime?.getTime() / 1000) || 60
    });
  }
});

// Webhook rate limiting (very strict)
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Webhooks can be frequent but should be reasonable
  message: {
    success: false,
    error: 'Webhook rate limit exceeded',
    retryAfter: 60
  },
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return SecurityUtils.getClientIP(req);
  },
  handler: (req: Request, res: Response) => {
    console.error(`Webhook rate limit exceeded for IP: ${SecurityUtils.getClientIP(req)}`);
    res.status(429).json({
      success: false,
      error: 'Webhook rate limit exceeded'
    });
  }
});

// Session-based payment creation (stricter limits)
export const sessionPaymentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Very limited for session-based payments
  message: {
    success: false,
    error: 'Too many payment attempts. Please wait before trying again.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = SecurityUtils.getClientIP(req);
    const sessionId = req.body?.sessionId || 'no-session';
    return `${ip}:${sessionId}`;
  },
  handler: (req: Request, res: Response) => {
    console.warn(`Session payment rate limit exceeded for IP: ${SecurityUtils.getClientIP(req)}, Session: ${req.body?.sessionId}`);
    res.status(429).json({
      success: false,
      error: 'Too many payment attempts for this session. Please wait 5 minutes.',
      retryAfter: Math.ceil((req as any).rateLimit?.resetTime?.getTime() / 1000) || 300
    });
  }
});