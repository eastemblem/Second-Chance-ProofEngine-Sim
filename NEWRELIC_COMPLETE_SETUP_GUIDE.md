# NewRelic Complete Setup Guide for Second Chance Platform

## Prerequisites
- NewRelic account (sign up at https://newrelic.com if needed)
- License key from your NewRelic account
- Application deployed and running with NewRelic agent

---

## Step 1: Initial Account Setup & License Key Configuration

### 1.1 Get Your License Key
1. Log into your NewRelic account at https://one.newrelic.com/
2. Click on your profile icon (top right) → Administration → API keys
3. Copy your License Key (starts with "NRAL-" for EU accounts or similar format)
4. Add it to your Replit secrets as `NEW_RELIC_LICENSE_KEY`

### 1.2 Verify Agent Installation
Your application already has NewRelic configured. Verify it's working:
- Check application logs for: `✅ NewRelic monitoring will activate once agent fully starts`
- Visit NewRelic APM dashboard to see your application listed

---

## Step 2: Dashboard Setup

### 2.1 Create Custom Dashboard
1. Navigate to **Dashboards** in NewRelic One
2. Click **Create dashboard**
3. Name it: "Second Chance - Startup Validation Platform"
4. Add the following widgets:

#### Application Performance Widget
```sql
SELECT average(duration) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
TIMESERIES
```

#### Error Rate Widget
```sql
SELECT percentage(count(*), WHERE error IS true) 
FROM Transaction 
WHERE appName = 'Second Chance Platform' 
TIMESERIES
```

#### Top Endpoints Widget
```sql
SELECT count(*) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
FACET name 
LIMIT 10
```

#### Database Performance Widget
```sql
SELECT average(databaseDuration) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
AND databaseDuration IS NOT NULL 
TIMESERIES
```

#### Memory Usage Widget
```sql
SELECT average(memoryUsedPercent) FROM SystemSample 
WHERE appName = 'Second Chance Platform' 
TIMESERIES
```

#### ProofScore Generation Performance
```sql
SELECT average(duration) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
AND name LIKE '%proofscore%' 
TIMESERIES
```

#### File Upload Performance
```sql
SELECT average(duration) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
AND name LIKE '%upload%' 
TIMESERIES
```

### 2.2 Business Metrics Dashboard
Create a second dashboard for business metrics:

#### Daily Active Users
```sql
SELECT uniqueCount(userId) FROM PageView 
WHERE appName = 'Second Chance Platform' 
TIMESERIES 1 day
```

#### Onboarding Completion Rate
```sql
SELECT percentage(count(*), WHERE name = 'onboarding_complete') 
FROM Transaction 
WHERE appName = 'Second Chance Platform' 
TIMESERIES 1 day
```

#### ProofScore Distribution
```sql
SELECT histogram(proofScore, 20, 100) FROM Custom 
WHERE eventType = 'ProofScoreGenerated'
```

---

## Step 3: Alert Policies Setup

### 3.1 Create Critical Alert Policy
1. Go to **Alerts & AI** → **Alert policies**
2. Click **New alert policy**
3. Name: "Second Chance - Critical Issues"
4. Incident preference: "By policy"

### 3.2 Add Critical Conditions

#### High Error Rate Alert
- **Condition type**: APM Application
- **Select entities**: Your application
- **Metric**: Error percentage
- **Warning threshold**: > 5% for at least 5 minutes
- **Critical threshold**: > 10% for at least 2 minutes

#### Slow Response Time Alert
- **Condition type**: APM Application  
- **Select entities**: Your application
- **Metric**: Response time (web)
- **Warning threshold**: > 2 seconds for at least 5 minutes
- **Critical threshold**: > 5 seconds for at least 2 minutes

#### High CPU Usage Alert
- **Condition type**: Infrastructure
- **Select entities**: Your server
- **Metric**: CPU percentage
- **Warning threshold**: > 80% for at least 10 minutes
- **Critical threshold**: > 95% for at least 5 minutes

#### Memory Usage Alert
- **Condition type**: Infrastructure
- **Select entities**: Your server
- **Metric**: Memory percentage
- **Warning threshold**: > 85% for at least 10 minutes
- **Critical threshold**: > 95% for at least 5 minutes

#### Database Connection Issues
- **Condition type**: APM Application
- **Select entities**: Your application
- **Metric**: Database response time
- **Warning threshold**: > 1 second for at least 5 minutes
- **Critical threshold**: > 3 seconds for at least 2 minutes

### 3.3 Create Business Alert Policy
1. Create another policy: "Second Chance - Business Metrics"

#### Low Onboarding Completion
- **Condition type**: NRQL
- **Query**: 
```sql
SELECT percentage(count(*), WHERE name = 'onboarding_complete') 
FROM Transaction 
WHERE appName = 'Second Chance Platform'
```
- **Critical threshold**: < 60% for at least 30 minutes

#### High ProofScore Generation Failures
- **Condition type**: NRQL
- **Query**: 
```sql
SELECT count(*) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
AND name LIKE '%proofscore%' 
AND error IS true
```
- **Critical threshold**: > 5 errors for at least 15 minutes

#### File Upload Failures
- **Condition type**: NRQL
- **Query**: 
```sql
SELECT count(*) FROM Transaction 
WHERE appName = 'Second Chance Platform' 
AND name LIKE '%upload%' 
AND httpResponseCode >= 400
```
- **Warning threshold**: > 3 failures for at least 10 minutes
- **Critical threshold**: > 10 failures for at least 5 minutes

---

## Step 4: Notification Channels Setup

### 4.1 Email Notifications
1. Go to **Alerts & AI** → **Notification channels**
2. Click **New notification channel**
3. Select **Email**
4. Configuration:
   - **Channel name**: "Critical Alerts Email"
   - **Email addresses**: Your email(s)
   - **Include JSON attachment**: Yes (for detailed incident data)

### 4.2 Slack Notifications (Optional)
1. Create new notification channel
2. Select **Slack**
3. Configuration:
   - **Channel name**: "Slack Alerts"
   - **Webhook URL**: Your Slack webhook URL
   - **Channel**: #alerts or #monitoring
   - **Team**: Your Slack team name

### 4.3 Webhook Notifications
1. Create new notification channel
2. Select **Webhook**
3. Configuration:
   - **Channel name**: "Custom Webhook"
   - **Base URL**: Your webhook endpoint
   - **Auth method**: Basic auth or custom headers
   - **Custom payload template**:
```json
{
  "incident_id": "{{ incident_id }}",
  "policy_name": "{{ policy_name }}",
  "condition_name": "{{ condition_name }}",
  "details": "{{ details }}",
  "incident_url": "{{ incident_url }}",
  "severity": "{{ severity }}"
}
```

---

## Step 5: Advanced Rules & Workflows

### 5.1 Workflow Rules
1. Go to **Alerts & AI** → **Workflows**
2. Click **Add workflow**
3. Configuration:
   - **Name**: "Critical Issue Response"
   - **Trigger**: When incidents are opened
   - **Filter**: Policy name = "Second Chance - Critical Issues"

### 5.2 Incident Response Automation
Create automated responses for different incident types:

#### High Error Rate Response
```javascript
// Trigger: Error rate > 10%
// Actions:
// 1. Send immediate email to dev team
// 2. Create Slack message with incident details
// 3. Scale application resources if possible
// 4. Enable debug logging
```

#### Performance Degradation Response
```javascript
// Trigger: Response time > 5 seconds
// Actions:
// 1. Check database performance
// 2. Review recent deployments
// 3. Scale infrastructure
// 4. Alert on-call engineer
```

---

## Step 6: Custom Metrics Implementation

### 6.1 Business Metrics Tracking
Your application already has NewRelic integration. Enhance it with custom metrics:

```javascript
// Add to your application code
const newrelic = require('newrelic');

// Track ProofScore generation
newrelic.recordMetric('Custom/ProofScore/Generated', 1);
newrelic.recordMetric('Custom/ProofScore/Value', proofScore);

// Track file uploads
newrelic.recordMetric('Custom/FileUpload/Success', 1);
newrelic.recordMetric('Custom/FileUpload/Size', fileSizeInMB);

// Track user onboarding steps
newrelic.recordMetric('Custom/Onboarding/StepCompleted', stepNumber);
```

### 6.2 Performance Tracking
```javascript
// Track custom timing
const timer = newrelic.createTracer('Custom/ProofScoreGeneration', function() {
  // Your ProofScore generation logic
});

// Track database queries
newrelic.addCustomAttributes({
  'query.type': 'select',
  'query.table': 'users',
  'query.duration': queryTime
});
```

---

## Step 7: Synthetic Monitoring

### 7.1 Create Synthetic Monitor
1. Go to **Synthetic Monitoring**
2. Click **Create monitor**
3. Select **Ping monitor**
4. Configuration:
   - **Monitor name**: "Second Chance Platform Uptime"
   - **URL**: Your application URL
   - **Locations**: Select multiple geographic locations
   - **Frequency**: Every 1 minute

### 7.2 Scripted Browser Monitor
Create a scripted monitor to test critical user flows:

```javascript
// Test onboarding flow
$browser.get('https://your-app.replit.dev')
.then(function() {
  return $browser.findElement($driver.By.linkText('Start Your Journey'));
})
.then(function(startButton) {
  return startButton.click();
})
.then(function() {
  return $browser.waitForAndFindElement($driver.By.id('founder-form'));
})
.then(function() {
  // Verify onboarding form loads
  console.log('Onboarding flow accessible');
});
```

---

## Step 8: Performance Baselines & SLA Targets

### 8.1 Define Performance Baselines
- **Response Time**: < 500ms for 95% of requests
- **Error Rate**: < 1% of all requests
- **Uptime**: 99.9% availability
- **Database Response**: < 100ms for queries
- **Memory Usage**: < 80% of available memory
- **CPU Usage**: < 70% under normal load

### 8.2 Business KPI Targets
- **Onboarding Completion**: > 75%
- **ProofScore Generation Success**: > 98%
- **File Upload Success**: > 99%
- **User Session Duration**: > 5 minutes average

---

## Step 9: Alert Testing & Validation

### 9.1 Test Alert Conditions
1. Manually trigger test conditions:
   - Generate high load to test performance alerts
   - Cause intentional errors to test error rate alerts
   - Simulate database issues

### 9.2 Validate Notification Delivery
1. Check email delivery for critical alerts
2. Verify Slack notifications work correctly
3. Test webhook payload format and delivery

---

## Step 10: Ongoing Maintenance

### 10.1 Regular Review Schedule
- **Daily**: Review critical alerts and incidents
- **Weekly**: Analyze performance trends and optimize thresholds
- **Monthly**: Update dashboards and add new business metrics
- **Quarterly**: Review and adjust SLA targets

### 10.2 Dashboard Optimization
- Add new widgets based on application features
- Remove outdated or irrelevant metrics
- Optimize query performance for complex widgets
- Share dashboards with relevant team members

---

## Troubleshooting Common Issues

### Issue: No Data Appearing
**Solutions:**
1. Verify NEW_RELIC_LICENSE_KEY is correctly set
2. Check application logs for NewRelic agent errors
3. Ensure agent is properly installed and configured
4. Verify firewall settings allow NewRelic connections

### Issue: High False Positive Alerts
**Solutions:**
1. Adjust alert thresholds based on baseline performance
2. Increase time windows for transient issues
3. Add condition filters to exclude known maintenance periods
4. Use anomaly detection instead of static thresholds

### Issue: Missing Custom Metrics
**Solutions:**
1. Verify custom metric code is executing
2. Check metric names follow NewRelic naming conventions
3. Ensure metrics are being recorded at appropriate frequency
4. Review application logs for custom metric errors

---

## Next Steps

1. **Start with basic setup**: License key, basic alerts, and email notifications
2. **Add business metrics**: Custom dashboards for ProofScore and user engagement
3. **Implement advanced monitoring**: Synthetic tests and workflow automation
4. **Optimize over time**: Adjust thresholds and add new metrics as needed

This comprehensive setup will provide enterprise-grade monitoring for your startup validation platform with proactive alerting and detailed performance insights.