// Direct Sentry transmission test
const https = require('https');

// Test direct transmission to verify connectivity
async function testSentryTransmission() {
    console.log('🔍 Testing direct Sentry transmission...');
    
    const sentryDsn = process.env.SENTRY_DSN;
    if (!sentryDsn) {
        console.log('❌ No SENTRY_DSN found');
        return;
    }
    
    console.log('✅ SENTRY_DSN found:', sentryDsn.slice(0, 20) + '...');
    
    // Parse DSN components
    const dsnMatch = sentryDsn.match(/https:\/\/([^@]+)@([^\/]+)\/(.+)/);
    if (!dsnMatch) {
        console.log('❌ Invalid DSN format');
        return;
    }
    
    const [, publicKey, host, projectId] = dsnMatch;
    console.log('📊 Parsed DSN:', { host, projectId: projectId.slice(0, 8) + '...' });
    
    // Test connectivity to Sentry
    const testUrl = `https://${host}/api/${projectId}/envelope/`;
    console.log('🌐 Testing connectivity to:', testUrl.slice(0, 50) + '...');
    
    https.get(`https://${host}/`, (res) => {
        console.log('✅ Sentry server reachable, status:', res.statusCode);
        console.log('📊 Headers:', Object.keys(res.headers));
    }).on('error', (err) => {
        console.log('❌ Cannot reach Sentry server:', err.message);
    });
}

testSentryTransmission();