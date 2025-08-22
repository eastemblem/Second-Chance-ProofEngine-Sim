import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SimpleCryptoTest() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testCrypto = async () => {
    setLoading(true);
    setResult("");

    try {
      // Test 1: Basic crypto-browserify import
      console.log("Testing crypto-browserify import...");
      const cryptoModule = await import('crypto-browserify');
      const crypto = cryptoModule.default || cryptoModule;
      console.log("✅ crypto-browserify imported successfully");
      
      // Test 2: Buffer availability
      console.log("Testing Buffer availability...");
      const { Buffer } = await import('buffer');
      console.log("✅ Buffer imported successfully");
      
      // Test 3: Basic hash function
      console.log("Testing hash function...");
      const hash = crypto.createHash('sha256').update('test', 'utf8').digest();
      console.log("✅ Hash created:", hash.toString('hex').substring(0, 16) + "...");
      
      // Test 4: AES encryption
      console.log("Testing AES encryption...");
      const key = crypto.createHash('sha256').update('test-key', 'utf8').digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      const data = 'test data';
      let encrypted = cipher.update(data, 'utf8');
      cipher.final();
      const authTag = cipher.getAuthTag();
      
      console.log("✅ AES encryption successful:", {
        encryptedLength: encrypted.length,
        ivLength: iv.length,
        tagLength: authTag.length
      });
      
      setResult("All crypto tests passed! Node.js crypto works in browser.");
      
    } catch (error) {
      console.error("Crypto test failed:", error);
      setResult(`Crypto test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Crypto Test</CardTitle>
          <CardDescription>
            Test Node.js crypto-browserify functionality
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={testCrypto}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Crypto"}
          </Button>
          
          {result && (
            <Alert className={result.includes("failed") ? "border-red-500" : "border-green-500"}>
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}