import express from 'express';
import { encryptData, decryptData, generateSessionSecret, isValidEncryptedPayload } from '../lib/clean-encryption';
const router = express.Router();

// Clean encryption middleware applied globally - no need for route-level registration

// Test endpoint for clean encryption system
router.post('/echo', async (req, res) => {
  try {
    const sessionSecret = generateSessionSecret(); // Public session for test
    
    // If request is encrypted, req.body is already decrypted by middleware
    const isEncrypted = req.headers['x-encrypted'] === 'true';
    
    let originalData;
    if (isEncrypted) {
      originalData = req.body; // Already decrypted by middleware
    } else {
      originalData = req.body;
    }
    
    // Encrypt test data for demonstration
    const testEncrypted = encryptData(JSON.stringify(originalData), sessionSecret);
    
    // Test decryption
    const testDecrypted = decryptData(testEncrypted, sessionSecret);
    
    const response = {
      success: true,
      received: originalData,
      wasEncrypted: isEncrypted,
      testEncryption: {
        encrypted: testEncrypted,
        decrypted: JSON.parse(testDecrypted),
        isValidFormat: isValidEncryptedPayload(testEncrypted),
        meta: {
          algorithm: 'aes-256-gcm',
          ivLength: Buffer.from(testEncrypted.iv, 'base64').length,
          tagLength: Buffer.from(testEncrypted.tag, 'base64').length
        }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test login endpoint with clean encryption
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple test validation (replace with real auth logic)
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }
    
    // Test response for clean encryption
    const response = {
      success: true,
      message: 'Clean encryption login test successful',
      user: {
        email,
        testFounderId: 'test-founder-123'
      },
      encryptionInfo: {
        method: 'clean-aes-256-gcm',
        standard: 'unified'
      }
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;