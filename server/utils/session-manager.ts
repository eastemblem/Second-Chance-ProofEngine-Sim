// Session management utilities
import { Request } from "express";
import crypto from "crypto";
import { appLogger } from "./logger";

export function getSessionId(req: Request): string {
  // Always generate a valid UUID for onboarding sessions
  // Express session IDs are not UUID format and won't work with our database schema
  
  // Try to get session ID from headers first (for API calls with proper UUIDs)
  let sessionId = req.headers['x-session-id'] as string;
  
  // Validate if it's a proper UUID, if not generate a new one
  if (!sessionId || !isValidUUID(sessionId)) {
    sessionId = crypto.randomUUID();
  }
  
  return sessionId;
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function getSessionData(sessionId: string): Promise<any> {
  // This would typically connect to session store
  // For now, return a mock structure for business logic testing
  return {
    folderStructure: {
      subfolders: [
        { id: '332844784735', name: 'Overview' },
        { id: '332844933261', name: 'Problem Proofs' },
        { id: '332842993678', name: 'Solution Proofs' },
        { id: '332843828465', name: 'Demand Proofs' },
        { id: '332843291772', name: 'Credibility Proofs' },
        { id: '332845124499', name: 'Commercial Proofs' },
        { id: '332842251627', name: 'Investor Pack' }
      ]
    }
  };
}

export async function updateSessionData(sessionId: string, data: any): Promise<void> {
  // This would typically update session store
  appLogger.auth(`Session ${sessionId} updated with data`);
}