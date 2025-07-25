// Simple test to manually create an activity record
import { storage } from './server/storage.js';

const testActivity = {
  founderId: '895aba7f-2dc8-44df-84a0-44bf2d9f9fea', // Real founder ID from console logs
  ventureId: null,
  sessionId: 'test-session',
  activityType: 'system',
  action: 'test',
  title: 'Manual Activity Test',
  description: 'Testing activity creation manually',
  metadata: { test: true },
  entityId: null,
  entityType: null,
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent'
};

async function testActivityCreation() {
  try {
    console.log('Creating test activity...');
    const result = await storage.createUserActivity(testActivity);
    console.log('✅ Activity created:', result);
    
    // Now check if it was saved
    const activities = await storage.getUserActivities('895aba7f-2dc8-44df-84a0-44bf2d9f9fea', 1);
    console.log('📋 Recent activities:', activities);
  } catch (error) {
    console.error('❌ Error creating activity:', error);
  }
}

testActivityCreation();