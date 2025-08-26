import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, LogIn, Shield } from "lucide-react";
import { cleanEncryptionService } from "@/lib/clean-encryption";

export default function CleanLoginTest() {
  const [email, setEmail] = useState("bamne123@gmail.com");
  const [password, setPassword] = useState("123456");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCleanEncryptedLogin = async () => {
    setLoading(true);
    try {
      // Initialize public session for login
      cleanEncryptionService.initializePublicSession();
      
      const loginData = { email, password };
      
      // Encrypt login data using clean unified standard
      const encryptedPayload = await cleanEncryptionService.encryptData(JSON.stringify(loginData));
      
      console.log('Clean encrypted login payload:', encryptedPayload);
      
      // Send encrypted login request
      const response = await fetch('/api/auth-token/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-encrypted': 'true',
          'x-expect-encrypted': 'true'
        },
        body: JSON.stringify(encryptedPayload)
      });
      
      const responseData = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        response: responseData,
        encryptedPayload,
        meta: {
          ivLength: Buffer.from(encryptedPayload.iv, 'base64').length,
          tagLength: Buffer.from(encryptedPayload.tag, 'base64').length,
          method: 'clean-aes-256-gcm',
          standard: 'unified'
        }
      });
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
          Clean Encryption Login Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test the clean unified encryption system with real login credentials.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Clean AES-256-GCM Login Test
          </CardTitle>
          <CardDescription>
            Single encryption path, no fallbacks - clean unified standard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email..."
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
          </div>
          
          <Button 
            onClick={testCleanEncryptedLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Testing Clean Encryption..." : "Test Clean Encrypted Login"}
          </Button>

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? `Success (${result.status})` : `Failed (${result.status || 'Error'})`}
                </span>
              </div>

              {result.meta && (
                <div>
                  <Label className="text-sm font-medium">Clean Encryption Details:</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary">
                      Method: {result.meta.method}
                    </Badge>
                    <Badge variant="secondary">
                      Standard: {result.meta.standard}
                    </Badge>
                    <Badge variant="secondary">
                      IV: {result.meta.ivLength}B
                    </Badge>
                    <Badge variant="secondary">
                      Tag: {result.meta.tagLength}B
                    </Badge>
                  </div>
                </div>
              )}

              {result.encryptedPayload && (
                <div>
                  <Label className="text-sm font-medium">Encrypted Payload:</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(result.encryptedPayload, null, 2)}
                  </pre>
                </div>
              )}

              {result.response && (
                <div>
                  <Label className="text-sm font-medium">Response:</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}

              {result.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {result.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}