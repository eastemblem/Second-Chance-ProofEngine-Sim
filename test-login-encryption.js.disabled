#!/usr/bin/env node

// Test script to verify login route encryption using unified standard
const crypto = require('crypto');

// Simulate frontend encryption using unified standard (matching our implementation)
function unifiedEncrypt(data, sessionSecret) {
  // SHA-256 key derivation (matches frontend)
  const key = crypto.createHash('sha256').update(sessionSecret, 'utf8').digest();
  
  // 12-byte IV for AES-GCM (unified standard)
  const iv = crypto.randomBytes(12);
  
  // Create AES-GCM cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the data
  let encrypted = cipher.update(data, 'utf8');
  cipher.final();
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  return {
    data: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: authTag.toString('base64')
  };
}

async function testLoginEncryption() {
  const sessionSecret = 'public-session-PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7';
  
  const loginData = {
    email: 'test@example.com',
    password: 'testpassword123'
  };
  
  console.log('Testing unified encryption for login route...');
  console.log('Original login data:', loginData);
  
  // Encrypt using unified standard
  const encrypted = unifiedEncrypt(JSON.stringify(loginData), sessionSecret);
  console.log('Encrypted payload:', encrypted);
  
  // Test with actual login endpoint
  try {
    const response = await fetch('http://localhost:5000/api/auth-token/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-encrypted': 'true',
        'x-expect-encrypted': 'true'
      },
      body: JSON.stringify(encrypted)
    });
    
    const result = await response.json();
    console.log('Login response:', result);
    
    if (response.ok) {
      console.log('✅ Login encryption working correctly!');
    } else {
      console.log('❌ Login failed:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Import fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  const { default: fetch } = require('node-fetch');
  global.fetch = fetch;
}

testLoginEncryption().catch(console.error);