import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Comprehensive validation schemas for all endpoints
export const validationSchemas = {
  // Dashboard endpoints
  dashboard: {
    founderId: z.object({
      founderId: z.string().uuid("Invalid founder ID format")
    })
  },

  // Vault endpoints
  vault: {
    fileUpload: z.object({
      category: z.enum([
        '0_Overview',
        '1_Problem_Proof', 
        '2_Solution_Proof',
        '3_Demand_Proof',
        '4_Credibility_Proof',
        '5_Commercial_Proof',
        '6_Investor_Pack'
      ], { required_error: "Valid category is required" })
    }),
    
    folderCreate: z.object({
      folderName: z.string()
        .min(1, "Folder name is required")
        .max(100, "Folder name too long")
        .regex(/^[a-zA-Z0-9\s\-_]+$/, "Invalid characters in folder name"),
      parentCategory: z.enum([
        '0_Overview',
        '1_Problem_Proof',
        '2_Solution_Proof', 
        '3_Demand_Proof',
        '4_Credibility_Proof',
        '5_Commercial_Proof',
        '6_Investor_Pack'
      ])
    }),

    multipleUpload: z.object({
      category: z.enum([
        '0_Overview',
        '1_Problem_Proof',
        '2_Solution_Proof',
        '3_Demand_Proof', 
        '4_Credibility_Proof',
        '5_Commercial_Proof',
        '6_Investor_Pack'
      ]),
      files: z.array(z.any()).min(1, "At least one file required").max(10, "Maximum 10 files allowed")
    })
  },

  // Onboarding endpoints
  onboarding: {
    founder: z.object({
      fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
      email: z.string().email("Valid email is required"),
      startupName: z.string().min(1, "Startup name is required").max(100, "Startup name too long"),
      stage: z.enum([
        'Idea',
        'Pre-Seed',
        'Seed', 
        'Series A',
        'Series B',
        'Series C+',
        'Growth',
        'Pre-IPO'
      ], { required_error: "Valid stage is required" }),
      acceleratorApplications: z.number().min(0).max(50).optional(),
      positionRole: z.string().max(100).optional(),
      industry: z.string().max(100).optional(),
      geography: z.string().max(100).optional(),
      businessModel: z.string().max(100).optional()
    }),

    team: z.object({
      teamMembers: z.array(z.object({
        name: z.string().min(1, "Team member name required").max(100),
        role: z.string().min(1, "Team member role required").max(100),
        email: z.string().email("Valid email required").optional(),
        linkedinUrl: z.string().url("Valid LinkedIn URL").optional()
      })).max(4, "Maximum 4 team members allowed").optional()
    }),

    vaultCreation: z.object({
      ventureId: z.string().uuid("Valid venture ID required"),
      ventureName: z.string().min(1, "Venture name required").max(100)
    })
  },

  // File validation
  file: {
    pitchDeck: z.object({
      mimetype: z.enum([
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ], { required_error: "Only PDF, PPT, and PPTX files allowed" }),
      size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB")
    }),

    document: z.object({
      mimetype: z.enum([
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/jpg',
        'image/png', 
        'image/svg+xml',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ], { required_error: "Unsupported file type" }),
      size: z.number().max(10 * 1024 * 1024, "File size must be under 10MB")
    })
  },

  // Query parameters
  query: {
    pagination: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, "Page must be positive").optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, "Limit must be 1-100").optional()
    }),

    leaderboard: z.object({
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50, "Limit must be 1-50").optional()
    })
  }
};

// Enhanced validation middleware with comprehensive error reporting
export function validateRequestComprehensive(schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
  files?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any[] = [];

    try {
      // Validate request body
      if (schema.body && req.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          errors.push({
            location: 'body',
            errors: result.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          });
        } else {
          req.body = result.data;
        }
      }

      // Validate request parameters
      if (schema.params && req.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          errors.push({
            location: 'params',
            errors: result.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          });
        } else {
          req.params = result.data;
        }
      }

      // Validate query parameters
      if (schema.query && req.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          errors.push({
            location: 'query',
            errors: result.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          });
        } else {
          req.query = result.data;
        }
      }

      // Validate files
      if (schema.files && req.file) {
        const result = schema.files.safeParse(req.file);
        if (!result.success) {
          errors.push({
            location: 'file',
            errors: result.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          });
        }
      }

      // Return validation errors if any
      if (errors.length > 0) {
        console.warn(`🚫 Validation failed for ${req.method} ${req.path}:`, errors);
        return res.status(400).json({
          error: "Validation failed",
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          details: errors
        });
      }

      next();
    } catch (error) {
      console.error(`💥 Validation middleware error:`, error);
      res.status(500).json({
        error: "Validation system error",
        statusCode: 500,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Input sanitization with SQL injection prevention
export function sanitizeInputComprehensive(req: Request, res: Response, next: NextFunction) {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error(`💥 Input sanitization error:`, error);
    res.status(500).json({
      error: "Input processing error",
      statusCode: 500
    });
  }
}

// Enhanced sanitization function
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return obj
      // XSS protection
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      // SQL injection protection
      .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\b)/gi, '')
      // Trim whitespace
      .trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}