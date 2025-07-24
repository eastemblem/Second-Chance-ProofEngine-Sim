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

### Email Communication System
Comprehensive email template system for user engagement:
- 11 responsive HTML email templates with consistent branding
- EastEmblem API integration for reliable email delivery
- Template engine with variable replacement and conditional logic
- Automated onboarding emails with report/certificate downloads
- Progress updates, reminders, and re-engagement campaigns

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
- **EastEmblem Email API**: Email delivery service for all platform notifications
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

## Recent Key Updates

### July 24, 2025 - Complete Environment Variable Configuration & URL Management
- **FRONTEND_URL Environment Variable**: Successfully created and configured FRONTEND_URL for all client-side URLs
- **Dynamic URL Generation**: All email templates now use environment variables for privacy, terms, reset password, and logo URLs
- **Reset Password Page**: Created complete reset password component with purple-gold theme and proper token handling
- **Environment Variable Architecture**: System now uses EASTEMBLEM_API_BASE_URL for webhook endpoints and FRONTEND_URL for client URLs
- **Theme Consistency**: Password reset email template updated with dark purple-gold theme matching the application
- **URL Structure Fixes**: 
  * Privacy URL: `${FRONTEND_URL}/privacy`
  * Terms URL: `${FRONTEND_URL}/terms`  
  * Reset Password URL: `${FRONTEND_URL}/reset-password/${token}`
  * Logo URL: `${FRONTEND_URL}/src/assets/second_chance_logo_1750269371846.png`
- **Deployment Ready**: All hardcoded URLs removed, system now fully configurable for any deployment environment

### July 24, 2025 - N8N Email Webhook Integration & Template Enhancement
- **NEW EMAIL ENDPOINT**: Integrated new N8N webhook endpoint for reliable email delivery using EASTEMBLEM_API_BASE_URL environment variable
- **Enhanced Email Templates**: All email templates now include:
  * Second Chance logo at the top of each email for brand consistency
  * Dynamic privacy and terms URLs ({{PRIVACY_URL}}, {{TERMS_URL}})
  * Current year variable ({{CURRENT_YEAR}}) for footer copyright
  * Proper founder name personalization ({{USER_NAME}}) across all templates
  * Responsive HTML formatting with purple-gold Second Chance branding
- **Improved Email Subjects**: Enhanced email subjects with emojis and compelling copy:
  * Verification: "🔐 Verify Your Email - Complete Your Second Chance Registration"
  * Password Reset: "🔑 Reset Your Password - Second Chance Platform"
  * Welcome: "🎉 Welcome to Second Chance - Your Startup Journey Begins Now!"
  * Onboarding Results: "🎯 Your ProofScore is {score}/100 - Analysis Complete!"
- **Dynamic Email Data**: All emails properly populate founder's email from database and include contextual information
- **Template Consistency**: Updated password-reset.html, onboarding.html, and email-verification.html with consistent branding
- **Email Service Update**: Modified EmailService class to use N8N webhook with proper error handling and dynamic data enrichment

### July 23, 2025 - Certificate & Report Download Fix + Venture Data Integration + Onboarding Field Population
- **FIXED: Certificate and Report Downloads**: Resolved critical download functionality issues with proper venture-specific data integration
- **Authentication System**: Fixed password authentication system with proper bcrypt hashing and database verification
- **Venture Data Flow**: Enhanced `/api/auth/me` endpoint to return founder's latest venture details with certificate/report URLs
- **Download Handler Updates**: Modified download functions to use authentic venture data from user context instead of validation endpoint
- **Database Integration**: Added proper venture-specific URL population and testing infrastructure
- **CRITICAL FIX: Onboarding Field Population**: Fixed onboarding process to properly populate certificate_url, report_url, folder_structure, and generation timestamps during venture creation
  * Added folder_structure persistence to venture table during venture step completion
  * Enhanced scoring process to generate both certificate AND report asynchronously
  * Updated venture records with both URLs and timestamps after generation
  * Resolved issue where fields remained null after onboarding completion
- **Error Resolution**: Fixed all authentication errors, download failures, and onboarding data persistence issues with comprehensive error handling

