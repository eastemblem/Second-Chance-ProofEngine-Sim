import { Router } from 'express';
import { emailService } from '../services/emailService.js';
import { appLogger } from '../utils/logger';
import { storage } from '../storage';
import { generateVerificationToken, generateTokenExpiry } from '../utils/auth';

const router = Router();

/**
 * Send verification email
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { email, userName, verificationUrl } = req.body;
    
    if (!email || !userName || !verificationUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, userName, verificationUrl' 
      });
    }

    const success = await emailService.sendVerificationEmail(email, userName, verificationUrl);
    
    if (success) {
      res.json({ success: true, message: 'Verification email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    appLogger.email('Error sending verification email:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send welcome email
 */
router.post('/send-welcome', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, userName' 
      });
    }

    const success = await emailService.sendWelcomeEmail(email, userName);
    
    if (success) {
      res.json({ success: true, message: 'Welcome email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send welcome email' });
    }
  } catch (error) {
    appLogger.email('Error sending welcome email:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send onboarding completion email with report and certificate
 */
router.post('/send-onboarding', async (req, res) => {
  try {
    const { 
      email, 
      userName, 
      proofScore, 
      scoreBreakdown, 
      proofTags, 
      reportUrl, 
      certificateUrl 
    } = req.body;
    
    if (!email || !userName || proofScore === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, userName, proofScore' 
      });
    }

    const success = await emailService.sendOnboardingEmail(
      email,
      userName,
      proofScore,
      scoreBreakdown || {},
      proofTags || [],
      reportUrl || '',
      certificateUrl || ''
    );
    
    if (success) {
      res.json({ success: true, message: 'Onboarding completion email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send onboarding email' });
    }
  } catch (error) {
    appLogger.email('Error sending onboarding email:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send onboarding completion email - Gateway endpoint
 * Fetches founder data from database and sends email with verification link
 * Used by external gateway to trigger onboarding emails
 */
router.post('/send-onboarding-complete', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Missing required field: email' 
      });
    }

    // Get founder from database
    const founder = await storage.getFounderByEmail(email);
    if (!founder) {
      return res.status(404).json({ 
        error: 'Founder not found with this email' 
      });
    }

    // Get founder's venture to get ProofScore
    const ventures = await storage.getVenturesByFounderId(founder.founderId);
    const venture = ventures?.[0];
    
    if (!venture) {
      return res.status(404).json({ 
        error: 'No venture found for this founder' 
      });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpiry = generateTokenExpiry();

    // Update founder with verification token
    await storage.updateFounder(founder.founderId, {
      verificationToken,
      tokenExpiresAt: tokenExpiry,
      updatedAt: new Date()
    });

    // Build verification URL
    const baseUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const verificationUrl = `${baseUrl.replace(/\/+$/, '')}/api/auth/verify-email?token=${verificationToken}`;

    // Get founder name
    const userName = founder.fullName?.split(' ')[0] || 'Founder';
    const proofScore = venture.proofScore || 0;

    // Send the onboarding email
    const success = await emailService.sendOnboardingEmail(
      email,
      userName,
      proofScore,
      {}, // scoreBreakdown
      [], // proofTags
      '', // reportUrl
      '', // certificateUrl
      verificationUrl
    );
    
    if (success) {
      appLogger.email('Gateway: Onboarding completion email sent', { email, founderId: founder.founderId, proofScore });
      res.json({ 
        success: true, 
        message: 'Onboarding completion email sent successfully',
        data: {
          founderId: founder.founderId,
          ventureName: venture.name,
          proofScore
        }
      });
    } else {
      res.status(500).json({ error: 'Failed to send onboarding email' });
    }
  } catch (error) {
    appLogger.email('Error sending onboarding complete email:', { error: error instanceof Error ? error.message : String(error), email: req.body.email });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send custom email using any template
 */
router.post('/send-template', async (req, res) => {
  try {
    const { email, subject, templateName, templateData } = req.body;
    
    if (!email || !subject || !templateName || !templateData) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, subject, templateName, templateData' 
      });
    }

    const success = await emailService.sendEmail(email, subject, templateName, templateData);
    
    if (success) {
      res.json({ success: true, message: `${templateName} email sent successfully` });
    } else {
      res.status(500).json({ error: `Failed to send ${templateName} email` });
    }
  } catch (error) {
    appLogger.email(`Error sending ${req.body.templateName} email:`, { error: error instanceof Error ? error.message : String(error), email: req.body.email, templateName: req.body.templateName });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Preview email template (for testing)
 */
router.post('/preview-template', async (req, res) => {
  try {
    const { templateName, templateData } = req.body;
    
    if (!templateName || !templateData) {
      return res.status(400).json({ 
        error: 'Missing required fields: templateName, templateData' 
      });
    }

    const html = await emailService.loadTemplate(templateName, templateData);
    res.json({ success: true, html });
  } catch (error) {
    appLogger.email('Error previewing email template:', { error: error instanceof Error ? error.message : String(error), templateName: req.body.templateName });
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

/**
 * List available email templates
 */
router.get('/templates', (req, res) => {
  const templates = [
    'email-verification',
    'welcome-email', 
    'appointment-confirmation',
    'progress-update',
    'payment-confirmation',
    'support-response',
    'program-completion',
    'win-back',
    'newsletter',
    'reminder',
    'onboarding'
  ];
  
  res.json({ templates });
});

export default router;