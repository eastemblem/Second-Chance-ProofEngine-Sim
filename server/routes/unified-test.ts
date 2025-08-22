import { Router } from 'express';
import { unifiedEncrypt, unifiedDecrypt, validateUnifiedPayload } from '../lib/unified-encryption';

const router = Router();

/**
 * Test endpoint for unified encryption standard
 */
router.post('/unified-test/echo', async (req, res) => {
  try {
    const { data } = req.body;
    const sessionSecret = 'test-unified-secret';
    
    // Test encryption
    const encrypted = unifiedEncrypt(JSON.stringify({ message: data }), sessionSecret);
    
    // Test decryption
    const decrypted = unifiedDecrypt(encrypted, sessionSecret);
    const parsed = JSON.parse(decrypted);
    
    res.json({
      success: true,
      original: data,
      encrypted,
      decrypted: parsed,
      isValidFormat: validateUnifiedPayload(encrypted),
      meta: {
        algorithm: 'aes-256-gcm',
        ivLength: Buffer.from(encrypted.iv, 'base64').length,
        tagLength: Buffer.from(encrypted.tag, 'base64').length
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
 * Test decryption of production request format
 */
router.post('/unified-test/production', async (req, res) => {
  try {
    const payload = req.body;
    
    // Validate format
    const isValid = validateUnifiedPayload(payload);
    
    // Try decryption with different secrets
    const secrets = [
      'public-session-PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7',
      'PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7',
      'fallback-secret'
    ];
    
    const results = [];
    
    for (const secret of secrets) {
      try {
        const decrypted = unifiedDecrypt(payload, secret);
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
        dataLength: Buffer.from(payload.data, 'base64').length
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