import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, LogIn } from "lucide-react";
import { encryptionService } from "@/lib/encryption";

export default function LoginTest() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("testpassword123");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEncryptedLogin = async () => {
    setLoading(true);
    try {
      // Initialize public session (for login without authentication)
      encryptionService.initializePublicSession();
      
      const loginData = { email, password };
      
      // Encrypt login data using unified standard
      const encryptedPayload = await encryptionService.encryptData(JSON.stringify(loginData));
      
      console.log('Encrypted login payload:', encryptedPayload);
      
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
          tagLength: Buffer.from(encryptedPayload.tag, 'base64').length
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
          Login Encryption Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test the unified encryption standard with the login authentication flow.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Encrypted Login Test
          </CardTitle>
          <CardDescription>
            Test login with unified AES-256-GCM encryption
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
            onClick={testEncryptedLogin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Encrypted Login"}
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
                  <Label className="text-sm font-medium">Encryption Details:</Label>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">
                      IV: {result.meta.ivLength} bytes
                    </Badge>
                    <Badge variant="secondary">
                      Tag: {result.meta.tagLength} bytes
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