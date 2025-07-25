# NewRelic Integration Setup Guide for Second Chance Platform

## Current Status: 🔴 NOT WORKING

The NewRelic agent is failing to initialize properly despite having a valid license key. Here's the complete troubleshooting guide:

## Problem Analysis

### License Key Status ✅
- **License Key**: Present and valid (40 characters: `b27cca1825...`)
- **Environment Variable**: `NEW_RELIC_LICENSE_KEY` is correctly set in Replit secrets
- **Configuration File**: `newrelic.js` exists with correct app name "Second Chance Platform"

### Technical Issues Found 🔴

1. **ES Module Compatibility**: NewRelic agent requires CommonJS import but project uses ES modules
2. **Agent Initialization**: Agent loads but `recordMetric` function is not available
3. **Error Message**: "NewRelic agent not properly loaded"

## Current Implementation Attempts

### 1. ES Module Import with createRequire ❌
```typescript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const newrelic = require('newrelic');
```
**Status**: Agent loads but core functions unavailable

### 2. Dynamic Import ❌
```typescript
const newrelicModule = await import('newrelic');
const newrelic = newrelicModule.default || newrelicModule;
```
**Status**: Module compatibility issues

### 3. CommonJS Initialization File ❌
Created `server/newrelic-init.js` but can't modify package.json scripts due to restrictions

## Required Solutions

### Option 1: Pre-require Hook (RECOMMENDED)
1. Create initialization script that loads NewRelic before main application
2. Modify startup command to preload NewRelic
3. Use `-r` flag with Node.js to require NewRelic first

### Option 2: Convert to CommonJS
1. Change project type from "module" to CommonJS
2. Update all imports to require() statements
3. This is a major architectural change

### Option 3: NewRelic ES Module Support
1. Use newer NewRelic agent version with ES module support
2. May require upgrading from v13.0.0 to latest version

## Verification Steps

Once working, you should see in NewRelic dashboard:
- Application name: "Second Chance Platform"
- Custom metrics: `Custom/ApplicationStart`, `Custom/API*`, `Custom/APIResponse`
- Error tracking for API endpoints with status codes >= 400
- Performance monitoring for all routes

## Current Console Output
```
❌ NewRelic initialization failed - monitoring disabled
Error details: NewRelic agent not properly loaded
💡 Verify your NEW_RELIC_LICENSE_KEY is valid in your Replit secrets
```

## Next Steps

1. **Test API endpoint**: `/api/newrelic-test` (currently returns 404 due to routing issues)
2. **Fix route mounting**: NewRelic test endpoint not accessible
3. **Implement working initialization**: Choose one of the three options above
4. **Verify in NewRelic dashboard**: Check for "Second Chance Platform" application

## Expected NewRelic Dashboard Data

Once working, you should see:
- **Application**: Second Chance Platform
- **Environment**: Development (later Production)
- **Custom Metrics**: API response times, error rates, startup events
- **Error Tracking**: Failed requests and exceptions
- **Performance**: Database queries, external API calls, memory usage