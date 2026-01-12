# Domain-Based Branding & Program Tracking System

## Overview

This document describes the architecture for implementing domain-based branding with program/client tracking in a startup validation platform. The system allows a single codebase to serve multiple branded experiences based on the domain users access, while tracking which program or client referred each user.

## Business Requirements

### Multi-Tenant Branding
- Different domains display different branding (logo, colors, company name)
- Each domain can be associated with a specific program and/or client
- Email communications reflect the appropriate branding
- SEO metadata varies per domain

### Program/Client Hierarchy
```
Programs (e.g., "Second Chance Residency", "GTM Accelerator", "Validation Residency")
    ↓
Clients (organizations that sponsor or join programs)
    ↓
Founders (users who onboard under a specific client and program)
```

### Tracking Requirements
- Track which domain a user came from during onboarding
- Associate founders and ventures with their source program/client
- Enable analytics and filtering by program/client
- Support payment attribution to specific programs

---

## Database Schema

### New Tables

#### 1. `programs`
Stores program definitions.

```typescript
export const programs = pgTable("programs", {
  programId: uuid("program_id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-friendly identifier
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Example data:**
| programId | name | slug |
|-----------|------|------|
| uuid-1 | Second Chance Residency | second-chance-residency |
| uuid-2 | GTM Accelerator | gtm-accelerator |
| uuid-3 | Validation Residency | validation-residency |

#### 2. `clients`
Stores client organizations that participate in programs.

```typescript
export const clients = pgTable("clients", {
  clientId: uuid("client_id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  contactEmail: varchar("contact_email", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### 3. `client_programs`
Join table linking clients to programs (many-to-many).

```typescript
export const clientPrograms = pgTable("client_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.clientId).notNull(),
  programId: uuid("program_id").references(() => programs.programId).notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 4. `domain_branding`
Maps domains to branding configurations and program/client associations.

```typescript
export const domainBranding = pgTable("domain_branding", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: varchar("domain", { length: 255 }).notNull().unique(), // e.g., "gtm.secondchance.com"
  programId: uuid("program_id").references(() => programs.programId),
  clientId: uuid("client_id").references(() => clients.clientId),
  
  // Branding
  brandName: varchar("brand_name", { length: 200 }).notNull(),
  tagline: varchar("tagline", { length: 500 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  faviconUrl: varchar("favicon_url", { length: 500 }),
  
  // Theme colors (HSL format for CSS variables)
  primaryColor: varchar("primary_color", { length: 50 }), // e.g., "263 70% 64%"
  secondaryColor: varchar("secondary_color", { length: 50 }),
  accentColor: varchar("accent_color", { length: 50 }),
  
  // SEO
  seoTitle: varchar("seo_title", { length: 200 }),
  seoDescription: text("seo_description"),
  
  // Email
  emailFromName: varchar("email_from_name", { length: 100 }),
  emailLogoUrl: varchar("email_logo_url", { length: 500 }),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Example data:**
| domain | brandName | programId | primaryColor |
|--------|-----------|-----------|--------------|
| app.secondchance.com | Second Chance | null | 263 70% 64% |
| gtm.secondchance.com | GTM Accelerator | uuid-2 | 200 80% 50% |
| residency.client.com | Validation Residency | uuid-3 | 150 60% 45% |

### Schema Modifications to Existing Tables

#### `founder` table - add columns:
```typescript
programId: uuid("program_id").references(() => programs.programId),
clientId: uuid("client_id").references(() => clients.clientId),
sourceDomain: varchar("source_domain", { length: 255 }),
```

#### `venture` table - add columns:
```typescript
programId: uuid("program_id").references(() => programs.programId),
clientId: uuid("client_id").references(() => clients.clientId),
```

#### `preOnboardingPayments` table - add columns:
```typescript
programId: uuid("program_id").references(() => programs.programId),
clientId: uuid("client_id").references(() => clients.clientId),
sourceDomain: varchar("source_domain", { length: 255 }),
```

---

## Backend Architecture

### 1. Domain Resolution Middleware

**File:** `server/middleware/branding.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface BrandingConfig {
  domain: string;
  brandName: string;
  programId: string | null;
  clientId: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  emailFromName: string;
  emailLogoUrl: string | null;
}

// Cache branding configs (refresh every 5 minutes)
const brandingCache = new Map<string, { config: BrandingConfig; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function resolveBranding(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host') || req.get('x-forwarded-host') || 'localhost';
  const domain = host.split(':')[0]; // Remove port if present
  
  let branding = getCachedBranding(domain);
  
  if (!branding) {
    branding = await storage.getDomainBranding(domain);
    if (branding) {
      cacheBranding(domain, branding);
    } else {
      branding = getDefaultBranding(domain);
    }
  }
  
  // Attach to request for downstream use
  (req as any).branding = branding;
  next();
}

function getDefaultBranding(domain: string): BrandingConfig {
  return {
    domain,
    brandName: 'Second Chance',
    programId: null,
    clientId: null,
    logoUrl: process.env.LOGO_URL || null,
    primaryColor: '263 70% 64%',
    secondaryColor: '240 4% 16%',
    accentColor: '45 93% 58%',
    seoTitle: 'Second Chance - Startup Validation Platform',
    seoDescription: 'Validate your startup idea with data-driven insights',
    emailFromName: 'Second Chance',
    emailLogoUrl: process.env.LOGO_URL || null,
  };
}
```

### 2. Branding API Endpoint

**File:** `server/routes/branding.ts`

```typescript
import { Router } from 'express';

const router = Router();

// GET /api/branding - Returns branding config for current domain
router.get('/', (req, res) => {
  const branding = (req as any).branding;
  
  res.json({
    brandName: branding.brandName,
    logoUrl: branding.logoUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    accentColor: branding.accentColor,
    seoTitle: branding.seoTitle,
    seoDescription: branding.seoDescription,
    programId: branding.programId,
    clientId: branding.clientId,
  });
});

export default router;
```

### 3. Pre-Onboarding Payment Flow Updates

**File:** `server/services/pre-onboarding-payment-service.ts`

When initiating a payment, capture the domain context:

```typescript
async initiatePayment(data: PaymentInitData, req: Request) {
  const branding = (req as any).branding;
  
  const payment = await storage.createPreOnboardingPayment({
    email: data.email,
    name: data.name,
    amount: data.amount,
    currency: data.currency,
    // Capture program/client from domain
    programId: branding.programId,
    clientId: branding.clientId,
    sourceDomain: branding.domain,
    // ... other fields
  });
  
  return payment;
}
```

### 4. Onboarding Flow Updates

**File:** `server/services/onboarding-service.ts`

When creating founder and venture records, propagate the program/client:

```typescript
async createFounderFromPayment(paymentId: string, founderData: FounderData) {
  const payment = await storage.getPreOnboardingPayment(paymentId);
  
  const founder = await storage.createFounder({
    ...founderData,
    programId: payment.programId,
    clientId: payment.clientId,
    sourceDomain: payment.sourceDomain,
    userType: 'individual',
  });
  
  return founder;
}

async createVenture(founderId: string, ventureData: VentureData) {
  const founder = await storage.getFounder(founderId);
  
  const venture = await storage.createVenture({
    ...ventureData,
    founderId,
    programId: founder.programId,
    clientId: founder.clientId,
  });
  
  return venture;
}
```

### 5. Email Service Updates

**File:** `server/services/emailService.ts`

Resolve branding when sending emails:

```typescript
async sendOnboardingEmail(founderEmail: string, founderName: string, ...) {
  // Get founder to access their source domain
  const founder = await storage.getFounderByEmail(founderEmail);
  
  let branding = getDefaultBranding();
  if (founder?.sourceDomain) {
    branding = await storage.getDomainBranding(founder.sourceDomain) || branding;
  }
  
  // Use branded values in email
  const templateData = {
    LOGO_URL: branding.emailLogoUrl || branding.logoUrl,
    COMPANY_NAME: branding.brandName,
    FROM_NAME: branding.emailFromName,
    // ... other fields
  };
}
```

### 6. Verification URL Generation

Update to use the source domain for verification links:

```typescript
async generateVerificationUrl(founder: Founder, token: string) {
  // Use founder's source domain for the verification link
  let baseUrl = process.env.FRONTEND_URL;
  
  if (founder.sourceDomain) {
    const branding = await storage.getDomainBranding(founder.sourceDomain);
    if (branding) {
      baseUrl = `https://${founder.sourceDomain}`;
    }
  }
  
  return `${baseUrl}/api/auth/verify-email?token=${token}`;
}
```

---

## Frontend Architecture

### 1. Branding Context Provider

**File:** `client/src/contexts/BrandingContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface BrandingConfig {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  programId: string | null;
  clientId: string | null;
}

const defaultBranding: BrandingConfig = {
  brandName: 'Second Chance',
  logoUrl: null,
  primaryColor: '263 70% 64%',
  secondaryColor: '240 4% 16%',
  accentColor: '45 93% 58%',
  seoTitle: 'Second Chance - Startup Validation Platform',
  seoDescription: 'Validate your startup idea with data-driven insights',
  programId: null,
  clientId: null,
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  
  const { data } = useQuery<BrandingConfig>({
    queryKey: ['/api/branding'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  useEffect(() => {
    if (data) {
      setBranding(data);
      applyThemeColors(data);
      updateSEO(data);
    }
  }, [data]);
  
  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

function applyThemeColors(branding: BrandingConfig) {
  const root = document.documentElement;
  root.style.setProperty('--primary', branding.primaryColor);
  root.style.setProperty('--secondary', branding.secondaryColor);
  root.style.setProperty('--primary-gold', branding.accentColor);
}

function updateSEO(branding: BrandingConfig) {
  document.title = branding.seoTitle;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', branding.seoDescription);
  }
}
```

### 2. App Integration

**File:** `client/src/App.tsx`

```typescript
import { BrandingProvider } from './contexts/BrandingContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        {/* ... rest of app */}
      </BrandingProvider>
    </QueryClientProvider>
  );
}
```

### 3. Logo Component Usage

```typescript
import { useBranding } from '@/contexts/BrandingContext';

function Logo() {
  const { logoUrl, brandName } = useBranding();
  
  if (logoUrl) {
    return <img src={logoUrl} alt={brandName} className="h-8" />;
  }
  
  return <span className="font-bold text-xl gradient-text">{brandName}</span>;
}
```

### 4. CSS Variables Structure

**File:** `client/src/index.css`

The existing CSS variables will be dynamically overwritten by the BrandingProvider:

```css
:root {
  /* Default theme - overwritten at runtime for other domains */
  --primary: 263 70% 64%;        /* Purple */
  --secondary: 240 4% 16%;       /* Dark gray */
  --primary-gold: 45 93% 58%;    /* Gold accent */
  
  /* These remain constant across all brands */
  --background: 240 10% 6%;
  --foreground: 0 0% 98%;
  --card: 240 10% 10%;
  /* ... */
}
```

---

## Data Flow

### User Onboarding Journey

```
1. User visits gtm.secondchance.com
   ↓
2. Frontend fetches /api/branding
   → Returns GTM Accelerator branding + programId
   ↓
3. User clicks "Get Started" → Pre-onboarding payment modal
   ↓
4. Payment initiated with programId, clientId, sourceDomain attached
   ↓
5. Payment completed → Reservation token issued
   ↓
6. User proceeds to onboarding
   ↓
7. Founder record created with programId, clientId, sourceDomain
   ↓
8. Venture record created with programId, clientId
   ↓
9. Welcome email sent with GTM Accelerator branding
   ↓
10. Verification link points to gtm.secondchance.com
```

### Analytics Queries

**Founders by Program:**
```sql
SELECT p.name, COUNT(f.founder_id) as founder_count
FROM founder f
JOIN programs p ON f.program_id = p.program_id
GROUP BY p.name;
```

**Revenue by Client:**
```sql
SELECT c.name, SUM(CAST(pop.amount AS DECIMAL)) as total_revenue
FROM pre_onboarding_payments pop
JOIN clients c ON pop.client_id = c.client_id
WHERE pop.status = 'completed'
GROUP BY c.name;
```

**Founders by Source Domain:**
```sql
SELECT source_domain, COUNT(*) as founder_count
FROM founder
WHERE source_domain IS NOT NULL
GROUP BY source_domain
ORDER BY founder_count DESC;
```

---

## Migration Strategy

### Step 1: Create New Tables
Run schema migration to create programs, clients, client_programs, domain_branding tables.

### Step 2: Add Columns to Existing Tables
Add nullable programId, clientId, sourceDomain columns to founder, venture, preOnboardingPayments.

### Step 3: Seed Initial Data
Insert default program and domain_branding entries for existing domains.

### Step 4: Deploy Backend Changes
Deploy middleware, API endpoint, and service updates.

### Step 5: Deploy Frontend Changes
Deploy BrandingProvider and component updates.

### Step 6: Backfill Existing Data (Optional)
For existing users, programId/clientId remain null (legacy users).

---

## Configuration Examples

### Adding a New Domain

1. Insert into `domain_branding`:
```sql
INSERT INTO domain_branding (
  domain, brand_name, program_id, primary_color, 
  logo_url, seo_title, email_from_name
) VALUES (
  'newprogram.example.com',
  'New Program',
  'uuid-of-program',
  '180 70% 50%',
  'https://cdn.example.com/logo.png',
  'New Program - Startup Validation',
  'New Program Team'
);
```

2. Configure DNS to point to your application.

3. Users accessing that domain will automatically see the new branding.

### Adding a New Program

1. Insert into `programs`:
```sql
INSERT INTO programs (name, slug, description)
VALUES ('New Accelerator', 'new-accelerator', 'Description here');
```

2. Link to domain_branding if needed.

### Adding a Client to a Program

1. Insert into `clients`:
```sql
INSERT INTO clients (name, slug, contact_email)
VALUES ('Partner Corp', 'partner-corp', 'contact@partner.com');
```

2. Link to program via `client_programs`:
```sql
INSERT INTO client_programs (client_id, program_id, start_date)
VALUES ('client-uuid', 'program-uuid', '2026-01-01');
```

3. Optionally create a domain_branding entry for client-specific domain.

---

## Security Considerations

1. **Domain Validation**: Only serve branding for domains in the database
2. **Cache Invalidation**: Clear cache when branding config changes
3. **Email Spoofing**: Verify sender domain matches branding domain
4. **Cross-Domain Data**: Ensure users can only access their own data regardless of domain
5. **CORS Configuration**: Update CORS to allow requests from all configured domains

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LOGO_URL` | Default logo URL (fallback) | https://cdn.example.com/logo.png |
| `FRONTEND_URL` | Default frontend URL | https://app.secondchance.com |
| `DEFAULT_BRAND_NAME` | Default brand name | Second Chance |

---

## Testing Checklist

- [ ] Default branding loads when domain not in database
- [ ] Custom branding loads for configured domains
- [ ] Colors apply correctly to all UI components
- [ ] Logo displays in header and emails
- [ ] SEO metadata updates per domain
- [ ] Payment records include correct programId/clientId
- [ ] Founder records include correct programId/clientId/sourceDomain
- [ ] Venture records inherit programId/clientId from founder
- [ ] Verification emails link to correct domain
- [ ] Analytics queries return correct program/client breakdowns
- [ ] Cache invalidation works when branding config changes
- [ ] CORS allows requests from all configured domains

---

## Implementation Checklist

1. [ ] Create new database tables (programs, clients, client_programs, domain_branding)
2. [ ] Add columns to existing tables (founder, venture, preOnboardingPayments)
3. [ ] Create storage.ts CRUD operations for new tables
4. [ ] Build domain resolution middleware
5. [ ] Create /api/branding endpoint
6. [ ] Update pre-onboarding payment service to capture domain context
7. [ ] Update onboarding service to propagate program/client
8. [ ] Create BrandingProvider for frontend
9. [ ] Update components to use branding context
10. [ ] Update email service for branded emails
11. [ ] Seed initial program and domain data
12. [ ] Update CORS configuration for multiple domains
13. [ ] Test end-to-end flow for each configured domain