### July 23, 2025 - Forgot Password System Implementation
- **Complete Forgot Password Feature**: Added comprehensive password reset functionality with email-based token system
- **API Routes**: Implemented `/api/auth/forgot-password` and `/api/auth/reset-password/:token` endpoints
- **Password Reset Email Template**: Created responsive HTML template matching platform's purple-gold theme
- **Frontend Pages**: Built forgot-password.tsx with form validation, success states, and error handling  
- **Email Service Integration**: Added `sendPasswordResetEmail()` method to existing email service
- **Security Features**: 24-hour token expiry, one-time use tokens, secure reset flow without revealing account existence
- **UI Integration**: Added "Forgot Password?" link to login page and updated set-password page for reset scenarios
- **Error Handling**: Comprehensive error states for expired, invalid, and already-used tokens

### July 23, 2025 - Enhanced Dashboard Implementation & Venture-Specific Data
- **Comprehensive Dashboard Redesign**: Transformed simple dashboard into feature-rich founder portal matching provided design mockup
- **Professional Dark Theme**: Black/gray theme with purple-gold accents, responsive two-column layout
- **Personalized Welcome**: Changed "Founder Portal" to personalized "Welcome [Founder Name]" using founder's full name or email prefix
- **Venture-Specific Data Architecture**: 
  * Dashboard now uses latest venture per founder (1 email per founder/venture in production)
  * All certificate, report, and ProofVault data are venture-specific
  * Backend updated with `getFounderVentures()` method to retrieve latest venture
  * Download handlers include venture context in filenames and messaging
- **Validation Overview Section**: 
  * Circular ProofScore indicator with gradient styling (displays venture-specific score)
  * ProofTags progress bar showing unlocked count (11/21) 
  * Files uploaded counter with real-time updates
  * Achievement status messages with award icons
- **Certificate & Report Downloads Section**:
  * Dedicated downloads section with purple-gold gradient theme
  * Certificate download with purple gradient styling and Award icon
  * Analysis report download with yellow/amber gradient styling and FileText icon
  * Hover effects with glow animations and border transitions
  * Venture-specific download URLs and filenames
  * Informational panel explaining document contents and availability
- **ProofVault Management System**:
  * Tabbed interface (Overview, Files, Upload)
  * Overview tab: File counts per proof category (Overview, Problem Proof, Solution Proof, Demand Proof)
  * Files tab: Complete file listing with view, download, and remove actions
  * Upload tab: Drag-and-drop interface with folder selection capability
  * All file operations are venture-specific
- **Right Sidebar Widgets**:
  * Compact leaderboard positioned at top-right with reduced card sizes
  * Analysis page design integration (gradient styling, animated borders, trophy/medal icons)
  * Deal Room Access panel with conditional access based on score ≥90 and clear upload requirements messaging  
  * Recent Activity feed with dynamic founder journey tracking (email verification, password setup, platform joining, score establishment)
- **Backend API Integration**: Enhanced `/api/dashboard/*` endpoints for venture-specific validation data, vault management, and leaderboard
- **File Management Features**: Upload, download, remove functionality with toast notifications and data refresh
- **Mobile Responsive**: Proper mobile optimization with responsive grid layouts and touch-friendly interactions

### July 23, 2025 - Navigation System & Authentication Enhancement  
- **Navigation Bar Component**: Created responsive navbar with configurable display options (logo-only, sign-in, sign-out)
- **Page-Specific Navigation**: 
  * Landing page: Logo + Sign In button
  * Set-password page: Logo only
  * Login page: No navbar (clean form-focused design)
  * Dashboard page: Logo + Sign Out button with toast notifications
- **Sign Out Flow**: Integrated secure logout with session cleanup and redirect to landing page
- **Logo Improvements**: Fixed TypeScript errors (fetchPriority), consistent sizing across auth pages
- **Enhanced User Experience**: Clear navigation patterns and role-based display logic

