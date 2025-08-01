# Second Chance - ProofScaling Validation Platform

## Overview
Second Chance is a startup validation platform designed to assess investment readiness. It leverages AI-powered document analysis and a structured scoring framework to provide actionable insights and personalized pathways for founders. The platform aims to revolutionize how entrepreneurs validate their ventures, offering comprehensive analysis to improve their chances of success and attract investment.

## User Preferences & Communication

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

### Agent Memory Optimization (Updated: 2025-08-01)
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
- **Payment System**: Generic payment gateway abstraction layer with factory pattern supporting multiple providers (currently Telr implemented).

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless.

### Key Features
- **Onboarding Flow**: Complete multi-step wizard (Founder, Venture, Team, Document Upload, Analysis Results, Payment) with back navigation and session-based payment integration.
- **ProofScore System**: Comprehensive 5-dimension scoring (Desirability, Feasibility, Viability, Traction, Readiness), each max 20 points.
- **Pathway Recommendations**: Personalized development pathways based on ProofScore (ProofScaling course <70, investor matching ≥80).
- **ProofVault Integration**: Document management with AI-powered pitch deck analysis, structured folder creation, and handling of single/multiple file/folder uploads (preserving hierarchy).
- **Email Communication System**: 11 responsive HTML email templates for user engagement and automated notifications.
- **Simulation Engine**: Demo experience for testing user journeys with dynamic score generation.
- **Activity Tracking**: Real-time logging of user actions (authentication, file uploads, onboarding, payments).
- **Payment Gateway System**: Generic payment architecture supporting multiple providers with hosted payment page solution, comprehensive transaction management, webhook/callback processing, and automated status page redirects.

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

## Recent Project Context & Memory

### Current Status (Updated: 2025-08-01 - Latest)
- **Application Health**: ✅ **REBUILT & RUNNING** - Server fully functional on port 5000, fresh build deployed with payment optimizations
- **Onboarding Flow with Payment**: ✅ **COMPLETED** - Added payment step back to onboarding flow using session-based `/api/payment/create-next-steps-session` endpoint
- **Cache Invalidation System**: Comprehensive cache invalidation implemented for V1 routes only
- **Activity Logging System**: V1 upload and folder creation endpoints now log activities for real-time dashboard updates
- **Architecture**: EastEmblem API proxy eliminates need for direct Box SDK integration
- **Payment System**: ✅ **DUAL AUTHENTICATION ARCHITECTURE COMPLETED** - Session-based payment routes (`/api/payment/*`) for onboarding flow, JWT-protected routes (`/api/v1/payment/*`) preserved for future dashboard payments
- **Browser Caching Issue**: ✅ **RESOLVED** - Root cause was automatic URL conversion in queryClient.ts that converted all `/api/` requests to `/api/v1/`, bypassed with payment route exemption
- **Telr Currency Configuration**: ✅ **RESOLVED** - "E05:Transaction cost or currency not valid" error resolved by switching from USD to AED currency with proper conversion ($100 USD = 367 AED)
- **Authentication Flow**: ✅ **WORKING** - Onboarding payment flow now uses session-based authentication correctly, V1 routes preserved for future dashboard functionality
- **Payment Storage**: ⚠️ **IN-MEMORY ONLY** - Payment transactions stored temporarily in Map() for development; database tables exist but not integrated with new payment flow
- **Payment UX Enhancement**: ✅ **NEW TAB FLOW IMPLEMENTED** - Telr opens in new tab, payment status polling every 10s, users remain on onboarding page with real-time status updates
- **Payment Flow Optimization**: ✅ **MOVED TO STEP 2** - Payment now occurs after founder details (step 2) instead of step 7 for faster testing, shows early access Foundation package
- **Payment Verification Fix**: ✅ **CALLBACK SYSTEM IMPLEMENTED** - Fixed Telr callback handling with session-based `/api/payment/callback/telr` endpoint for proper payment status updates
- **Data Utilization**: 85% of rich scoring API data still unused - opportunity for enhancement
- **Production Security**: Environment-based protection implemented for test endpoints and debug routes

