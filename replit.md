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

## Recent Key Updates

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