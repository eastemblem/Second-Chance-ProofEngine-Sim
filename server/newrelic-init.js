// NewRelic initialization in CommonJS format
// This file must be imported before any other modules

if (process.env.NEW_RELIC_LICENSE_KEY) {
  try {
    const newrelic = require('newrelic');
    console.log('✅ NewRelic agent initialized successfully via CommonJS');
    console.log('📊 Application name: "Second Chance Platform"');
    console.log('📊 License key configured: ***' + process.env.NEW_RELIC_LICENSE_KEY.slice(-4));
    
    // Test connectivity with a custom metric
    newrelic.recordMetric('Custom/ApplicationInit', 1);
    
    module.exports = newrelic;
  } catch (error) {
    console.log('❌ NewRelic initialization failed via CommonJS');
    console.error('Error:', error.message);
    module.exports = null;
  }
} else {
  console.log('⚠️ NewRelic license key not found - monitoring disabled');
  console.log('💡 Add NEW_RELIC_LICENSE_KEY to your Replit secrets to enable monitoring');
  module.exports = null;
}