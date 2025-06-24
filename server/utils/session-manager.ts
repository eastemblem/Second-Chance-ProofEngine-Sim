import { Request } from "express";
import crypto from "crypto";

// Session data interface
export interface SessionData {
  folderStructure?: any;
  uploadedFiles?: any[];
  pitchDeckScore?: any;
  startupName?: string;
  uploadedFile?: {
    filepath: string;
    originalname: string;
    mimetype: string;
    size: number;
  };
  founderData?: {
    fullName?: string;
    email?: string;
    startupName?: string;
    stage?: string;
    acceleratorApplications?: number;
    founderId?: string;
    ventureId?: string;
    positionRole?: string;
    industry?: string;
    geography?: string;
    businessModel?: string;
    [key: string]: any;
  };
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Get session ID from request, create if doesn't exist
 */
export function getSessionId(req: Request): string {
  if (!req.session) {
    throw new Error("Session middleware not configured");
  }
  
  if (!req.session.id) {
    req.session.id = generateSessionId();
  }
  
  return req.session.id;
}

/**
 * Get session data from request
 */
export function getSessionData(req: Request): SessionData {
  if (!req.session) {
    throw new Error("Session middleware not configured");
  }
  
  return req.session.data || {};
}

/**
 * Update session data in request
 */
export function updateSessionData(req: Request, data: Partial<SessionData>): void {
  if (!req.session) {
    throw new Error("Session middleware not configured");
  }
  
  req.session.data = {
    ...req.session.data,
    ...data
  };
}

/**
 * Clear session data
 */
export function clearSessionData(req: Request): void {
  if (!req.session) {
    throw new Error("Session middleware not configured");
  }
  
  req.session.data = {};
}

/**
 * Check if session has required data
 */
export function validateSessionData(req: Request, requiredFields: string[]): boolean {
  const sessionData = getSessionData(req);
  
  return requiredFields.every(field => {
    const value = sessionData[field as keyof SessionData];
    return value !== undefined && value !== null;
  });
}