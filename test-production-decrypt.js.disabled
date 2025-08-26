// Production payload decryption test
import crypto from 'crypto';

// Your production payload
const productionPayload = {
  data: '913i8+tXhD7eJoKUQoYu6OFJoH6SX+E857PI6fAnLcx+rUV5emjY7Eq+FmWujocVuNA=',
  iv: 'Q7EMEmibb2Z9WW8L',
  tag: 'edoPygauuH0oVplOp8XG2Q=='
};

// Function to test different encryption secrets
function testDecryption(payload, baseSecret) {
  console.log(`Testing with base secret: ${baseSecret.substring(0, 20)}...`);
  
  const secretFormats = [
    `public-session-${baseSecret}`,
    `session-${baseSecret}`, 
    baseSecret,
    `public-${baseSecret}`,
    `session-public-${baseSecret}`
  ];
  
  secretFormats.forEach((sessionSecret, i) => {
    try {
      // SHA-256 key derivation 
      const key = crypto.createHash('sha256').update(sessionSecret, 'utf8').digest();
      
      // Convert payload components
      const encryptedData = Buffer.from(payload.data, 'base64');
      const iv = Buffer.from(payload.iv, 'base64');
      const authTag = Buffer.from(payload.tag, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      let decrypted = decipher.update(encryptedData, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      console.log(`✅ Format ${i}: SUCCESS!`);
      console.log(`   Secret: ${sessionSecret.substring(0, 30)}...`);
      console.log(`   Result: ${decrypted}`);
      return true;
      
    } catch (error) {
      console.log(`❌ Format ${i}: ${error.message.substring(0, 50)}...`);
    }
  });
  
  return false;
}

// Test with your actual production secret
console.log('=== PRODUCTION PAYLOAD DECRYPTION TEST ===\n');

// You mentioned the secrets are the same, so test with the development value
const developmentSecret = 'PjUPhlc/b7NXvdlR911x/R8mhCvZwv+u4fljNhnjT7vcEJQ2ctx2Wh36i/3JVL+7';

if (!testDecryption(productionPayload, developmentSecret)) {
  console.log('\n❌ All decryption attempts failed.');
  console.log('This suggests either:');
  console.log('1. Production uses a different ENCRYPTION_SECRET value');
  console.log('2. Frontend encryption parameters differ from backend');
  console.log('3. There\'s a version mismatch in the encryption implementation');
}