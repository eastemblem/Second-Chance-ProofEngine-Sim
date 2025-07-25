# NewRelic Integration Guide for Second Chance Platform

## Step 1: Create NewRelic Account & Get License Key

### 1.1 Sign Up for NewRelic
1. Go to [https://newrelic.com/signup](https://newrelic.com/signup)
2. Create a free account (provides 100GB of data ingest per month)
3. Choose "APM & Services" during setup
4. Select "Node.js" as your technology stack

### 1.2 Get Your License Key
1. After account creation, go to [https://one.newrelic.com/launcher/api-keys-ui.api-keys-launcher](https://one.newrelic.com/launcher/api-keys-ui.api-keys-launcher)
2. Click "Create a key" → "Ingest - License"
3. Name it "Second Chance Platform"
4. Copy the license key (starts with "NRAK-")

## Step 2: Add License Key to Replit Secrets

### 2.1 Configure Environment Variable
1. In your Replit project, click on "Secrets" tab (🔒 icon in sidebar)
2. Add a new secret:
   - **Key**: `NEW_RELIC_LICENSE_KEY`
   - **Value**: Your license key from Step 1.2 (starts with "NRAK-")
3. Click "Add Secret"

### 2.2 Verify Secret Configuration
The secret will be automatically available as `process.env.NEW_RELIC_LICENSE_KEY` in your application.

## Step 3: NewRelic Package Installation (Already Done)

The NewRelic package has been installed automatically:
```bash
# This is already done for you
npm install newrelic
```

## Step 4: Configuration Files (Already Created)

### 4.1 NewRelic Configuration File
The `newrelic.js` file has been created in your project root with:
- Application name: "Second Chance Platform"
- Distributed tracing enabled
- Logging configuration
- Error collection settings
- Performance monitoring settings

### 4.2 Server Integration
The server startup (`server/index.ts`) has been updated to:
- Import NewRelic as the first module (required for proper instrumentation)
- Initialize the agent only when license key is present
- Provide startup confirmation

## Step 5: Middleware Integration (Already Implemented)

### 5.1 NewRelic Middleware Features
Our implementation includes:

**Business Metrics Tracking:**
- File uploads count and size
- ProofScore generation events
- Onboarding completion steps
- Vault operations
- Certificate downloads

**Performance Monitoring:**
- API response times
- Database query performance
- Cache hit/miss rates
- External API call timing
- Memory usage tracking

**Error Tracking:**
- Automatic error collection
- Custom error attributes (founderId, endpoint, correlationId)
- Error rate monitoring
- Status code tracking

**Custom Attributes:**
- Founder ID for user-specific analysis
- API endpoints and methods
- User agent and IP tracking
- Correlation IDs for request tracing

## Step 6: Test NewRelic Integration

### 6.1 Restart Application
1. The application will automatically restart when you add the secret
2. Look for this log message: `📊 NewRelic agent initialized`
3. If you see it, NewRelic is working correctly

### 6.2 Generate Test Data
1. Navigate to your application
2. Perform these actions to generate metrics:
   - Upload files to generate file upload metrics
   - Navigate between pages for page view tracking
   - Trigger API calls for performance metrics
   - Generate some errors (404s) for error tracking

### 6.3 View Data in NewRelic Dashboard
1. Go to [https://one.newrelic.com](https://one.newrelic.com)
2. Click "APM & Services"
3. You should see "Second Chance Platform" listed
4. Click on it to view:
   - **Overview**: Response time, throughput, error rate
   - **Transactions**: Individual API endpoint performance
   - **Errors**: Error details and stack traces
   - **Databases**: Query performance and slow queries
   - **External services**: Third-party API call performance

## Step 7: Custom Dashboard Setup

### 7.1 Business Metrics Dashboard
Create custom dashboards to track:
- Daily file uploads by category
- ProofScore generation trends
- User onboarding completion rates
- API performance by endpoint
- Error rates by feature

### 7.2 Alert Configuration
Set up alerts for:
- Error rate > 5%
- Response time > 2 seconds
- File upload failures
- Database query time > 1 second
- API availability < 99%

## Step 8: Advanced Features

### 8.1 Custom Events
The platform automatically sends custom events:
```javascript
// Example custom events being tracked
newrelic.recordCustomEvent('FileUpload', {
  category: 'Problem_Proof',
  fileSize: 1024000,
  founderId: 'uuid',
  success: true
});

newrelic.recordCustomEvent('ProofScoreGenerated', {
  score: 85,
  founderId: 'uuid',
  dimensions: {
    desirability: 18,
    feasibility: 17,
    viability: 20,
    traction: 15,
    readiness: 15
  }
});
```

### 8.2 Performance Tracking
Monitor specific business operations:
- Onboarding funnel conversion rates
- File processing times by category
- Vault access patterns
- Certificate generation success rates

## Step 9: Troubleshooting

### 9.1 Common Issues

**Issue**: "NewRelic not configured" message
**Solution**: Verify `NEW_RELIC_LICENSE_KEY` secret is set correctly

**Issue**: No data in NewRelic dashboard
**Solution**: 
- Ensure license key starts with "NRAK-"
- Check that application is generating traffic
- Wait 5-10 minutes for data to appear

**Issue**: High data usage
**Solution**: Adjust sampling rates in `newrelic.js` configuration

### 9.2 Verification Commands
```bash
# Check if NewRelic is loaded (should show agent status)
curl http://localhost:5000/api/health

# Verify custom metrics are being sent
# Check NewRelic logs for custom event confirmations
```

## Step 10: Cost Management

### 10.1 Free Tier Limits
- 100GB data ingest per month
- 1 host
- 3-day data retention

### 10.2 Data Optimization
The configuration automatically:
- Excludes sensitive headers (cookies, authorization)
- Samples transactions appropriately
- Focuses on business-critical metrics
- Optimizes log forwarding

## Monitoring ROI

With NewRelic integrated, you'll have visibility into:
- **Performance**: Which features are slow and need optimization
- **Usage**: How founders use the platform and where they drop off
- **Reliability**: Error rates and system availability
- **Business Impact**: File upload trends, ProofScore patterns, user engagement

This observability will help you:
1. Optimize performance bottlenecks
2. Improve user experience
3. Scale effectively
4. Prevent issues before they impact users
5. Make data-driven product decisions

## Next Steps After Integration

1. **Set up alerts** for critical business metrics
2. **Create custom dashboards** for stakeholder reporting
3. **Monitor performance trends** over time
4. **Use insights** to optimize high-traffic endpoints
5. **Track business KPIs** through custom events

Your NewRelic integration is now complete and production-ready!