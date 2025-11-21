# Second Chance - Startup Validation Platform

## Overview
Second Chance is a startup validation platform that empowers entrepreneurs through intelligent document processing, advanced error management, and user-centric design. It aims to generate revenue via premium features like Deal Room access, while providing valuable insights and a clear pathway for startups based on their ProofScore. The platform utilizes a modern tech stack for scalability, security, and a seamless user experience.

## User Preferences
- Communicate in simple, everyday language
- Avoid technical jargon in user-facing content
- Focus on user journey and experience
- Maintain professional tone without emojis
- Remove technical language from user notifications (e.g., replaced "JWT token invalidated" with user-friendly logout messages)
- Always share checkpoint message summary after completing work for manual update by user
- localStorage keys should not include user-specific identifiers (e.g., founderId) for simplicity

## System Architecture

### UI/UX Decisions
The platform features a dark theme with purple and gold color schemes, gradient styling, and consistent branding. Interactive elements like hover effects, animated statistics, and floating background elements enhance user engagement. Visual components are built for reusability and maintainability.

### Technical Implementations
The frontend uses TypeScript React with Vite, React Query for state management, and Tailwind CSS with shadcn/ui components. The backend is an Express.js serverless application with JWT-based authentication and Drizzle ORM.

Key technical decisions include:
- **Clean Unified Encryption Standard (AES-256-GCM)**: Consistent encryption/decryption across frontend and backend for secure communication.
- **Score-Based Routing**: Users are routed to `/deal-room` or `/proof-scaling` based on their ProofScore (threshold at 70 points).
- **Component-Based Design**: Reusable UI components reduce code duplication.
- **Payment Integration**: Secure processing for premium features via PayTabs (primary) and Telr (secondary) gateways, supporting multi-region, dynamic currency, and detailed invoice generation.
- **Enhanced Error Handling**: Sophisticated retry logic and detailed error categorization.
- **End-to-End Encryption**: Transparent payload encryption for API communications using AES-256-GCM with feature flags.
- **Dashboard Architecture**: `/dashboard` is production, `/dashboard-v1` is for development.
  - **Smart Loading Optimization (Nov 20, 2025)**: Dashboard uses lazy-initialized loading state that checks for existing auth token in localStorage. Returning users skip the loading skeleton entirely while auth verification and data refresh happen in background, eliminating loading screen when navigating back from validation map or other pages.
  - **React Query Caching & Memoization (Nov 21, 2025)**: Dashboard data fetching optimized to dramatically reduce database hits through aggressive caching and smart invalidation:
    - **Separate Query Streams**: Four independent React Query queries (validation, vault, leaderboard, deal room access) with JWT-aware fetchers prevent blocking dependencies
    - **Aggressive Cache Timings**: Validation/vault (10min staleTime, 30min gcTime), leaderboard (5min, 15min), deal room (15min, 60min) minimize redundant database queries
    - **Smart Invalidation**: File uploads invalidate only vault queries, payments invalidate only deal room access, experiments invalidate validation data—no full dashboard reloads
    - **Predicate-Based Cache Targeting**: Invalidation uses predicates to match partial query keys, correctly handling array-segment keys like ['/api/v1/leaderboard', 5]
    - **Safe Cache Setters**: setHasDealRoomAccess/setVentureStatus guard against undefined cache values, returning sensible defaults during cold-start flows
    - **Component Memoization**: ValidationOverview uses useMemo for all proofScore-dependent calculations (statusText, primaryText, secondaryText, progressPercentage) to prevent unnecessary re-renders
    - **Navigation Performance**: Users can navigate between dashboard pages without triggering fresh API calls—cached data loads instantly while background revalidation ensures freshness
- **Unified Logging Architecture**: Standardized `appLogger` for comprehensive, structured logging across the platform.
- **Simplified localStorage Keys (Nov 21, 2025)**: Removed user-specific identifiers from coach-related localStorage keys:
  - Changed from `coach_state_${founderId}` to `coach_state`
  - Changed from `coach_mode_first_seen_${founderId}` to `coach_mode_first_seen`
  - Simplified cleanup logic across all logout/auth error handlers
  - Maintains same functionality with cleaner, more maintainable code
- **Environment-Based Email Logo Configuration**: Email templates dynamically use `LOGO_URL` from environment variables.
- **Live Exchange Rate Integration**: Real-time USD to AED conversion using multiple fallback APIs and caching.

