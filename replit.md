# Second Chance - Startup Validation Platform

## Overview
Second Chance is a comprehensive startup validation platform designed to empower entrepreneurs through intelligent document processing, advanced error management, and user-centric design. It aims to generate revenue through premium features like Deal Room access, while providing valuable insights and a clear pathway for startups based on their ProofScore. The platform utilizes a modern tech stack to ensure scalability, security, and a seamless user experience.

## User Preferences
- Communicate in simple, everyday language
- Avoid technical jargon in user-facing content
- Focus on user journey and experience
- Maintain professional tone without emojis

## System Architecture

### UI/UX Decisions
The platform features a dark theme with purple and gold color schemes, integrating gradient styling and consistent branding. Design principles emphasize interactive elements such as hover effects, animated statistics, and floating background elements to enhance user engagement. Visual components are built for reusability and maintainability, ensuring a cohesive and dynamic user interface.

### Technical Implementations
The frontend is built with TypeScript React and Vite, utilizing React Query for state management and Tailwind CSS with shadcn/ui components for styling. The backend is an Express.js serverless application, employing JWT-based authentication and Drizzle ORM for database interactions. Key features include:

#### Clean Unified Encryption Standard (AES-256-GCM)
- **Single Path Architecture:** Eliminated all legacy encryption systems (XOR, PBKDF2, fallback methods)
- **Clean Implementation:** Frontend and backend use identical AES-256-GCM with SHA-256 key derivation
- **Unified Standard:** 12-byte IV, 16-byte authentication tags, single session secret generation
- **No Fallbacks:** Removed production compatibility layers and multiple secret attempts
- **Session Management:** `public-session-${SECRET}` for login, `session-${founderId}-${SECRET}` for authenticated users
- **Clean Middleware:** `cleanDecryptionMiddleware` and `cleanEncryptionMiddleware` replace legacy encryption middleware
- **Validation:** Strict payload validation ensures only unified standard format is accepted
- **Login Integration:** Auth-token routes use clean encryption middleware for secure authentication
- **Test Verification:** Clean encryption test endpoints demonstrate working implementation
- **Production Testing:** `/clean-login-test` page enabled in production for encryption verification
- **Score-Based Routing:** Users are directed to different sales pages (`/deal-room` or `/proof-scaling`) based on their ProofScore (threshold at 70 points).
- **Component-Based Design:** Core UI elements are refactored into reusable components (e.g., `AnimatedSection`, `MetricCard`, `GradientButton`) to reduce code duplication and improve maintainability.
- **Payment Integration:** Secure payment processing for premium features (e.g., Deal Room access) via a modal-based flow with comprehensive activity tracking. Uses Telr gateway with automatic USD to AED currency conversion (rate: 3.673) for UAE market compliance while displaying USD prices to users. Supports dedicated TELR_TEST_MODE environment variable for flexible test/live mode switching.
- **Simplified Onboarding:** Streamlined user onboarding by removing intermediate payment steps and directly guiding users to their recommended pathway.
- **Enhanced Error Handling:** Sophisticated retry logic and detailed error categorization for processes like pitch upload.

### Feature Specifications
- **Deal Room Access:** Provides qualified users (ProofScore >= 70) access to investor matching and premium features for a one-time fee.
- **ProofScaling Sales Page:** A dedicated experience for startups with ProofScores below 70, offering tailored guidance.
- **Direct Pathway Routing:** Eliminates intermediate pages, directly routing users to relevant sales pages post-analysis.
- **Comprehensive Payment Activity Tracking:** Logs all payment-related user interactions for analytics, including initiation, completion, and failure tracking.

### System Design Choices
The system prioritizes a modular, component-driven approach for the frontend and a serverless architecture for the backend to ensure scalability and efficient resource utilization. Drizzle ORM is used for type-safe database interactions, emphasizing schema-driven development. The email service is designed for flexibility, allowing for different email templates based on user flow.

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