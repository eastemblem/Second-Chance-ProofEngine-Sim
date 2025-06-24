# Second Chance - ProofScaling Validation Platform

## Overview

Second Chance is a startup validation platform that helps entrepreneurs assess their investment readiness through comprehensive analysis. The application combines AI-powered document analysis with a structured scoring framework to provide founders with actionable insights and personalized pathways to improve their ventures.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Hooks with custom simulation state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme and gradient utilities
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Performance Optimizations**: 
  * 3-phase optimization achieving 75% load time reduction (40s → 6-10s)
  * Code splitting with lazy loading for page components
  * Chart components lazy loaded to reduce initial bundle  
  * Memory optimization with cleanup utilities
  * Critical CSS inlining and service worker caching
  * Chunk preloading and resource hints for optimal loading

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Build System**: Vite for frontend bundling, esbuild for server compilation
- **File Uploads**: Multer for handling multipart form data
- **External API Integration**: Custom EastEmblem API client for document analysis

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Onboarding Flow
Multi-step wizard collecting founder and venture information:
1. **Founder Details**: Personal information, experience, technical background
2. **Venture Information**: Company details, industry, revenue stage, MVP status
3. **Team Members**: Optional team member addition (up to 4 members)
4. **Document Upload**: Pitch deck upload and processing
5. **Processing Screen**: Real-time analysis progress
6. **Analysis Results**: ProofScore presentation and insights

### ProofScore System
Comprehensive scoring framework evaluating five dimensions:
- **Desirability**: Market demand and problem validation (max 20 points)
- **Feasibility**: Technical and execution capability (max 20 points)
- **Viability**: Business model and financial sustainability (max 20 points)
- **Traction**: Customer acquisition and growth metrics (max 20 points)
- **Readiness**: Investment and scaling preparedness (max 20 points)

### ProofVault Integration
Document management and analysis system:
- Structured folder creation for different proof categories
- AI-powered pitch deck analysis and scoring
- File upload handling with validation and processing
- Integration with external analysis APIs

### Simulation Engine
Demo experience for testing different user journeys:
- Named founder profiles with predetermined scores
- Dynamic score generation based on application history
- Customizable pathways for different experience flows

## Data Flow

1. **User Onboarding**: Multi-step form data collection with session persistence
2. **Document Processing**: File upload → External API analysis → Score calculation
3. **ProofScore Generation**: Combined analysis of form data and document insights
4. **Pathway Recommendation**: Score-based routing to appropriate next steps
5. **Results Presentation**: Interactive dashboard with detailed feedback

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection and pooling
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: UI component primitives
- **framer-motion**: Animation library
- **multer**: File upload handling
- **zod**: Runtime type validation

### Development Dependencies
- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool and dev server
- **esbuild**: Server-side bundling
- **tailwindcss**: Utility-first CSS framework

### External Services
- **EastEmblem API**: Document analysis and scoring service
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development and deployment platform

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend
- **TypeScript Watch**: tsx for server-side hot reloading
- **Database**: Local development with migration support

### Production Build
- **Frontend**: Vite build generating optimized static assets
- **Backend**: esbuild bundling server code for Node.js execution
- **Assets**: Static file serving with Express.js
- **Database**: Automated migrations on deployment

### Platform Configuration
- **Replit Deployment**: Autoscale configuration with port mapping
- **Environment Variables**: Database URL and API credentials
- **File Storage**: Local uploads directory with .gitignore exclusion

## Changelog
- June 24, 2025. Initial setup
- June 24, 2025. Added onboarding_id parameter to all EastEmblem API calls
- June 24, 2025. Added Slack notification endpoint at /api/notification/send
- June 24, 2025. Implemented comprehensive async Slack notifications for all onboarding steps
- June 24, 2025. Removed @slack/web-api package dependency - notifications handled via EastEmblem API
- June 24, 2025. Enhanced Slack notifications with stage-specific messaging for all onboarding steps
- June 24, 2025. Fixed missing onboarding_id parameter in createFolderStructure call
- June 24, 2025. Added allowShare=true parameter to all file upload operations
- June 24, 2025. Updated all Slack notifications to use backtick formatting for onboarding IDs
- June 24, 2025. Implemented comprehensive performance optimizations:
  * Phase 1: Code splitting and lazy loading for page components  
  * Phase 2: Chart lazy loading, memory optimization, resource preloading
  * Phase 3: Advanced optimizations achieving 75% load time reduction
  * Performance monitoring and chunk optimization implemented
  * Production build optimized with vendor splitting
  * LCP improved from 40+ seconds to 5.7-9.9 seconds
  * Advanced optimizations: resource prefetching, memory management, error boundaries
  * Performance boundary implementation for robust optimization delivery
- June 24, 2025. Backend code cleanup and refactoring:
  * Extracted common utilities: validation, error handling, session management
  * Modularized routes into focused modules (founders, ventures, onboarding, vault)
  * Created service layer for business logic separation (onboarding-service, vault-service)
  * Implemented centralized error handling and middleware
  * Reduced main routes.ts from 555 lines to 205 lines (63% reduction)
  * Created comprehensive middleware system with validation and error handling
  * Fixed server compilation issues and restored functionality
  * Added 16 new backend files with focused responsibilities
  * Implemented automatic file cleanup after analysis completion
  * Added periodic cleanup system for old uploaded files (every 6 hours)
  * Fixed venture data access errors with proper null checking and safe property access
  * Fixed "Missing required fields: sessionId" error in venture stage by using session middleware
  * Fixed founder_id null constraint violation by ensuring proper founder ID linkage in venture creation
  * Added comprehensive session handling with fallback initialization for missing sessions
  * Fixed session data storage to properly include founder ID in stepData for venture creation
  * Enhanced debugging with detailed session data logging to trace founder ID propagation
  * Fixed founder_id constraint violation by properly extracting and storing founderId from database
  * Fixed mvp_status constraint violation by mapping productStatus field to database schema
  * Successfully completed full onboarding flow: founder → venture → upload → scoring
  * Cleaned up debug logging and optimized session management code
  * Verified complete integration with EastEmblem API and Slack notifications
  * Added missing team member endpoints: add, get, update, delete, complete
  * Fixed "Not valid json" error in team member operations
  * Implemented complete team management functionality with venture linkage
  * Fixed sessionId "undefined" error in team member GET endpoint with proper validation
  * Added client-side sessionId validation to prevent invalid UUID errors
  * Enhanced error handling for invalid session IDs in team endpoints
  * Fixed session management in team endpoints to accept sessionId from request body
  * Updated team add and complete endpoints to handle both body and middleware session IDs
  * Resolved persistent "Session not found" errors in team member operations

## User Preferences

Preferred communication style: Simple, everyday language.