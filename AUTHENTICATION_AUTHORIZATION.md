# Authentication & Authorization System

## Overview

The Second Chance platform implements a dual authentication system combining **JWT token-based authentication** for API access and **session-based authentication** for web application flows. This document covers the complete authentication architecture, middleware patterns, and security best practices.

---

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [JWT Token Authentication](#jwt-token-authentication)
3. [Session-Based Authentication](#session-based-authentication)
4. [AuthenticatedRequest Interface](#authenticatedrequest-interface)
5. [Authentication Middleware](#authentication-middleware)
6. [Auth Routes](#auth-routes)
7. [Frontend Auth Client](#frontend-auth-client)
8. [Protected Route Patterns](#protected-route-patterns)
9. [Token Management](#token-management)
10. [Role-Based Access Control](#role-based-access-control)
11. [Security Best Practices](#security-best-practices)

---

## Authentication Methods

### Dual Authentication System

| Method | Use Case | Storage | Expiry |
|--------|----------|---------|--------|
| JWT Tokens | API access, mobile clients | localStorage + cookies | 7 days |
| Sessions | Web application flows | Server-side session store | Configurable |

---

## JWT Token Authentication

### Token Structure

JWT tokens contain the following payload:

```typescript
interface AuthToken {
  founderId: string;     // User's unique identifier
  email: string;         // User's email address
  startupName?: string;  // Associated startup name
  sessionId?: string;    // Optional session identifier
  iat?: number;          // Issued at timestamp
  exp?: number;          // Expiration timestamp
}
```

### Token Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Algorithm | HS256 | HMAC-SHA256 signing |
| Expiry | 7 days | Token validity period |
| Issuer | `second-chance-platform` | Token issuer claim |
| Secret | `JWT_SECRET` env var | Signing key |

### Token Generation

```typescript
import { generateAuthToken } from './middleware/token-auth';

const token = generateAuthToken({
  founderId: user.founderId,
  email: user.email,
  startupName: user.startupName,
  sessionId: sessionId
});
```

### Token Verification

```typescript
import { verifyAuthToken } from './middleware/token-auth';

const decoded = verifyAuthToken(token);
if (!decoded) {
  // Token invalid or blacklisted
}
```

---

## Session-Based Authentication

### Session Configuration

Sessions extend Express's default session with authentication fields:

```typescript
declare module 'express-session' {
  interface SessionData {
    founderId?: string;
    email?: string;
    isAuthenticated?: boolean;
  }
}
```

### Session Authentication Flow

1. User submits login credentials
2. Server validates credentials against database
3. Session data is populated with user info
4. Session cookie sent to client
5. Subsequent requests include session cookie

---

## AuthenticatedRequest Interface

The `AuthenticatedRequest` interface extends Express's `Request` with authentication context:

```typescript
interface AuthenticatedRequest extends Request {
  user?: AuthToken;   // Decoded JWT payload
  token?: string;     // Raw JWT token
}
```

### Usage in Route Handlers

```typescript
import { AuthenticatedRequest } from './middleware/token-auth';

router.get('/protected', authenticateToken, (req: AuthenticatedRequest, res) => {
  const founderId = req.user?.founderId;
  const email = req.user?.email;
  // Access authenticated user data
});
```

---

## Authentication Middleware

### authenticateToken

**Purpose**: Requires valid JWT token for route access.

**Behavior**:
1. Extracts token from Authorization header, cookies, or query params
2. Verifies token signature and expiry
3. Checks token is not blacklisted
4. Attaches decoded user data to request

```typescript
import { authenticateToken } from './middleware/token-auth';

router.get('/protected', authenticateToken, handler);
```

**Response Codes**:

| Code | Message | Scenario |
|------|---------|----------|
| 401 | `TOKEN_MISSING` | No token provided |
| 401 | `TOKEN_INVALID` | Invalid or expired token |

### optionalAuth

**Purpose**: Populates user context if token present, but doesn't fail on missing token.

```typescript
import { optionalAuth } from './middleware/token-auth';

router.get('/public-with-user-context', optionalAuth, handler);
```

### requireAuth (Session-based)

**Purpose**: Validates session-based authentication.

```typescript
import { requireAuth } from './routes/auth';

router.get('/session-protected', requireAuth, handler);
```

### refreshTokenIfNeeded

**Purpose**: Automatically refreshes tokens close to expiry.

**Behavior**:
- Checks if token expires within 24 hours
- Verifies user still exists in database
- Generates new token and sends via `X-New-Auth-Token` header

```typescript
router.use(authenticateToken, refreshTokenIfNeeded);
```

---

## Auth Routes

The platform provides two sets of authentication routes:

1. **Session-Based Routes** (`/api/auth/*`) - For traditional web flows with email verification
2. **JWT Token Routes** (`/api/auth-token/*`) - For API access with JWT tokens (used by frontend AuthClient)

---

### JWT Token Routes (`/api/auth-token/*`)

These are the primary routes used by the frontend `AuthClient` class.

#### Register

**Endpoint**: `POST /api/auth-token/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "SecureP@ssw0rd!",
  "positionRole": "Founder",
  "startupName": "My Startup",
  "industry": "Technology",
  "geography": "Global"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "founderId": "uuid",
    "email": "user@example.com",
    "startupName": "My Startup"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d",
  "founder": {
    "founderId": "uuid",
    "fullName": "John Doe",
    "email": "user@example.com",
    "positionRole": "Founder"
  },
  "venture": {
    "ventureId": "uuid",
    "name": "My Startup",
    "industry": "Technology",
    "geography": "Global"
  }
}
```

**Behavior**:
- Creates founder record with hashed password (bcrypt, 12 rounds)
- Auto-verifies email (no email verification required)
- Creates venture if `startupName` provided
- Returns JWT token and sets HTTP-only cookie
- Logs activity via `ActivityService`

#### Login

**Endpoint**: `POST /api/auth-token/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "founderId": "uuid",
    "email": "user@example.com",
    "startupName": "My Startup"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d",
  "founder": {
    "founderId": "uuid",
    "fullName": "John Doe",
    "email": "user@example.com",
    "positionRole": "Founder",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  },
  "venture": {
    "ventureId": "uuid",
    "name": "My Startup",
    "industry": "Technology",
    "geography": "Global",
    "growthStage": "Pre-seed"
  }
}
```

**Behavior**:
- Validates credentials against database
- Uses `bcrypt.compare()` for password verification
- Returns primary venture associated with founder
- Sets HTTP-only cookie with JWT token
- Logs authentication activity

#### Logout (JWT Blacklisting)

**Endpoint**: `POST /api/auth-token/logout`

**Headers**: `Authorization: Bearer <token>` or `authToken` cookie

**Response**:
```json
{
  "success": true,
  "message": "Logout successful - token invalidated"
}
```

**Behavior**:
1. Extracts token from Authorization header or cookie
2. Decodes token to get `founderId` for activity logging
3. Calls `invalidateToken(token)` to add to in-memory blacklist
4. Clears `authToken` HTTP-only cookie
5. Logs logout activity

**Token Blacklisting Flow**:
```
Client sends logout request
        ↓
Server extracts JWT from header/cookie
        ↓
Token added to blacklistedTokens Set
        ↓
Cookie cleared from response
        ↓
Subsequent requests with this token return 401
        ↓
Hourly cleanup removes expired tokens from blacklist
```

#### Verify Token

**Endpoint**: `GET /api/auth-token/verify`

**Headers**: `Authorization: Bearer <token>` or `authToken` cookie

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "founderId": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "positionRole": "Founder",
      "startupName": "My Startup"
    },
    "venture": {
      "ventureId": "uuid",
      "name": "My Startup",
      "industry": "Technology",
      "geography": "Global"
    },
    "tokenValid": true,
    "expiresAt": 1705320600
  }
}
```

**Behavior**:
- Validates JWT signature and expiry
- Checks token is not blacklisted
- Verifies user still exists in database
- Returns current user and venture data

#### Refresh Token

**Endpoint**: `POST /api/auth-token/refresh`

**Headers**: `Authorization: Bearer <token>` or `authToken` cookie

**Response**:
```json
{
  "success": true,
  "user": {
    "founderId": "uuid",
    "email": "user@example.com",
    "startupName": "My Startup"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7d",
  "founder": { ... },
  "venture": { ... }
}
```

**Behavior**:
- Validates existing token
- Verifies user still exists
- Issues new token with fresh 7-day expiry
- Updates HTTP-only cookie

---

### Session-Based Routes (`/api/auth/*`)

Used for traditional web authentication flows with email verification.

#### Email Verification

**Endpoint**: `GET /api/auth/verify-email/:token`

**Flow**:
1. Accepts token via path param or query string
2. Finds founder with matching verification token
3. Validates token not expired
4. Marks email as verified
5. Redirects to password setup page

**Redirect Scenarios**:

| Scenario | Redirect URL |
|----------|--------------|
| Success | `/set-password?verified=true&email={email}` |
| Invalid token | `/set-password?error=invalid` |
| Already verified | `/set-password?error=already_verified&email={email}` |
| Expired token | `/set-password?error=expired&email={email}` |

#### Set Password

**Endpoint**: `POST /api/auth/set-password`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!"
}
```

**Validation**:
- Email must be verified
- Password minimum 8 characters
- Password strength validation (complexity rules)

#### Session Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "founder": {
    "founderId": "uuid",
    "fullName": "John Doe",
    "email": "user@example.com"
  }
}
```

**Validation Checks**:
1. Email exists in database
2. Email is verified
3. Password is set
4. Password matches hash

#### Session Logout

**Endpoint**: `POST /api/auth/logout`

**Behavior**:
- Destroys server session
- Returns success confirmation

#### Get Current User

**Endpoint**: `GET /api/auth/me`

**Response**:
```json
{
  "founderId": "uuid",
  "fullName": "John Doe",
  "email": "user@example.com",
  "isAuthenticated": true,
  "venture": {
    "ventureId": "uuid",
    "name": "My Startup"
  },
  "totalVentures": 1
}
```

#### Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Security**: Always returns success message regardless of email existence to prevent email enumeration attacks.

#### Reset Password

**Endpoints**:
- `GET /api/auth/reset-password/:token` - Validates token and redirects to frontend
- `POST /api/auth/reset-password/:token` - Updates password

**POST Request Body**:
```json
{
  "password": "NewSecureP@ssw0rd!"
}
```

---

## Frontend Auth Client

### AuthClient Class

The frontend uses a singleton `AuthClient` for managing authentication state.

```typescript
import { authClient } from '@/lib/auth-client';

// Check authentication status
if (authClient.isAuthenticated()) {
  const user = authClient.getUser();
}

// Login
const response = await authClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// Logout
await authClient.logout();

// Get auth header for API requests
const headers = authClient.getAuthHeader();
// Returns: { Authorization: 'Bearer <token>' }
```

### Storage Keys

| Key | Content |
|-----|---------|
| `auth_token` | JWT token string |
| `auth_user` | JSON serialized user data |
| `auth_venture` | JSON serialized venture data |

### Token Extraction Priority

The backend extracts tokens in this order:

1. **Authorization Header**: `Bearer <token>`
2. **Cookies**: `authToken` cookie
3. **Query Parameter**: `?token=<token>` (for downloads)

### Automatic Token Refresh

The client automatically:
- Checks token expiry every 30 minutes
- Refreshes if token expires within 2 hours
- Updates stored token with `X-New-Auth-Token` header value

### Authenticated API Requests

```typescript
// Generic authenticated request
const response = await authClient.authenticatedRequest('/api/protected', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**Features**:
- Automatic token attachment
- 401 response handling with token refresh
- Retry after successful refresh

---

## Protected Route Patterns

### JWT-Protected Routes

```typescript
// Single route protection
router.get('/vault', authenticateToken, getVaultHandler);

// Router-level protection
router.use(authenticateToken);
router.get('/resource1', handler1);
router.get('/resource2', handler2);
```

### Routes Using Authentication

| Route Pattern | Middleware | Purpose |
|--------------|------------|---------|
| `/api/v1/vault/*` | `authenticateToken` | ProofVault file operations |
| `/api/v1/dashboard/*` | `authenticateToken` | Dashboard data access |
| `/api/v1/coach/*` | `authenticateToken` | ProofCoach functionality |
| `/api/v1/validation-map/*` | `authenticateToken` | Validation map operations |
| `/api/v1/payments/*` | `authenticateToken` | Payment processing |
| `/api/v1/activity/*` | `authenticateToken` | Activity logging |

### Mixed Authentication Example

```typescript
// Public route with optional user context
router.get('/leaderboard', optionalAuth, (req: AuthenticatedRequest, res) => {
  const isAuthenticated = !!req.user;
  // Show different data based on auth status
});
```

---

## Token Management

### JWT Logout Flow (Client-to-Server)

When a user logs out, the following end-to-end flow ensures the token is invalidated:

**1. Client Initiates Logout**:
```typescript
// In client/src/lib/auth-client.ts
async logout(): Promise<void> {
  // Call JWT logout endpoint with Bearer token
  await this.apiRequest('/logout', {
    method: 'POST',
  });
  // Clear local storage
  this.clearAuth();
}
```

**2. Server Receives Request**:
```typescript
// POST /api/auth-token/logout
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') 
              || req.cookies?.authToken;
  
  if (token) {
    // Add token to blacklist
    invalidateToken(token);
    
    // Clear HTTP-only cookie
    res.clearCookie('authToken');
  }
  
  res.json({ success: true, message: 'Logout successful - token invalidated' });
}));
```

**3. Token Becomes Invalid**:
- Token is added to the in-memory `blacklistedTokens` Set
- All subsequent requests with this token return 401 `TOKEN_INVALID`
- Cookie is cleared from the client

**Important**: The client **must** include the Bearer token in the logout request (via Authorization header or cookie) for the server to blacklist it. If no token is provided, the logout still succeeds but the token remains valid until expiry.

### Token Blacklisting (In-Memory)

The platform implements server-side JWT blacklisting to immediately invalidate tokens on logout:

```typescript
// In server/middleware/token-auth.ts
const blacklistedTokens = new Set<string>();

export function invalidateToken(token: string): void {
  blacklistedTokens.add(token);
  appLogger.auth('Token invalidated and added to blacklist');
}
```

**Blacklist Check During Verification**:
```typescript
export function verifyAuthToken(token: string): AuthToken | null {
  // Check if token is blacklisted (logged out)
  if (blacklistedTokens.has(token)) {
    appLogger.auth('Token is blacklisted (logged out)');
    return null;
  }
  
  const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
  return decoded;
}
```

### Blacklist Cleanup

A background process runs **every hour** to remove expired tokens from the blacklist, preventing memory leaks:

```typescript
// Runs every hour (60 * 60 * 1000 ms)
setInterval(() => {
  const now = Date.now() / 1000;
  const tokensToDelete: string[] = [];
  
  blacklistedTokens.forEach(token => {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp && decoded.exp < now) {
        tokensToDelete.push(token);
      }
    } catch (error) {
      // If token can't be decoded, remove it
      tokensToDelete.push(token);
    }
  });
  
  tokensToDelete.forEach(token => blacklistedTokens.delete(token));
}, 60 * 60 * 1000);
```

### Token Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│ Token Issued │────▶│  Token Used  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Blacklisted │◀────│   Logout    │
                    └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────┐           ▼
                    │   Cleaned   │◀───── After Expiry
                    └─────────────┘
```

### Limitations

| Aspect | Current Implementation | Notes |
|--------|----------------------|-------|
| Storage | In-memory `Set` | Clears on server restart |
| Scalability | Single-server only | Not shared across instances |
| Persistence | None | Blacklist lost on restart |

**Production Considerations**: For multi-server deployments, consider using Redis or a distributed cache for token blacklisting.

---

## Role-Based Access Control

### Current State: Identity/Ownership-Based Access

**The Second Chance platform does NOT implement traditional role-based access control (RBAC).** There are no role strings (e.g., "admin", "moderator", "user") stored in the database or JWT tokens.

Instead, the platform uses **identity-based and ownership-based access control**:

| Access Type | How It Works | Enforcement Point |
|-------------|--------------|-------------------|
| **Authentication** | Valid JWT token required | `authenticateToken` middleware |
| **Ownership** | `founderId` from JWT must match resource owner | Route handler logic |
| **Feature Access** | Database flags (e.g., `hasDealRoomAccess`) | Route handler logic |
| **Score Gating** | ProofScore threshold checks (70+) | Route handler logic |

### Access Control Flow

```
Request arrives
       ↓
┌──────────────────────────────────────┐
│ authenticateToken middleware         │
│ - Extracts JWT from header/cookie    │
│ - Verifies signature & expiry        │
│ - Checks not blacklisted             │
│ - Attaches req.user (founderId, etc) │
└──────────────────────────────────────┘
       ↓ (401 if fails)
┌──────────────────────────────────────┐
│ Route Handler                        │
│ - Checks req.user.founderId matches  │
│   resource owner (ownership check)   │
│ - Checks feature flags if needed     │
│ - Returns 403 if access denied       │
└──────────────────────────────────────┘
       ↓
Response
```

### Access Control Patterns

| Pattern | Implementation | Example |
|---------|---------------|---------|
| Authentication Required | `authenticateToken` middleware | All protected routes |
| Resource Ownership | `founderId` comparison in handlers | Vault file access |
| Feature Gating | Database flag checks | Deal Room access |
| Score-Based Routing | ProofScore threshold (70+) | Deal Room vs ProofScaling |

### Resource Ownership Example

```typescript
router.get('/vault/:fileId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { founderId } = req.user!;
  const file = await getFile(req.params.fileId);
  
  // Check ownership
  if (file.founderId !== founderId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  return res.json(file);
});
```

### Feature Access Example

```typescript
router.get('/deal-room', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { founderId } = req.user!;
  
  // Check if user has purchased Deal Room access
  const hasDealRoomAccess = await checkDealRoomPurchase(founderId);
  
  if (!hasDealRoomAccess) {
    return res.status(403).json({ error: 'Deal Room access required' });
  }
  
  // Proceed with Deal Room data
});
```

### No Role System

The platform does **not** currently implement traditional roles (e.g., admin, moderator, user). All authenticated founders have the same base permissions, with feature access determined by:

- **Purchase status** (one-time payments)
- **ProofScore thresholds** (automated qualification)
- **Resource ownership** (own data only)

---

## Security Best Practices

### Password Requirements

Password validation enforces:
- Minimum 8 characters
- Complexity requirements (uppercase, lowercase, numbers, special characters)
- Passwords are hashed using bcrypt before storage

### Token Security

| Practice | Implementation |
|----------|----------------|
| Secure secret | Use strong `JWT_SECRET` in production |
| Token expiry | 7-day maximum lifetime |
| Blacklisting | Immediate invalidation on logout |
| HTTPS only | Tokens transmitted securely |

### Session Security

- Session cookies are HTTP-only
- Session data stored server-side
- Session destroyed on logout

### Error Messages

Security-conscious error responses:
- Login failures: Generic "Invalid email or password"
- Forgot password: Always returns success to prevent email enumeration
- Token errors: Distinct codes (`TOKEN_MISSING`, `TOKEN_INVALID`)

### Rate Limiting

Authentication endpoints should implement rate limiting to prevent brute force attacks.

### Activity Logging

Authentication events are logged via `ActivityService`:
- Password set/reset operations
- Login events
- Security-relevant actions

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | Yes (production) |
| `SESSION_SECRET` | Secret for session encryption | Yes |

**Warning**: Never use default secrets in production. Generate strong, unique values.

---

## Error Code Reference

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `TOKEN_MISSING` | No authentication token provided | 401 |
| `TOKEN_INVALID` | Token is invalid, expired, or blacklisted | 401 |
| `EMAIL_NOT_VERIFIED` | User email not verified | 401 |
| `PASSWORD_NOT_SET` | User has not set a password | 401 |
| `INVALID_CREDENTIALS` | Wrong email or password | 401 |

---

## Integration Examples

### Protected API Endpoint

```typescript
import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/token-auth';

const router = Router();

router.get('/my-data', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { founderId, email } = req.user!;
  
  // Fetch user-specific data
  const data = await fetchUserData(founderId);
  
  res.json({ success: true, data });
});

export default router;
```

### Frontend Protected Component

```typescript
import { authClient } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

function ProtectedPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await authClient.verifyToken();
      if (!isValid) {
        window.location.href = '/login';
        return;
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  if (isLoading) return <Loading />;
  
  return <div>Protected Content</div>;
}
```

---

## File Reference

| File | Purpose |
|------|---------|
| `server/middleware/token-auth.ts` | JWT authentication middleware, token generation, blacklisting |
| `server/routes/auth-token.ts` | JWT-based auth routes (register, login, logout, verify, refresh) |
| `server/routes/auth.ts` | Session-based auth routes (email verification, password reset) |
| `server/utils/auth.ts` | Password hashing, validation, token generation utilities |
| `client/src/lib/auth-client.ts` | Frontend authentication client (AuthClient singleton) |
