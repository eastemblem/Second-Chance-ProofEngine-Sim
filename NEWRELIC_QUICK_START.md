# NewRelic Quick Start - 5 Minute Setup

## Step 1: Get License Key (2 minutes)
1. Go to https://one.newrelic.com/
2. Profile → Administration → API keys
3. Copy License Key (starts with "NRAL-")
4. Add to Replit Secrets: `NEW_RELIC_LICENSE_KEY = your_license_key`

## Step 2: Restart Application (1 minute)
Your app already has NewRelic configured. Just restart to activate:
- Click "Restart" in Replit or wait for auto-restart
- Look for log: `✅ NewRelic monitoring activated`

## Step 3: Create Basic Dashboard (2 minutes)
1. In NewRelic → Dashboards → Create dashboard
2. Name: "Second Chance Platform"
3. Add widgets:
   - **Response Time**: `SELECT average(duration) FROM Transaction TIMESERIES`
   - **Error Rate**: `SELECT percentage(count(*), WHERE error IS true) FROM Transaction TIMESERIES`
   - **Top Pages**: `SELECT count(*) FROM Transaction FACET name LIMIT 10`

## That's it! You now have:
✅ Performance monitoring active
✅ Error tracking enabled  
✅ Custom dashboard with key metrics
✅ Ready for advanced setup using full guide

Next: Follow NEWRELIC_COMPLETE_SETUP_GUIDE.md for alerts and advanced features.