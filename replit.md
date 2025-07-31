# Second Chance - ProofScaling Validation Platform

## Overview
Second Chance is a startup validation platform designed to assess investment readiness. It leverages AI-powered document analysis and a structured scoring framework to provide actionable insights and personalized pathways for founders. The platform aims to revolutionize how entrepreneurs validate their ventures, offering comprehensive analysis to improve their chances of success and attract investment.

## User Preferences
Preferred communication style: Simple, everyday language.

**Development Communication Pattern**:
- Apply question-first approach to all technical development tasks
- Before implementing any feature or fix, ask relevant counter-questions to gather context
- Only proceed after asking "Do you want me to ask more questions, or should I proceed with the answer?"
- This approach reduces unnecessary work and produces better outputs by understanding requirements fully
- Continue this pattern throughout entire conversation

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theme and gradient utilities
- **Animations**: Framer Motion for smooth transitions
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Performance**: 3-phase optimization (75% load time reduction), code splitting, lazy loading, memory optimization, critical CSS inlining, service worker caching, chunk preloading.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Build System**: Vite for frontend, esbuild for server
- **File Uploads**: Multer for multipart form data
- **API Integration**: Custom EastEmblem API client
- **Route Architecture**: Modular, domain-based structure with standardized middleware and V1 API versioning.
- **Performance Monitoring**: Request tracking, memory monitoring, query optimization.

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless.

### Key Features
- **Onboarding Flow**: Multi-step wizard (Founder, Venture, Team, Document Upload, Analysis Results).
- **ProofScore System**: Comprehensive 5-dimension scoring (Desirability, Feasibility, Viability, Traction, Readiness), each max 20 points.
- **ProofVault Integration**: Document management with AI-powered pitch deck analysis, structured folder creation, and handling of single/multiple file/folder uploads (preserving hierarchy).
- **Email Communication System**: 11 responsive HTML email templates for user engagement and automated notifications.
- **Simulation Engine**: Demo experience for testing user journeys with dynamic score generation.
- **Activity Tracking**: Real-time logging of user actions (authentication, file uploads, onboarding).

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
- **EastEmblem API**: Document analysis and scoring service, email delivery service.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment platform.
- **Sentry**: Error tracking system.
- **NewRelic**: Performance monitoring.