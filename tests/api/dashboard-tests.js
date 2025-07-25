// Dashboard API testing script
import http from 'http';
import querystring from 'querystring';

async function testDashboardAPI(endpoint, founderId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-founder-id': founderId, // Custom header for testing
        'x-test-session': 'true' // Indicate this is a test request
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  const founderId = '79929a28-3454-450a-b634-118a27a6d9ef';
  
  console.log('=== DASHBOARD API TESTING ===');
  
  try {
    // Test validation API
    console.log('\n1. Testing /api/dashboard/validation');
    const validationResponse = await testDashboardAPI('/api/dashboard/validation', founderId);
    console.log(`Status: ${validationResponse.statusCode}`);
    console.log(`Body: ${validationResponse.body}`);
    
    // Test vault API
    console.log('\n2. Testing /api/dashboard/vault');
    const vaultResponse = await testDashboardAPI('/api/dashboard/vault', founderId);
    console.log(`Status: ${vaultResponse.statusCode}`);
    console.log(`Body: ${vaultResponse.body}`);
    
    // Test activity API
    console.log('\n3. Testing /api/dashboard/activity');
    const activityResponse = await testDashboardAPI('/api/dashboard/activity', founderId);
    console.log(`Status: ${activityResponse.statusCode}`);
    console.log(`Body: ${activityResponse.body}`);
    
    console.log('\n=== TESTING COMPLETE ===');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

runTests();