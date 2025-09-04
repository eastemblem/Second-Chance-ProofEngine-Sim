import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { createErrorResponse } from "../utils/error-handler";

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
          return res.status(400).json(createErrorResponse(400, "Invalid request body", "VALIDATION_ERROR", result.error.errors));
        }
        req.body = result.data;
      }

      // Validate request parameters
      if (schema.params && req.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json(createErrorResponse(400, "Invalid request parameters", "VALIDATION_ERROR", result.error.errors));
        }
        req.params = result.data;
      }

      // Validate query parameters
      if (schema.query && req.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json(createErrorResponse(400, "Invalid query parameters", "VALIDATION_ERROR", result.error.errors));
        }
        req.query = result.data;
      }

      next();
    } catch (error) {
      res.status(500).json(createErrorResponse(500, "Validation error", "INTERNAL_ERROR", error instanceof Error ? error.message : 'Unknown error'));
    }
  };
}

// Authentication validation middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const founderId = req.session?.founderId;
  
  if (!founderId) {
    return res.status(401).json(createErrorResponse(401, "Authentication required", "AUTH_REQUIRED"));
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