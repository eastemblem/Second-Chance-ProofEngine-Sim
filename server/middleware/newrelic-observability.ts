// NewRelic observability middleware (simplified for ES module compatibility)
import { Request, Response, NextFunction } from "express";

// Simplified NewRelic middleware (disabled for ES module compatibility) 
export function newRelicMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip NewRelic entirely in ES module environment - will configure later
  next();
}

// Simplified business metrics tracking (disabled for ES module compatibility)
export function trackBusinessMetrics(req: Request, res: Response, next: NextFunction) {
  // Skip business metrics tracking in ES module environment - will configure later
  next();
}

// Helper function for transaction naming (disabled)
function getTransactionName(path: string, method: string): string {
  // Simplified transaction naming
  return `${method} ${path}`;
}

// Helper function to configure NewRelic (disabled for ES module)
export function configureNewRelic() {
  // Skip NewRelic configuration in ES module environment
  console.log('📊 NewRelic configuration skipped - ES module compatibility');
}