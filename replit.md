# Second Chance - ProofScaling Validation Platform

## Overview
Second Chance is a startup validation platform designed to assess investment readiness. It leverages AI-powered document analysis and a structured scoring framework to provide founders with insights and personalized pathways, ultimately helping them validate ventures, improve success rates, and attract investment.

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
- **Routing**: Wouter
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query
- **Performance**: 3-phase optimization, code splitting, lazy loading, memory optimization, critical CSS inlining, service worker caching, chunk preloading.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Build System**: Vite for frontend, esbuild for server
- **File Uploads**: Multer
- **API Integration**: Custom EastEmblem API client
- **Route Architecture**: Modular, domain-based structure with standardized middleware and V1 API versioning.
- **Payment System**: Generic payment gateway abstraction layer with factory pattern.

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit
- **Connection**: Connection pooling with @neondatabase/serverless.

### Key Features
- **Onboarding Flow**: Multi-step wizard with back navigation and session-based payment integration.
- **ProofScore System**: Comprehensive 5-dimension scoring (Desirability, Feasibility, Viability, Traction, Readiness), each max 20 points.
- **Pathway Recommendations**: Personalized development pathways based on ProofScore.
- **ProofVault Integration**: Document management with AI-powered pitch deck analysis, structured folder creation, and handling of single/multiple file/folder uploads (preserving hierarchy).
- **Email Communication System**: 11 responsive HTML email templates.
- **Simulation Engine**: Demo experience for testing user journeys.
- **Activity Tracking**: Real-time logging of user actions.
- **Payment Gateway System**: Generic payment architecture with hosted payment page solution, comprehensive transaction management, webhook/callback processing, and automated status page redirects.
- **Comprehensive Error Handling**: Dynamic API error messages, image-based PDF detection, database error tracking, user-friendly navigation for errors, distinction between retryable and user-action errors, critical flow prevention, smart retry logic with limit (3 attempts), session-persisted retry counter, streamlined error messages, clean counter-based filename system for retries, and enhanced file cleanup.

### Architecture Decisions
- **Box Integration**: Using EastEmblem API as Box.com proxy.
- **Payment Gateway**: Generic factory pattern with Telr implementation.
- **Monitoring**: Dual system (Sentry + NewRelic) with graceful fallbacks.
- **Authentication**: JWT-based with session management.
- **File Management**: ProofVault integration through EastEmblem proxy.
- **Cache Invalidation**: Event-driven invalidation for V1 routes only (file uploads, folder creation, activity logging, onboarding).

### Security Implementations
- **Environment Protection Strategy**: Complete isolation of development resources from production.
- **Frontend Security**: Test routes conditionally rendered using `import.meta.env.MODE === 'development'`.
- **Backend Security**: Test endpoints protected with `process.env.NODE_ENV !== 'production'` guards.
- **Security Infrastructure**: Environment protection middleware for systematic protection of sensitive endpoints.
- **Route Security**: Fixed TypeScript errors in server/routes/certificate.ts for type safety, removed invalid database schema fields, implemented safe property access, enhanced parameter validation, eliminated null reference exceptions, and added input sanitization to logging statements.
- **Vault Route Security**: Applied input sanitization to all `console.log` statements containing user data in server/routes/v1/vault.ts to prevent SQL injection warnings and log injection attacks.

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
- **EastEmblem API**: Document analysis and scoring, email delivery.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit**: Development and deployment platform.
- **Sentry**: Error tracking system.
- **NewRelic**: Performance monitoring.
- **Telr Payment Gateway**: Primary payment processor.