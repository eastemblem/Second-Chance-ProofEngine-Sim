import { Router } from 'express';
import { encryptData, decryptData, generateSessionSecret, isValidEncryptedPayload } from '../lib/clean-encryption';

const router = Router();

/**
 * Test endpoint for CLEAN encryption standard - unified encryption removed
 */
router.post('/unified-test/echo', async (req, res) => {
  try {
    const { data } = req.body;
    const sessionSecret = generateSessionSecret(); // Use clean encryption
    
    // Test encryption with clean system
    const encrypted = encryptData(JSON.stringify({ message: data }), sessionSecret);
    
    // Test decryption with clean system
    const decrypted = decryptData(encrypted, sessionSecret);
    const parsed = JSON.parse(decrypted);
    
    res.json({
      success: true,
      original: data,
      encrypted,
      decrypted: parsed,
      isValidFormat: isValidEncryptedPayload(encrypted),
      meta: {
        algorithm: 'aes-256-gcm',
        ivLength: Buffer.from(encrypted.iv, 'base64').length,
        tagLength: Buffer.from(encrypted.tag, 'base64').length,
        system: 'clean-encryption'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test decryption of production request format using CLEAN encryption
 */
router.post('/unified-test/production', async (req, res) => {
  try {
    const payload = req.body;
    
    // Validate format with clean system
    const isValid = isValidEncryptedPayload(payload);
    
    // Try decryption with different secrets using clean system
    const secrets = [
      'public-session-PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7',
      'PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7',
      'fallback-secret'
    ];
    
    const results = [];
    
    for (const secret of secrets) {
      try {
        const decrypted = decryptData(payload, secret); // Use clean decryption
        results.push({
          secret: secret.substring(0, 20) + '...',
          success: true,
          decrypted: JSON.parse(decrypted)
        });
      } catch (error) {
        results.push({
          secret: secret.substring(0, 20) + '...',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    res.json({
      payload,
      isValidFormat: isValid,
      results,
      meta: {
        ivLength: Buffer.from(payload.iv, 'base64').length,
        tagLength: Buffer.from(payload.tag, 'base64').length,
        dataLength: Buffer.from(payload.data, 'base64').length,
        system: 'clean-encryption'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;