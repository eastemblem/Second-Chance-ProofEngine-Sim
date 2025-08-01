# Second Chance - ProofScaling Validation Platform

## Overview
Second Chance is a startup validation platform that assesses investment readiness. It uses AI-powered document analysis and a structured scoring framework to provide insights and personalized pathways for founders. The platform aims to help entrepreneurs validate their ventures, improve their chances of success, and attract investment.

## User Preferences
### Communication Style
- **Primary Style**: Simple, everyday language
- **Technical Level**: Non-technical user - avoid code details and technical jargon
- **Response Format**: Calm, supportive tone with measured, professional language
- **Documentation**: Focus on outcomes and impacts rather than implementation details

### Development Communication Pattern
- Apply question-first approach to all technical development tasks
- Before implementing any feature or fix, ask relevant counter-questions to gather context
- Only proceed after asking "Do you want me to ask more questions, or should I proceed with the answer?"
- This approach reduces unnecessary work and produces better outputs by understanding requirements fully
- Continue this pattern throughout entire conversation

### Agent Memory Optimization
- **Context Management**: Use targeted file searches and focused information sharing
- **Session Continuity**: Document decisions and progress in this file for future sessions
- **Concurrent Operations**: Execute multiple tools simultaneously to reduce back-and-forth
- **Documentation Priority**: Update this file with architectural changes and user preferences immediately

### Cache Management Requirements
- Always clear build cache when UI files change to ensure changes are immediately visible
- Use `rm -rf dist .vite && npm run build` or run `./clear-cache.sh` script
- Restart workflow after cache clearing for UI changes to take effect
- This is critical for frontend development workflow

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
- **Payment System**: Generic payment gateway abstraction layer with factory pattern supporting multiple providers.

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless.

### Key Features
- **Onboarding Flow**: Multi-step wizard (Founder, Venture, Team, Document Upload, Analysis Results, Payment) with back navigation and session-based payment integration.
- **ProofScore System**: Comprehensive 5-dimension scoring (Desirability, Feasibility, Viability, Traction, Readiness), each max 20 points.
- **Pathway Recommendations**: Personalized development pathways based on ProofScore (ProofScaling course <70, investor matching ≥80).
- **ProofVault Integration**: Document management with AI-powered pitch deck analysis, structured folder creation, and handling of single/multiple file/folder uploads (preserving hierarchy).
- **Email Communication System**: 11 responsive HTML email templates for user engagement and automated notifications.
- **Simulation Engine**: Demo experience for testing user journeys with dynamic score generation.
- **Activity Tracking**: Real-time logging of user actions (authentication, file uploads, onboarding, payments).
- **Payment Gateway System**: Generic payment architecture supporting multiple providers with hosted payment page solution, comprehensive transaction management, webhook/callback processing, and automated status page redirects.

### Architecture Decisions
- **Box Integration**: Using EastEmblem API as Box.com proxy instead of direct Box SDK.
- **Payment Gateway**: Generic factory pattern with Telr implementation.
- **Monitoring**: Dual system (Sentry + NewRelic) with graceful fallbacks.
- **Authentication**: JWT-based with session management.
- **File Management**: ProofVault integration through EastEmblem proxy.
- **Cache Invalidation**: Event-driven invalidation for V1 routes only (file uploads, folder creation, activity logging, onboarding).

### Security Implementations
- **Environment Protection Strategy**: Complete isolation of development resources from production.
- **Frontend Security**: Test routes conditionally rendered using `import.meta.env.MODE === 'development'`.
- **Backend Security**: Test endpoints protected with `process.env.NODE_ENV !== 'production'` guards.
- **Security Infrastructure**: Environment protection middleware created for systematic protection of sensitive endpoints.

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
- **Telr Payment Gateway**: Primary payment processor with hosted payment page solution, webhook verification, and automated callback handling.