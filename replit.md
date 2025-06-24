# Second Chance - Startup Validation Platform

## Overview

Second Chance is a comprehensive startup validation platform that helps founders validate their ventures through the ProofScaling framework. The application provides an end-to-end solution for startup assessment, from onboarding through pitch deck analysis to investment readiness scoring. Built as a full-stack web application, it integrates with external APIs for document analysis and provides personalized pathways for founders based on their validation scores.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **UI Components**: Radix UI primitives with custom styling (shadcn/ui pattern)
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth transitions and micro-interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured JSON responses
- **File Handling**: Multer for multipart file uploads
- **External Integration**: EastEmblem API for pitch deck analysis and ProofVault management

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Type-safe schema definitions with automatic TypeScript inference
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### 1. Onboarding System
**Purpose**: Multi-step data collection process for founders and ventures
- **Founder Details**: Personal information, experience, technical background
- **Venture Information**: Company details, industry, revenue stage, MVP status
- **Team Management**: Optional team member addition with role-based permissions
- **Document Upload**: Pitch deck processing and validation

### 2. ProofScore Engine
**Purpose**: Investment readiness assessment across five dimensions
- **Desirability**: Market need and customer validation
- **Feasibility**: Technical and execution capability
- **Viability**: Business model and financial sustainability
- **Traction**: Customer acquisition and growth metrics
- **Readiness**: Investment preparation and documentation quality

### 3. ProofVault Integration
**Purpose**: Structured document management and analysis
- **Folder Structure**: Automated organization of startup documentation
- **AI Analysis**: Pitch deck content analysis and scoring
- **Recommendation Engine**: Actionable feedback based on analysis results

### 4. Pathway Recommendation System
**Purpose**: Personalized next steps based on validation scores
- **High Score (≥80)**: Direct investor matching and deal room access
- **Lower Score (<80)**: ProofScaling course enrollment and skill development
- **Progress Tracking**: Module completion and improvement measurement

## Data Flow

1. **User Onboarding**: Founder creates account and provides basic information
2. **Venture Setup**: Company details and business model information collection
3. **Team Building**: Optional team member addition with role assignments
4. **Document Upload**: Pitch deck submission triggers ProofVault creation
5. **AI Analysis**: EastEmblem API processes documents and generates insights
6. **Score Calculation**: ProofScore algorithm evaluates across five dimensions
7. **Pathway Assignment**: Recommendation engine determines next steps
8. **Progress Tracking**: User advancement through assigned pathway

## External Dependencies

### EastEmblem API
- **Purpose**: AI-powered pitch deck analysis and ProofVault management
- **Endpoints**: Folder creation, file upload, content analysis, scoring
- **Authentication**: API key-based authentication
- **Rate Limits**: Managed through request queuing and retry logic

### Neon Database
- **Purpose**: Serverless PostgreSQL hosting
- **Connection**: WebSocket-based connection pooling
- **Security**: Environment variable-based connection strings
- **Scaling**: Automatic scaling based on usage patterns

### React Query
- **Purpose**: Server state management and caching
- **Features**: Automatic refetching, background updates, optimistic updates
- **Configuration**: Custom query client with error handling and retry logic

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Hot Reload**: Vite HMR for instant development feedback
- **Database**: Shared Neon instance with development schema
- **File Storage**: Local uploads directory for temporary file handling

### Production Build
- **Frontend**: Static assets built with Vite and served from Express
- **Backend**: ESBuild compilation to optimized JavaScript bundle
- **Database**: PostgreSQL with connection pooling and prepared statements
- **File Handling**: Temporary upload processing with automatic cleanup

### Configuration Management
- **Environment Variables**: Database URL, API keys, and feature flags
- **Build Scripts**: Separate development and production configurations
- **Process Management**: Single process serving both frontend and backend

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.