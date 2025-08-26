import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { cleanEncryptionService } from "@/lib/clean-encryption";

export default function SecureFlowDemo() {
  const [email, setEmail] = useState("bamne123@gmail.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [encryptionStep, setEncryptionStep] = useState(0);

  const demonstrateSecureFlow = async () => {
    setLoading(true);
    setResult(null);
    setEncryptionStep(0);
    
    try {
      // Step 1: Initialize encryption
      setEncryptionStep(1);
      cleanEncryptionService.initializePublicSession();
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
      
      // Step 2: Prepare data
      setEncryptionStep(2);
      const loginData = { email, password };
      const plainText = JSON.stringify(loginData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Encrypt data
      setEncryptionStep(3);
      const encryptedPayload = await cleanEncryptionService.encryptData(plainText);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 4: Send to backend
      setEncryptionStep(4);
      const response = await fetch('/api/auth-token/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-encrypted': 'true',
          'x-expect-encrypted': 'true'
        },
        body: JSON.stringify(encryptedPayload)
      });
      
      // Step 5: Process response
      setEncryptionStep(5);
      const responseData = await response.json();
      
      setResult({
        success: response.ok && responseData.success,
        status: response.status,
        response: responseData,
        encryptedPayload,
        plainText,
        steps: [
          "🔐 Public session encryption initialized",
          "📝 Login credentials prepared",
          "🛡️ Data encrypted with AES-256-GCM",
          "📡 Encrypted payload sent to backend", 
          "✅ Server decrypted and authenticated"
        ],
        security: {
          algorithm: "AES-256-GCM",
          keyDerivation: "SHA-256",
          ivLength: Buffer.from(encryptedPayload.iv, 'base64').length,
          tagLength: Buffer.from(encryptedPayload.tag, 'base64').length
        }
      });
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        step: encryptionStep
      });
    } finally {
      setLoading(false);
      setEncryptionStep(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
          Secure Login Flow Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Watch your credentials get encrypted end-to-end with AES-256-GCM before transmission.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-purple-600" />
              Login Credentials
            </CardTitle>
            <CardDescription>
              Your data is encrypted before leaving your browser
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={demonstrateSecureFlow} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Step {encryptionStep}/5 - Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Demonstrate Secure Login
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {result?.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : result && !result.success ? (
                <XCircle className="h-5 w-5 mr-2 text-red-600" />
              ) : (
                <Shield className="h-5 w-5 mr-2 text-gray-400" />
              )}
              Encryption Flow Results
            </CardTitle>
            <CardDescription>
              Real-time security process demonstration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-8 text-gray-500">
                Click the button to start the secure login demonstration
              </div>
            ) : (
              <div className="space-y-4">
                {result.success && (
                  <div className="space-y-3">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      ✅ Login Successful
                    </Badge>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Security Process:</h4>
                      <ul className="space-y-1 text-sm">
                        {result.steps.map((step: string, index: number) => (
                          <li key={index} className="text-gray-600 dark:text-gray-300">{step}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="font-semibold">Algorithm</div>
                        <div className="text-gray-600 dark:text-gray-300">{result.security.algorithm}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="font-semibold">Key Derivation</div>
                        <div className="text-gray-600 dark:text-gray-300">{result.security.keyDerivation}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="font-semibold">IV Length</div>
                        <div className="text-gray-600 dark:text-gray-300">{result.security.ivLength} bytes</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className="font-semibold">Auth Tag</div>
                        <div className="text-gray-600 dark:text-gray-300">{result.security.tagLength} bytes</div>
                      </div>
                    </div>

                    {result.response?.user && (
                      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                          Welcome back, {result.response.user.founderId ? 'authenticated user!' : 'user!'}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                          Token expires: {result.response.expiresIn}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!result.success && (
                  <div className="space-y-2">
                    <Badge variant="destructive">❌ Authentication Failed</Badge>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {result.error || 'Unknown error occurred'}
                    </p>
                    {result.step && (
                      <p className="text-xs text-gray-500">
                        Failed at step {result.step}/5
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {result?.encryptedPayload && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-sm">Technical Details (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="font-semibold mb-1">Plain Text:</div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {result.plainText}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Encrypted Data:</div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {result.encryptedPayload.data.substring(0, 50)}...
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">IV (Base64):</div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {result.encryptedPayload.iv}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">Auth Tag (Base64):</div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {result.encryptedPayload.tag}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}