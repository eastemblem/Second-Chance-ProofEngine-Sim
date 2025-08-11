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

### Recent UI Improvements (Aug 2025)
- **Payment Page Layout**: Updated to show "What's Included" and "Expected Outcomes" side by side in responsive grid
- **Payment Button**: Reduced size and changed text to "Make Payment" for better UX
- **Theme Consistency**: Applied dark theme across all payment pages to match app design system
- **Navigation**: Simplified button labels and removed dashboard references in payment flow
- **Onboarding Flow Restructure**: Moved payment step to final position (after analysis) for better user experience - users now see ProofScore results before payment options
- **Progress Bar Updates**: Renamed final step from "Investment Package" to "Next Steps" for clearer navigation
- **ProofScore Integration**: Payment page prominently displays user's ProofScore and provides score-based package recommendations

### Comprehensive Error Handling System (Aug 11, 2025)
- **Dynamic API Error Messages**: System displays actual error messages from EastEmblem API instead of hardcoded text
- **Image-based PDF Detection**: Enhanced error handling specifically for image-based PDFs that cannot be processed
- **Database Error Tracking**: Added error tracking fields (error_message, retry_count, max_retries, can_retry) to document upload schema
- **User-Friendly Navigation**: "Upload Different File" button navigates back to upload step for file format errors
- **Error Type Classification**: System distinguishes between retryable errors (server issues) and user action required errors (file format issues)
- **Critical Flow Prevention**: Fixed logic to prevent automatic progression to analysis page with 0 score when processing errors occur
- **Smart Retry Logic**: "Try Again" button behavior depends on error type - navigates back to upload for file format issues, retries processing for server errors
- **Complete Error Chain**: API error → backend preservation → database storage → frontend detection → appropriate user navigation flow
- **Retry Limit System**: Maximum 3 retry attempts with clear counter display (1/3, 2/3, etc.) and disabled state when limit reached
- **Smart Counter Logic**: Retry counter increments on all processing errors and displays current attempt status to users
- **Session-Persisted Counter**: Retry count persists across navigation steps and stored in session data to prevent reset on re-upload
- **Streamlined Error Messages**: Removed duplicate instruction text as API error messages already contain user guidance
- **Simple Counter File Upload**: Implemented clean counter-based filename system (deck.pdf → deck-1.pdf → deck-2.pdf) replacing complex timestamp approach for better tracking and processing
- **Enhanced File Cleanup**: Added cleanup utility for numbered file versions to prevent accumulation of retry attempts in upload directory
- **Fixed File Processing**: Corrected filename tracking in handleDocumentUpload to use multer's generated filename instead of original name for proper file processing
- **Enhanced Error Flow Control**: Prevented report generation and analysis page access when scoring API fails, ensuring users cannot proceed with invalid results

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