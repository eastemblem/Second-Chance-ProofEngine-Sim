import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, CheckCircle, XCircle, LogIn } from "lucide-react";
import { cleanEncryptionService } from "@/lib/clean-encryption";
import { useLocation } from "wouter";

export default function SecureLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Initialize public session for login encryption
      cleanEncryptionService.initializePublicSession();
      
      const loginData = { email, password };
      
      // Encrypt the login credentials
      console.log("[SECURE_LOGIN] Encrypting login data...");
      const encryptedPayload = await cleanEncryptionService.encryptData(JSON.stringify(loginData));
      
      console.log("[SECURE_LOGIN] Encrypted payload created:", {
        dataLength: encryptedPayload.data.length,
        ivLength: encryptedPayload.iv.length, 
        tagLength: encryptedPayload.tag.length
      });

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

      if (response.ok && responseData.success) {
        console.log("[SECURE_LOGIN] Login successful:", responseData);
        
        // Store auth token
        localStorage.setItem('auth-token', responseData.token);
        localStorage.setItem('user-data', JSON.stringify(responseData.user));
        
        // Redirect to dashboard
        setLocation('/dashboard');
      } else {
        setError(responseData.error || 'Login failed');
      }
      
    } catch (error) {
      console.error("[SECURE_LOGIN] Error:", error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-purple-600 mr-2" />
            <Lock className="h-6 w-6 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
            Secure Login
          </CardTitle>
          <CardDescription>
            Your credentials are encrypted end-to-end using AES-256-GCM
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSecureLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Encrypting & Logging In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Secure Login
                </>
              )}
            </Button>
            
            <div className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Lock className="h-3 w-3 text-blue-500" />
                <span>AES-256-GCM encryption</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}