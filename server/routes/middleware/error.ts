import { Request, Response, NextFunction } from 'express';

// Standard error handler that preserves existing error response format
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error);
  
  // Preserve existing error response format
  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// Async wrapper to catch promise rejections
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};