import express from 'express';
import { generateSessionSecret, decryptData } from '../lib/clean-encryption';
import { cleanDecryptionMiddleware, cleanEncryptionMiddleware } from '../middleware/clean-encryption-middleware';

const router = express.Router();

// Debug endpoint to test production payloads (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/debug-payload', async (req, res) => {
    try {
      const { payload, secretHint } = req.body;
      
      if (!payload || !payload.data || !payload.iv || !payload.tag) {
        return res.status(400).json({ 
          error: 'Invalid payload format',
          expected: 'Payload must have data, iv, and tag fields'
        });
      }
      
      // Try different session secret variations
      const secrets = [
        generateSessionSecret(), // Current development secret
        `public-session-${process.env.ENCRYPTION_SECRET}`, // Direct encryption secret
        `public-session-${process.env.VITE_ENCRYPTION_SECRET}`, // Direct vite secret
        secretHint ? `public-session-${secretHint}` : null // User-provided hint
      ].filter(Boolean);
      
      console.log('Attempting decryption with', secrets.length, 'secret variations');
      
      for (let i = 0; i < secrets.length; i++) {
        try {
          const decrypted = decryptData(payload, secrets[i]);
          return res.json({
            success: true,
            decrypted: JSON.parse(decrypted),
            secretUsed: i,
            secretPrefix: secrets[i].substring(0, 20) + '...',
            message: 'Decryption successful'
          });
        } catch (error) {
          console.log(`Secret ${i} failed:`, error.message);
        }
      }
      
      // All secrets failed
      res.status(400).json({
        success: false,
        error: 'Failed to decrypt with any available secrets',
        secretsAttempted: secrets.length,
        payloadInfo: {
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
}

export default router;