// Test script to send all email templates
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'test@example.com';

const emailTests = [
  {
    name: 'Email Verification',
    endpoint: '/api/email/send-template',
    data: {
      email: TEST_EMAIL,
      subject: '🔐 Email Verification Test - Second Chance',
      templateName: 'email-verification',
      templateData: {
        USER_NAME: 'John Doe',
        VERIFICATION_URL: 'https://secondchance.replit.app/verify?token=test123',
        HOST_URL: 'https://secondchance.replit.app',
        PRIVACY_URL: 'https://secondchance.replit.app/privacy',
        TERMS_URL: 'https://secondchance.replit.app/terms',
        CURRENT_YEAR: '2025',
        LOGO_URL: 'https://secondchance.replit.app/logo.png'
      }
    }
  },
  {
    name: 'Password Reset',
    endpoint: '/api/email/send-template',
    data: {
      email: TEST_EMAIL,
      subject: '🔑 Password Reset Test - Second Chance',
      templateName: 'password-reset',
      templateData: {
        USER_NAME: 'John Doe',
        RESET_URL: 'https://secondchance.replit.app/reset-password/test-token-123',
        HOST_URL: 'https://secondchance.replit.app',
        PRIVACY_URL: 'https://secondchance.replit.app/privacy',
        TERMS_URL: 'https://secondchance.replit.app/terms',
        CURRENT_YEAR: '2025',
        LOGO_URL: 'https://secondchance.replit.app/logo.png'
      }
    }
  },
  {
    name: 'Welcome Email',
    endpoint: '/api/email/send-template',
    data: {
      email: TEST_EMAIL,
      subject: '🎉 Welcome Test - Second Chance',
      templateName: 'welcome-email',
      templateData: {
        USER_NAME: 'John Doe',
        HOST_URL: 'https://secondchance.replit.app',
        PRIVACY_URL: 'https://secondchance.replit.app/privacy',
        TERMS_URL: 'https://secondchance.replit.app/terms',
        CURRENT_YEAR: '2025',
        LOGO_URL: 'https://secondchance.replit.app/logo.png'
      }
    }
  },
  {
    name: 'Progress Update',
    endpoint: '/api/email/send-template',
    data: {
      email: TEST_EMAIL,
      subject: '📊 Progress Update Test - Second Chance',
      templateName: 'progress-update',
      templateData: {
        USER_NAME: 'John Doe',
        TOTAL_SCORE: '85',
        DESIRABILITY_SCORE: '18',
        DESIRABILITY_PERCENTAGE: '90',
        FEASIBILITY_SCORE: '16',
        FEASIBILITY_PERCENTAGE: '80',
        VIABILITY_SCORE: '17',
        VIABILITY_PERCENTAGE: '85',
        TRACTION_SCORE: '15',
        TRACTION_PERCENTAGE: '75',
        READINESS_SCORE: '19',
        READINESS_PERCENTAGE: '95',
        HOST_URL: 'https://secondchance.replit.app',
        PRIVACY_URL: 'https://secondchance.replit.app/privacy',
        TERMS_URL: 'https://secondchance.replit.app/terms',
        CURRENT_YEAR: '2025',
        LOGO_URL: 'https://secondchance.replit.app/logo.png'
      }
    }
  },
  {
    name: 'Onboarding Complete',
    endpoint: '/api/email/send-onboarding',
    data: {
      email: TEST_EMAIL,
      userName: 'John Doe',
      proofScore: 85,
      scoreBreakdown: {
        desirability: 18,
        feasibility: 16,
        viability: 17,
        traction: 15,
        readiness: 19
      },
      proofTags: ['Problem Validator', 'Solution Builder', 'Market Researcher'],
      reportUrl: 'https://app.box.com/s/test-report-url',
      certificateUrl: 'https://app.box.com/s/test-certificate-url'
    }
  }
];

async function sendTestEmail(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(test.data)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${test.name}: SUCCESS`);
      console.log(`   Response: ${result.message || 'Email sent successfully'}`);
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ ${test.name}: ERROR`);
    console.log(`   Exception: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Email Template Tests');
  console.log(`📧 Test email address: ${TEST_EMAIL}`);
  
  for (const test of emailTests) {
    await sendTestEmail(test);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 Test Summary Complete');
  console.log('Check your email inbox for test emails with new dashboard styling!');
}

runAllTests().catch(console.error);