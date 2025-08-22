import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { encryptedApiClient, encryptionService } from '@/lib/encryption';
import { toast } from '@/hooks/use-toast';

export default function EncryptionDemo() {
  const [testMessage, setTestMessage] = useState('Hello, this is a test message!');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [encryptionInitialized, setEncryptionInitialized] = useState(false);

  const initializeEncryption = async () => {
    try {
      setLoading(true);
      // Use a test founderId for demo purposes
      const testFounderId = 'demo-user-123';
      await encryptedApiClient.initializeEncryption(testFounderId);
      setEncryptionInitialized(true);
      toast({
        title: "Encryption Initialized",
        description: "Encryption session has been set up successfully"
      });
    } catch (error) {
      toast({
        title: "Initialization Failed",
        description: error instanceof Error ? error.message : "Failed to initialize encryption",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testEncryptedRequest = async () => {
    if (!encryptionInitialized) {
      toast({
        title: "Not Initialized",
        description: "Please initialize encryption first",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const result = await encryptedApiClient.post('/api/encryption-test/echo', {
        message: testMessage,
        timestamp: new Date().toISOString(),
        testData: {
          number: 42,
          boolean: true,
          array: [1, 2, 3]
        }
      });
      
      setResponse(result);
      toast({
        title: "Test Successful",
        description: "Encrypted request/response completed successfully"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send encrypted request",
        variant: "destructive"
      });
      setResponse({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const checkEncryptionStatus = async () => {
    try {
      setLoading(true);
      const result = await encryptedApiClient.get('/api/encryption-test/status');
      setResponse(result);
      toast({
        title: "Status Retrieved",
        description: "Encryption status retrieved successfully"
      });
    } catch (error) {
      toast({
        title: "Status Check Failed",
        description: error instanceof Error ? error.message : "Failed to check encryption status",
        variant: "destructive"
      });
      setResponse({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Encryption Demo</h1>
        <p className="text-muted-foreground">
          Test the end-to-end payload encryption system between frontend and backend
        </p>
      </div>

      <div className="grid gap-6">
        {/* Initialization Card */}
        <Card>
          <CardHeader>
            <CardTitle>1. Initialize Encryption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Initialize the encryption session before making encrypted requests
            </p>
            <div className="flex items-center gap-4">
              <Button 
                onClick={initializeEncryption} 
                disabled={loading || encryptionInitialized}
                variant={encryptionInitialized ? "outline" : "default"}
              >
                {encryptionInitialized ? "✓ Initialized" : "Initialize Encryption"}
              </Button>
              {encryptionInitialized && (
                <span className="text-sm text-green-600">Encryption session active</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Request Card */}
        <Card>
          <CardHeader>
            <CardTitle>2. Test Encrypted Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Message</label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a test message to encrypt and send"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={testEncryptedRequest} 
                disabled={loading || !encryptionInitialized}
              >
                {loading ? "Sending..." : "Send Encrypted Request"}
              </Button>
              <Button 
                onClick={checkEncryptionStatus} 
                disabled={loading}
                variant="outline"
              >
                Check Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Card */}
        {response && (
          <Card>
            <CardHeader>
              <CardTitle>3. Server Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
              {response.encryptionMetadata && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Encryption Metadata
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Request was encrypted: {response.encryptionMetadata.wasEncrypted ? 'Yes' : 'No'}</li>
                    <li>• Session established: {response.encryptionMetadata.hasSessionSecret ? 'Yes' : 'No'}</li>
                    <li>• Timestamp: {response.encryptionMetadata.timestamp}</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Encryption Flow:</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>Client initializes encryption session with user ID</li>
                <li>Request payload is encrypted using symmetric encryption</li>
                <li>Encrypted payload is sent with special headers</li>
                <li>Server decrypts request using session secret</li>
                <li>Server processes request normally</li>
                <li>Response is encrypted before sending back</li>
                <li>Client decrypts response automatically</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Security Features:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>AES-256 encryption for all payloads</li>
                <li>Session-based key derivation</li>
                <li>Authentication tag verification</li>
                <li>Automatic fallback for compatibility</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}