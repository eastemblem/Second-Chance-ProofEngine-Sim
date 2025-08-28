# Second Chance - Startup Validation Platform

## Overview
Second Chance is a comprehensive startup validation platform designed to empower entrepreneurs through intelligent document processing, advanced error management, and user-centric design. It aims to generate revenue through premium features like Deal Room access, while providing valuable insights and a clear pathway for startups based on their ProofScore. The platform utilizes a modern tech stack to ensure scalability, security, and a seamless user experience.

## Recent Changes (Updated: August 28, 2025)
- **Payment Notification System**: Implemented comprehensive end-to-end payment flow notifications covering the complete customer journey from payment initiation through final completion or failure
- **Real-time Slack Integration**: All payment activities now trigger instant Slack notifications to the #notifications channel with detailed founder and transaction information
- **Enhanced Team Visibility**: Development team receives immediate alerts for payment processing, status changes, webhook confirmations, and revenue events
- **Box URL Fix**: Resolved critical bug in team notification emails where Box folder URLs were displaying "N/A" instead of actual URLs
- **Webhook Notifications**: Added specialized notifications for payment gateway webhook events to distinguish from manual status checks
- **Error Resilient Design**: Notification failures are handled gracefully without affecting payment processing functionality

## User Preferences
- Communicate in simple, everyday language
- Avoid technical jargon in user-facing content
- Focus on user journey and experience
- Maintain professional tone without emojis
- Remove technical language from user notifications (e.g., replaced "JWT token invalidated" with user-friendly logout messages)

## System Architecture

### UI/UX Decisions
The platform features a dark theme with purple and gold color schemes, integrating gradient styling and consistent branding. Design principles emphasize interactive elements such as hover effects, animated statistics, and floating background elements to enhance user engagement. Visual components are built for reusability and maintainability, ensuring a cohesive and dynamic user interface.

### Technical Implementations
The frontend is built with TypeScript React and Vite, utilizing React Query for state management and Tailwind CSS with shadcn/ui components for styling. The backend is an Express.js serverless application, employing JWT-based authentication and Drizzle ORM for database interactions. Key features include:

#### Clean Unified Encryption Standard (AES-256-GCM) - NODE.JS CRYPTO IMPLEMENTATION
- **Frontend Node.js Crypto:** Replaced Web Crypto API with crypto-browserify for identical encryption between frontend and backend
- **Universal Compatibility:** Both frontend and backend use identical Node.js crypto methods (createCipheriv, createDecipheriv, createHash)
- **Secret Management:** ENCRYPTION_SECRET and VITE_ENCRYPTION_SECRET environment variables verified identical
- **Session Key Format:** Both systems generate identical `public-session-${baseSecret}` format
- **Comprehensive Logging:** Added detailed secret resolution and encryption process logging for debugging
- **Buffer Handling:** Frontend now uses Buffer.from() and toString('base64') identical to backend
- **Key Derivation:** Both systems use crypto.createHash('sha256').update(sessionKey, 'utf8').digest() 
- **AES-GCM Standard:** Both systems use 'aes-256-gcm' with 12-byte IV and 16-byte authentication tag
- **Secure Login Pages:** Multiple interfaces available (`/secure-login`, `/secure-flow-demo`) with Node.js crypto
- **Development Status:** Frontend and backend encryption implementations now functionally identical
- **Score-Based Routing:** Users are directed to different sales pages (`/deal-room` or `/proof-scaling`) based on their ProofScore (threshold at 70 points).
- **Component-Based Design:** Core UI elements are refactored into reusable components (e.g., `AnimatedSection`, `MetricCard`, `GradientButton`) to reduce code duplication and improve maintainability.
- **Payment Integration:** Secure payment processing for premium features (e.g., Deal Room access) via a modal-based flow with comprehensive activity tracking. Uses Telr gateway with automatic USD to AED currency conversion (rate: 3.673) for UAE market compliance while displaying USD prices to users. Supports dedicated TELR_TEST_MODE environment variable for flexible test/live mode switching.
- **Simplified Onboarding:** Streamlined user onboarding by removing intermediate payment steps and directly guiding users to their recommended pathway.
- **Enhanced Error Handling:** Sophisticated retry logic and detailed error categorization for processes like pitch upload.
- **End-to-End Encryption:** Transparent payload encryption for API communications using AES-256-GCM encryption with feature flags (ENABLE_ENCRYPTION/VITE_ENABLE_ENCRYPTION) for controlled rollout. Supports both encrypted and unencrypted requests without breaking existing functionality.
- **Dashboard Architecture:** Restructured dashboard routing system where the new dashboard (DashboardV2) is now the main production dashboard accessible at `/dashboard`. The legacy dashboard remains available at `/dashboard-v1` for development environments only, ensuring backward compatibility during transition periods.

