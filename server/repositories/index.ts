/**
 * Repository Pattern Implementation
 * Centralized data access layer with caching and error handling
 */

import { FounderRepository } from "./founder-repository";
import { VentureRepository } from "./venture-repository";
import { EvaluationRepository } from "./evaluation-repository";
import { DocumentRepository } from "./document-repository";

// Singleton instances
export const founderRepository = new FounderRepository();
export const ventureRepository = new VentureRepository();
export const evaluationRepository = new EvaluationRepository();
export const documentRepository = new DocumentRepository();

// Export repository classes for type checking
export {
  FounderRepository,
  VentureRepository,
  EvaluationRepository,
  DocumentRepository
};

// Export base repository for extending
export { BaseRepository } from "./base-repository";

/**
 * Repository pattern benefits:
 * 1. Centralized data access logic
 * 2. Consistent caching strategy
 * 3. Standardized error handling
 * 4. Easy to test and mock
 * 5. Clean separation of concerns
 */