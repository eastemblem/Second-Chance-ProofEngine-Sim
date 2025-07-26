import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Request validation middleware factory
export function validateRequest(schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body && req.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid request body",
            details: result.error.errors
          });
        }
        req.body = result.data;
      }

      // Validate request parameters
      if (schema.params && req.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid request parameters",
            details: result.error.errors
          });
        }
        req.params = result.data;
      }

      // Validate query parameters
      if (schema.query && req.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json({
            error: "Invalid query parameters", 
            details: result.error.errors
          });
        }
        req.query = result.data;
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: "Validation error",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// File upload validation schema
export const fileUploadSchema = z.object({
  originalname: z.string().min(1, "Filename is required"),
  mimetype: z.string().min(1, "File type is required"),
  size: z.number().positive("File size must be positive"),
  buffer: z.any().optional(),
  path: z.string().optional()
});

// Authentication validation middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const founderId = req.session?.founderId;
  
  if (!founderId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  next();
}

// File upload validation schemas
export const fileUploadSchema = z.object({
  category: z.string().min(1, "Category is required")
});

export const folderCreateSchema = z.object({
  folderName: z.string().min(1, "Folder name is required"),
  parentCategory: z.string().min(1, "Parent category is required")
});

// Dashboard parameter schemas
export const dashboardParamsSchema = z.object({
  founderId: z.string().uuid("Invalid founder ID format")
});

export const founderIdSchema = z.object({
  founderId: z.string().min(1, "Founder ID is required")
});