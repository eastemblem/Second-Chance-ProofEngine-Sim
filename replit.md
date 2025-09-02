# Second Chance - Startup Validation Platform

## Overview
Second Chance is a comprehensive startup validation platform designed to empower entrepreneurs through intelligent document processing, advanced error management, and user-centric design. It aims to generate revenue through premium features like Deal Room access, while providing valuable insights and a clear pathway for startups based on their ProofScore. The platform utilizes a modern tech stack to ensure scalability, security, and a seamless user experience.

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
The frontend is built with TypeScript React and Vite, utilizing React Query for state management and Tailwind CSS with shadcn/ui components for styling. The backend is an Express.js serverless application, employing JWT-based authentication and Drizzle ORM for database interactions.

Key technical decisions include:
- **Clean Unified Encryption Standard (AES-256-GCM)**: Identical Node.js crypto methods are used for encryption and decryption on both frontend and backend (createCipheriv, createDecipheriv, createHash). This ensures universal compatibility and secure communication, with detailed logging for debugging.
- **Score-Based Routing**: Users are directed to different sales pages (`/deal-room` or `/proof-scaling`) based on their ProofScore (threshold at 70 points).
- **Component-Based Design**: Core UI elements are refactored into reusable components (e.g., `AnimatedSection`, `MetricCard`, `GradientButton`) to reduce code duplication and improve maintainability.
- **Payment Integration**: Secure payment processing for premium features via a modal-based flow. Primary integration with PayTabs gateway featuring iframe embedding, multi-region support, customer data pre-filling, and detailed invoice generation. Intelligent currency selection (AED for UAE, USD for non-UAE). Secondary Telr gateway integration provides automatic currency conversion. Both support flexible test/live mode switching.
- **Simplified Onboarding**: Streamlined user onboarding by removing intermediate payment steps.
- **Enhanced Error Handling**: Sophisticated retry logic and detailed error categorization for processes like pitch upload.
- **End-to-End Encryption**: Transparent payload encryption for API communications using AES-256-GCM, with feature flags for controlled rollout.
- **Dashboard Architecture**: The new DashboardV2 is the main production dashboard at `/dashboard`, while the legacy `/dashboard-v1` remains for development only.
- **Unified Logging Architecture**: Standardized logging using a unified `appLogger` pattern across the platform, replacing various `console.log` and `winston` calls. Logging covers business logic, database operations, external API calls, errors, and warnings, including structured metadata for enhanced observability.
- **PayTabs Invoice Integration**: Complete invoice details sent to PayTabs /request endpoint including line items, SKU, descriptions, pricing, and totals. Zero shipping charges, extra charges, and discounts for Deal Room access purchases with comprehensive logging. PayTabs returns `invoice.id` in responses which enables PDF invoice downloads via `https://secure.paytabs.com/payment/invoice/{InvoiceId}/download/pdf`.
- **Payment-Gated Document Notifications**: Toast notifications for certificate and report readiness only appear after users complete Deal Room payment (hasDealRoomAccess=true), preventing premature notification confusion.
- **Subscription Plan Schema**: Database schema supports "one-time" subscription plans for Deal Room access, in addition to standard "basic", "premium", and "enterprise" recurring plans.
- **Environment-Based Email Logo Configuration**: All email templates (payment success, investor matching, team notifications) dynamically use LOGO_URL from environment variables instead of hardcoded paths, with fallback to project assets when environment variable is not set. The EmailService automatically injects the LOGO_URL from process.env.LOGO_URL into all email templates using the {{LOGO_URL}} placeholder.
- **Live Exchange Rate Integration**: Real-time USD to AED currency conversion using multiple fallback APIs (ExchangeRate-API, ExchangeRate.host, Fawaz Ahmed API) with 1-hour caching to reduce API calls. Replaces hardcoded 3.673 rate with live market rates, ensuring accurate pricing for UAE users. Features graceful fallback to cached/default rates if all APIs fail.
- **Enhanced UI Currency Display**: Improved button layouts with price on separate lines for better readability. All dashboard sections (DocumentDownloads, ProofVault) now use consistent live currency pricing with proper formatting and comma separators for AED amounts.

### Feature Specifications
- **Deal Room Access**: Provides qualified users (ProofScore >= 70) access to investor matching and premium features for a one-time fee.
- **ProofScaling Sales Page**: A dedicated experience for startups with ProofScores below 70, offering tailored guidance.
- **Direct Pathway Routing**: Eliminates intermediate pages, directly routing users to relevant sales pages post-analysis.
- **Premium Download Features**: Report downloads and file downloads are protected behind the payment system, requiring payment for access to detailed analysis documents and resources.
- **Comprehensive Payment Activity Tracking**: Logs all payment-related user interactions (initiation, completion, failure) for analytics.
- **Team Notification System**: Automated email and Slack notifications to the development team upon Deal Room purchases, including Box folder URLs and calculated venture status. All payment activities trigger instant Slack notifications to the #notifications channel with detailed founder and transaction information, covering the entire payment journey.
- **Dual Payment Email System**: Upon successful payment, users receive two sequential emails: (1) immediate payment confirmation with transaction details, and (2) investor matching next steps email (sent 3 seconds later) with guidance on the review process and dashboard access.
- **Email Template Light Theme**: Payment success and investor matching emails converted from dark theme to light theme for better email client compatibility and professional appearance. All social media links removed from both email templates for cleaner, professional appearance. Payment confirmation section font sizes increased for better readability.
- **Duplicate Email Prevention**: Enhanced duplicate email prevention with comprehensive logging to track when emails are prevented. Added subscription existence check to prevent duplicate email triggers and ensure emails are sent only once per payment completion. Improved logging shows which specific emails were prevented (payment_confirmation, investor_matching_next_steps). Fixed duplicate team notifications by removing redundant calls from venture routes and centralizing notifications in PaymentService with unique transaction IDs.
- **ProofScaling Wishlist System**: Complete cohort interest tracking functionality with database schema for capturing founder contact details (full name, email, phone, company, role, organization stage). Features responsive modal-based form with validation, duplicate email prevention, success confirmation, and comprehensive API endpoints for data management. Integrated seamlessly into ProofScaling sales page with "Join Next Cohort" buttons.

### System Design Choices
The system prioritizes a modular, component-driven approach for the frontend and a serverless architecture for the backend to ensure scalability and efficient resource utilization. Drizzle ORM is used for type-safe database interactions, emphasizing schema-driven development. The email service is designed for flexibility, allowing for different email templates based on user flow.

#### Notification Architecture
The comprehensive payment notification system integrates with payment routes, service status checks, and webhook handlers. It utilizes the existing East Emblem API for Slack notifications, handles errors gracefully without affecting payment processing, and formats messages with structured founder information, payment details, and status-specific indicators for real-time processing and revenue tracking.

#### Security Architecture
- **Data Protection**: End-to-end encryption using AES-256 symmetric encryption protects sensitive data during transmission.
- **Encryption Standards**: Uses AES-256 symmetric encryption with session-based key derivation and authentication tags.
- **Middleware Integration**: Transparent encryption layer that works with the existing JWT authentication system.
- **Performance Optimized**: Minimal latency impact with efficient key management and caching.

## External Dependencies
- **PayTabs Payment Gateway**: Primary integration for secure payment processing.
- **Telr Payment Gateway**: Secondary integration for secure payment processing.
- **PostgreSQL**: Used as the primary database.
- **Eastemblem API**: External API for core functionalities and Slack integration.
- **Slack**: For real-time team notifications.