### July 23, 2025 - Email Verification & Authentication System Complete
- **Database Schema**: Extended founders table with authentication fields (email_verified, password_hash, verification_token, token_expires_at, last_login_at)
- **Database Cleanup**: Removed company_website and personal_linkedin columns from founder table as requested
- **Password Security**: Implemented bcrypt encryption with strict validation (8+ chars, alphanumeric + safe special chars, no SQL injection risk)
- **Email Verification Flow**: Integrated verification URLs into onboarding emails via EastEmblem API with 24-hour token expiry
- **Authentication Pages**: Created set-password.tsx, login.tsx, and dashboard.tsx with consistent purple-gold theme and mobile optimization
- **Session Management**: Express session-based authentication with secure cookie configuration and logout functionality
- **API Routes**: Complete REST endpoints (/api/auth/*) for verification, password setting, login, logout, and user session management
- **Security Features**: Token generation, expiry validation, password strength requirements, SQL injection prevention
- **User Experience**: Toast notifications, real-time password validation, redirect flows, and responsive design across all auth pages

### July 21, 2025 - Email Template System Implementation
- **Email Template Architecture**: Created comprehensive email template system with 11 HTML templates for all user interactions
- **Template Collection**: email-verification, welcome-email, appointment-confirmation, progress-update, payment-confirmation, support-response, program-completion, win-back, newsletter, reminder, onboarding
- **EastEmblem API Integration**: Built EmailService class with template processing, conditional blocks, and EastEmblem API integration
- **Email API Routes**: Added complete REST API endpoints (/api/email/*) for sending all email types with template data
- **Template Engine**: Custom template processing with variable replacement, conditional blocks, and array iteration
- **Responsive Design**: All templates mobile-optimized with consistent Second Chance purple-gold branding
- **Legal Compliance**: Privacy policy and terms URLs dynamically populated from host URL in all templates
- **Template Features**: Download buttons for reports/certificates, progress visualization, achievement badges, personalized content

### July 21, 2025 - Performance Optimization & Favicon Implementation
- **White Screen Fix**: Resolved critical white screen rendering issue with comprehensive performance optimizations
- **Critical CSS**: Added immediate dark theme background to prevent white flash during loading
- **Loading Optimization**: Simplified loading components with inline styles for reliability, fixed CSS import order issues
- **Performance Monitoring**: Optimized performance monitoring and memory management to prevent interference
- **Favicon System**: Added comprehensive favicon support with multiple formats (SVG, ICO, Apple touch icon)
- **Brand Identity**: Created "SC" logo favicon with purple-gold gradient matching platform theme
- **Browser Compatibility**: Multiple favicon formats ensure display across all browsers and devices
- **Loading Performance**: Achieved improved First Paint and First Contentful Paint times

### July 21, 2025 - Legal Documentation Complete
- **Privacy Policy**: Comprehensive privacy policy page with complete PDF content integration (15 sections) - 100% content parity achieved
- **Terms and Conditions**: Complete terms and conditions page with 19 comprehensive sections covering all aspects of platform usage
- **Legal Framework**: UAE PDPL compliance, Masdar City Free Zone regulations, comprehensive user agreements
- **Platform Coverage**: ProofScore system disclaimers, investor matching terms, AI-generated content policies, IP rights
- **User Protection**: Liability limitations, dispute resolution, termination procedures, fee structures
- **Technical Integration**: Both legal pages with responsive design, sticky navigation, purple-gold theme consistency
- **Footer Integration**: Updated footer with active links to both privacy policy and terms and conditions

### July 21, 2025 - Privacy Policy Implementation
- **COMPLETED**: Comprehensive privacy policy page with complete PDF content integration (15 sections) - 100% content parity achieved
- **Effective Date Added**: Added effective date (15th July 2025) and last updated date to header
- **Enhanced Processing Details**: Detailed explanations of data processing purposes, AI scoring, investor matching, analytics, fraud prevention
- **Additional Legal Basis**: Added "Public Interest or Protection of Vital Interests" as lawful basis for processing
- **Comprehensive Data Sharing**: Detailed investor data sharing conditions, service provider obligations (DPAs), merger/acquisition scenarios
- **Enhanced Marketing Communications**: Explicit consent requirements, opt-out processes, non-intrusive communication policy
- **Comprehensive Cookie Policy**: 4 cookie categories (Essential, Analytics, Functional, Targeting), consent management, web beacons, fingerprinting
- **Advanced Security Measures**: Technical, administrative, physical safeguards, business continuity, disaster recovery, penetration testing
- **Detailed Data Retention**: Specific retention periods for founders (2-5 years), investors (3-10 years), system data, automated deletion procedures
- **Complete Data Subject Rights**: Added 3 additional rights (Right to Restrict Processing, Right to Withdraw Consent, Right to Lodge a Complaint)
- **Enhanced Breach Response**: 5-step incident response process, breach definition, individual notification procedures, user security role
- **Technical**: Static layout, responsive design, sticky table of contents, purple-gold theme with color-coded sections
- **Content**: Complete UAE PDPL compliance with East Emblem contact information and comprehensive data subject rights

### July 19, 2025 - Report System Enhancement
- Updated report generation system to use new comprehensive JSON structure
- Enhanced traction.signals structure with detailed signal types
- Fixed session data parsing to extract actual scoring results (East Emblem score 85) instead of demo fallback

### July 17, 2025 - EastEmblem API Integration
- Integrated EastEmblem Report API System using /webhook endpoints
- Integrated EastEmblem Certificate API System with automatic generation after scoring
- Added comprehensive email notification system with 3-retry logic and graceful error handling
- Successfully tested end-to-end workflow: scoring, certificate generation, report generation, email delivery

## Legacy Changelog Summary (June-July 2025)
### Core System Architecture (Established June 2025)
- **Performance**: 75% load time reduction (40s → 6-10s) through 3-phase optimization
- **Backend**: Modularized routes, service layer architecture, comprehensive error handling
- **Frontend**: React + TypeScript, lazy loading, code splitting, framer-motion animations
- **Database**: Drizzle ORM + PostgreSQL with automated cleanup systems
- **API Integration**: EastEmblem API for scoring, certificates, reports, notifications
### Onboarding System Features (Established June-July 2025)
- **Complete Flow**: Founder → Venture → Team → Upload → Processing → Analysis
- **Session Management**: Robust session handling with fallback mechanisms and UUID validation
- **Team Management**: Full CRUD operations with UI refresh and Slack notifications
- **Document Processing**: Pitch deck upload with theme-consistent UI and error handling
- **Scoring Integration**: Real-time EastEmblem API integration with comprehensive error handling
- **ProofScore System**: 5-dimension scoring (Desirability, Feasibility, Viability, Traction, Readiness)
- **ProofTags**: 21-tag achievement system with unlock requirements and celebration animations
### Analysis & Gamification Features
- **ProofTags**: 21-tag achievement system with emoji icons, unlock requirements, celebration animations
- **Scoring**: Dynamic milestone system (ProofScaler Candidate, Investor Match Ready, Leader in Validation)
- **Celebrations**: Confetti animations and toast notifications for high scores (>70)
- **Badges**: SVG badge system with score-based mapping (Badge_01 through Badge_09)
- **Leaderboard**: Mixed real/mock data system with top 10 rankings and medal system
### UI/UX Enhancements
- **Analysis Page**: Side-by-side layout with compact design and consistent purple-gold theming
- **ProofTags**: Card hover tooltips with comprehensive justifications, synchronized data sources
- **Team Onboarding**: Streamlined navigation, fixed duplication bugs
- **Interactive Elements**: Hover effects, animations, responsive design patterns
### Certificate & Report Generation
- **Certificates**: EastEmblem API integration with automatic generation, template system, badge positioning
- **Reports**: Comprehensive HTML/JSON report system with validation breakdowns and investor feedback
- **Data Room**: Automatic upload to 0_Overview folder for investor access
- **ProofVault**: Fixed folder structure creation with comprehensive error handling


## User Preferences

Preferred communication style: Simple, everyday language.

**Development Communication Pattern**:
- Apply question-first approach to all technical development tasks
- Before implementing any feature or fix, ask relevant counter-questions to gather context
- Only proceed after asking "Do you want me to ask more questions, or should I proceed with the answer?"
- This approach reduces unnecessary work and produces better outputs by understanding requirements fully
- Continue this pattern throughout entire conversation