### Feature Specifications
- **Deal Room Access**: Provides qualified users (ProofScore >= 70) access to investor matching for a one-time fee.
- **ProofScaling Sales Page**: Tailored guidance for startups with ProofScores below 70.
- **Direct Pathway Routing**: Routes users directly to relevant sales pages post-analysis.
- **Premium Download Features**: Report and file downloads are payment-gated.
- **Comprehensive Payment Activity Tracking**: Logs all payment-related user interactions.
- **Team Notification System**: Automated email and Slack notifications for Deal Room purchases.
- **Dual Payment Email System**: Users receive immediate payment confirmation and a subsequent investor matching email.
- **ProofScaling Wishlist System**: Tracks cohort interest with a database schema for founder contact details.
- **Growth Stage Tracking**: Automatic extraction and storage of founder growth stage from pitch deck scoring.
- **Validation Map System**: Interactive experiment tracking interface for business idea validation across 4 spheres (Desirability, Viability, Feasibility, Scaling) with inline editing, auto-save, and score calculation.
- **ProofTags System**: Centralized achievement tracking automatically populated from EastEmblem API and updated upon experiment completion.
- **ProofCoach Intelligent Guidance System**: Dual-mode AI coaching with Tutorial Mode (anonymous, client-side tracking) and Coach Mode (authenticated, 21-step milestone journey from dashboard onboarding to investment readiness). Coach Mode features dynamic messaging based on ProofScore, a checkbox-based todo list UI, confetti animations for major achievements, click-to-highlight navigation (smooth scroll + 2-second pulse animation to highlight corresponding dashboard sections), and dark theme styling (bg-gray-900/95 with purple accents) for consistency with platform aesthetic.
  - **Tutorial Mode Enhancement (Nov 2025)**: Comprehensive field-level guidance across all onboarding pages with 30+ tutorial steps, including:
    - Venture page: Separate tutorial steps for Geography (order 5), Product Status (order 8), and Revenue Stage (order 7) fields for precise field-level targeting
    - Team page: Added 5 new tutorial steps covering social media profiles (order 8), demographics (order 9), background information (order 10), and co-founder status (order 11)
    - Analysis page: New tutorial steps for Key Insights section (order 4), Leaderboard rankings (order 5), and "See My Pathway" CTA (order 6)
    - Next-steps page: Complete 3-step tutorial flow covering pathway orientation, payment CTA, and email follow-up guidance
  - **Tutorial Mechanics**: All tutorial steps use data-testid attributes for precise element targeting with 300ms navigation delay and visual pulse effects; confetti animation remains contextual without forced tutorial step to preserve delight moment
  - **Backend-Driven Task Completion (Nov 2025)**: Coach Mode task completion logic migrated from client-side localStorage defaults to server-driven progress calculation:
    - **Upload Source Tracking**: Added `uploadSource` field to `document_upload` table to distinguish 'onboarding' pitch deck uploads from 'proof-vault' uploads
    - **Progress API**: `/api/v1/coach/progress` endpoint calculates real-time metrics from database queries (completed experiments, ProofVault uploads, distinct artifact types, Deal Room access)
    - **Accurate Task Tracking**: Tasks auto-complete based on actual database state rather than mock localStorage data, preventing false completion across user sessions
    - **Separation of Concerns**: `vaultUploadCount` tracks ProofVault uploads only (excludes onboarding), `totalUploads` counts all uploads, `distinctArtifactTypesCount` counts unique artifact types for milestone tracking
  - **Event-Driven Progress Tracking (Nov 2025)**: Event-sourced architecture where `user_activity` is the immutable source of truth, with events aggregated into `coach_state` via CoachProgressService for deterministic progress tracking:
    - **Complete Journey Mapping**: All 31 ProofCoach journey steps (0-30) mapped to completion events in JOURNEY_STEP_COMPLETION_EVENTS
    - **Milestone Emissions**: Automated event logging for vault uploads (1, 10, 20, 30, 50 files), ProofScore thresholds (65+, 70+, 80+), experiment completions (1, 3, 5), and feature unlocks (Deal Room, downloads, community)
    - **Venture-Scoped Deduplication**: Milestone duplicate prevention checks scoped by both founderId AND ventureId to prevent cross-venture event duplication
    - **Comprehensive Event Coverage**: Events tracked for dashboard visits, validation map views, certificate/report downloads, Deal Room purchases, and all user journey milestones
    - **Activity Service Integration**: All events logged through ActivityService with proper context (activityType, action, metadata, entityId, entityType) for deterministic state calculation
    - **Hybrid Data Architecture (Nov 20, 2025)**: CoachProgressService.calculateProgress() uses a hybrid approach combining real database queries with event-based milestone tracking:
      - **Real Data Queries**: Counts from source tables (ventures, document_upload, ventureExperiments) for accurate metrics (vaultUploadCount, completedExperimentsCount, proofScore, vaultScore)
      - **Event-Based Milestones**: Milestone flags (hasFirstUpload, has10Uploads, hasReached70Score) tracked via user_activity events
      - **Onboarding Status**: Determined by venture.proofScore > 0 instead of event-based tracking
      - **Performance Optimized**: Parallel database queries with proper venture/founder scoping for accurate per-venture progress
    - **Activity Logging API (Nov 20, 2025)**: Added POST /api/v1/activity/log endpoint for client-side event tracking:
      - **Payment Event Scoping**: DEAL_ROOM_PURCHASED and COMMUNITY_ACCESSED events now include ventureId by querying founder's current venture
      - **Download Event Tracking**: Certificate and report downloads emit events (certificate_downloaded, report_downloaded) via fire-and-forget API calls
      - **Community Access Tracking**: Calendly booking clicks emit community_accessed events to mark ProofCoach step 26 complete
      - **Browser Popup Preservation**: window.open() executes before async logging to maintain user gesture context and prevent popup blocking
      - **Error Resilience**: Event logging failures don't affect user flows - downloads and links work even if tracking fails
      - **ProofCoach Integration**: Events properly map to journey steps (23: payment completion, 24: certificate download, 25: report download, 26: community access via Calendly)

### System Design Choices
The system prioritizes a modular, component-driven frontend and a serverless backend for scalability. Drizzle ORM ensures type-safe database interactions. The email service is designed for flexibility.

#### Notification Architecture
A comprehensive payment notification system integrates with payment routes, service checks, and webhooks, utilizing the East Emblem API for Slack notifications and graceful error handling.

#### Security Architecture
- **Data Protection**: End-to-end encryption using AES-256 symmetric encryption.
- **Encryption Standards**: AES-256 symmetric encryption with session-based key derivation.
- **Middleware Integration**: Transparent encryption layer integrated with JWT authentication.
- **Performance Optimized**: Minimal latency impact through efficient key management.

## External Dependencies
- **PayTabs Payment Gateway**
- **Telr Payment Gateway**
- **PostgreSQL**
- **Eastemblem API**
- **Slack**