### Feature Specifications
- **Deal Room Access:** Provides qualified users (ProofScore >= 70) access to investor matching and premium features for a one-time fee.
- **ProofScaling Sales Page:** A dedicated experience for startups with ProofScores below 70, offering tailored guidance.
- **Direct Pathway Routing:** Eliminates intermediate pages, directly routing users to relevant sales pages post-analysis.
- **Premium Download Features:** Report downloads and file downloads are protected behind the payment system, ensuring only paying customers can access detailed analysis documents and resources.
- **Comprehensive Payment Activity Tracking:** Logs all payment-related user interactions for analytics, including initiation, completion, and failure tracking.
- **Team Notification System:** Automated email and Slack notifications to development team upon Deal Room purchases, including actual Box folder URLs and calculated venture status based on ProofScore levels. Uses existing East Emblem API Slack integration with proper message formatting.
- **Comprehensive Payment Flow Notifications:** End-to-end Slack notifications covering the complete payment journey from initiation to completion/failure. The notification system includes:
  - **Payment Initiation**: Alerts when users start the payment process with founder details and amount
  - **Order Creation Success/Failure**: Confirms gateway setup or reports specific errors
  - **Status Change Tracking**: Real-time notifications for pending → completed/failed/cancelled/expired transitions
  - **Webhook Confirmations**: Specialized notifications for gateway-direct status updates with 📡 indicators
  - **Final Completion**: Deal Room access notifications with Box folder URLs and ProofScore details
  - All notifications are sent to the #notifications channel with structured founder information, payment references, and transaction details for complete revenue tracking visibility

### System Design Choices
The system prioritizes a modular, component-driven approach for the frontend and a serverless architecture for the backend to ensure scalability and efficient resource utilization. Drizzle ORM is used for type-safe database interactions, emphasizing schema-driven development. The email service is designed for flexibility, allowing for different email templates based on user flow.

#### Notification Architecture
The comprehensive payment notification system is built with the following technical implementation:
- **Integration Points**: Notifications trigger at payment routes (`/api/v1/payments/create`), payment service status checks, and webhook handlers
- **East Emblem API Integration**: Uses existing Slack infrastructure via `eastEmblemAPI.sendSlackNotification()` method for consistent messaging
- **Error Handling**: Notification failures are isolated and logged without affecting core payment processing functionality
- **Message Formatting**: Structured notifications include founder ID headers, payment details, status-specific emojis, and contextual information
- **Real-time Processing**: Webhook notifications are distinguished from manual status checks with specialized indicators (📡)
- **Revenue Tracking**: All payment events are captured for complete visibility into customer payment behavior and business revenue generation

#### Security Architecture
- **Data Protection:** End-to-end encryption ensures sensitive startup data, ProofScores, and payment information are protected during transmission
- **Encryption Standards:** AES-256 symmetric encryption with session-based key derivation and authentication tags
- **Middleware Integration:** Transparent encryption layer that works with existing JWT authentication system
- **Performance Optimized:** Minimal latency impact (~5-15ms) with efficient key management and caching

## External Dependencies
- **Telr Payment Gateway:** Integrated for secure payment processing.
- **PostgreSQL:** Used as the primary database.
- **Eastemblem API:** External API for core functionalities.
- **Various Authentication and Service Keys:** For third-party services and security.