### Unused Secrets Analysis (2025-08-01)
**Safe to Remove (7 total):**
- `LOGO_URL` - Never referenced in codebase
- `NEW_RELIC_APP_NAME` - Has hardcoded fallback value
- `BOX_PUBLIC_KEY_ID` - Not needed due to EastEmblem proxy
- `BOX_PRIVATE_KEY` - Not needed due to EastEmblem proxy  
- `BOX_ENTERPRISE_ID` - Not needed due to EastEmblem proxy
- `BOX_PASSPHRASE` - Not needed due to EastEmblem proxy
- `BOX_PRIVATE_KEY_BASE64` - Not needed due to EastEmblem proxy

**Impact Assessment**: Minimal to zero codebase impact from removal

### Architecture Decisions
- **Box Integration**: Using EastEmblem API as Box.com proxy instead of direct Box SDK
- **Payment Gateway**: Generic factory pattern with Telr implementation
- **Monitoring**: Dual system (Sentry + NewRelic) with graceful fallbacks
- **Authentication**: JWT-based with session management
- **File Management**: ProofVault integration through EastEmblem proxy
- **Cache Invalidation**: Event-driven invalidation for V1 routes only (file uploads, folder creation, activity logging, onboarding)

### Development Patterns
- **Error Handling**: Comprehensive error boundaries and graceful degradation
- **Performance**: 3-phase optimization completed (75% load time reduction)
- **Database**: Drizzle ORM with PostgreSQL, migration via `npm run db:push`
- **Frontend**: React Query for state management, shadcn/ui components
- **Build System**: Vite frontend, esbuild server, no Docker/containers

### Next Priorities
- Score-based payment integration on analysis page
- Utilization of unused scoring API data (venture context, team analysis, traction signals)
- Payment section implementation with Telr hosted page flow
- Enhanced user experience based on ProofScore results

### Security Implementations (Updated: 2025-08-01)
**Environment Protection Strategy**: Complete isolation of development resources from production
**Frontend Security**: Test routes (sentry-test, performance-test, routing-debug, payment-test, reset-password-debug) conditionally rendered using `import.meta.env.MODE === 'development'`
**Backend Security**: Test endpoints (/api/newrelic-test, /api/onboarding/trigger-email-flow) protected with `process.env.NODE_ENV !== 'production'` guards
**Security Infrastructure**: Environment protection middleware created for systematic protection of sensitive endpoints
**Production Readiness**: Platform secured against accidental exposure of development tools and system internals in production deployment

### Cache Invalidation Implementation (2025-08-01)
**Scope**: V1 routes only (user preference for targeted implementation)
**Strategy**: Event-driven cache invalidation with graceful error handling

**Cache Invalidation Triggers:**
- **File Upload** (V1 vault upload, direct upload) → Logs activity + Invalidates `vault_{founderId}` + `activity_{founderId}`
- **Folder Creation** (V1 vault create-folder) → Logs activity + Invalidates `vault_{founderId}`  
- **Activity Logging** (ActivityService) → Invalidates `activity_{founderId}`
- **Founder Creation** (V1 onboarding) → Invalidates `founder_{founderId}`
- **Venture Creation** (V1 onboarding) → Invalidates `founder_{founderId}` + `venture_{ventureId}` + `vault_{founderId}`

**Activity Logging Integration:**
- **V1 File Upload** → Creates "file_uploaded" activity with file details
- **V1 Direct Upload** → Creates "file_uploaded" activity with folder information
- **V1 Folder Creation** → Creates "folder_created" activity with category context

**Implementation Details:**
- Graceful error handling (cache failures don't break core functionality)
- LRU + KV cache dual invalidation
- Console logging for cache operations
- Activity-driven cache updates ensure real-time data freshness