import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Lock, Unlock } from "lucide-react";

export default function EncryptionDemo() {
  const [testData, setTestData] = useState("Hello unified encryption!");
  const [unifiedResult, setUnifiedResult] = useState<any>(null);
  const [productionTest, setProductionTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUnifiedEncryption = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/unified-test/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: testData })
      });
      const result = await response.json();
      setUnifiedResult(result);
    } catch (error) {
      setUnifiedResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testProductionPayload = async () => {
    setLoading(true);
    try {
      const productionPayload = {
        data: "CEcWHggGAg9dVwcSGUMJXlVaLko9Czw8Rg8MQkAbbCgXFx8lVkNVWhVwCV9bd0NsVQs=",
        iv: "aENyZ2tHbFdTOXh3YmxhUg==",
        tag: "/BU8K67u4bKpbcq3ORYayA=="
      };
      
      const response = await fetch('/api/unified-test/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productionPayload)
      });
      const result = await response.json();
      setProductionTest(result);
    } catch (error) {
      setProductionTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
          Unified Encryption Standard Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test the new unified encryption system that provides identical encryption parameters between frontend and backend.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unified Encryption Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Unified Encryption Test
            </CardTitle>
            <CardDescription>
              Test round-trip encryption/decryption with the new unified standard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-data">Test Data</Label>
              <Input
                id="test-data"
                value={testData}
                onChange={(e) => setTestData(e.target.value)}
                placeholder="Enter data to encrypt..."
              />
            </div>
            
            <Button 
              onClick={testUnifiedEncryption} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "Test Unified Encryption"}
            </Button>

            {unifiedResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {unifiedResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {unifiedResult.success ? "Success" : "Failed"}
                  </span>
                </div>

                {unifiedResult.success && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Encryption Details:</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Badge variant="secondary">
                          IV: {unifiedResult.meta?.ivLength || 0} bytes
                        </Badge>
                        <Badge variant="secondary">
                          Tag: {unifiedResult.meta?.tagLength || 0} bytes
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Encrypted Data:</Label>
                      <Textarea
                        value={JSON.stringify(unifiedResult.encrypted, null, 2)}
                        readOnly
                        className="text-xs"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {unifiedResult.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {unifiedResult.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Compatibility Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" />
              Production Compatibility Test
            </CardTitle>
            <CardDescription>
              Test decryption of production request format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
              Testing decryption of actual production payload format
            </div>
            
            <Button 
              onClick={testProductionPayload} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? "Testing..." : "Test Production Payload"}
            </Button>

            {productionTest && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={productionTest.isValidFormat ? "default" : "destructive"}>
                    Format: {productionTest.isValidFormat ? "Valid" : "Invalid"}
                  </Badge>
                </div>

                {productionTest.meta && (
                  <div>
                    <Label className="text-sm font-medium">Payload Analysis:</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Badge variant="secondary">
                        IV: {productionTest.meta.ivLength} bytes
                      </Badge>
                      <Badge variant="secondary">
                        Tag: {productionTest.meta.tagLength} bytes
                      </Badge>
                      <Badge variant="secondary">
                        Data: {productionTest.meta.dataLength} bytes
                      </Badge>
                    </div>
                  </div>
                )}

                {productionTest.results && (
                  <div>
                    <Label className="text-sm font-medium">Decryption Attempts:</Label>
                    <div className="space-y-2 mt-2">
                      {productionTest.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{result.secret}</span>
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {productionTest.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {productionTest.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Unified Encryption Standard Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Frontend (Web Crypto API)</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• AES-256-GCM encryption</li>
                <li>• 12-byte IV (standard GCM)</li>
                <li>• SHA-256 key derivation</li>
                <li>• Base64 encoded payloads</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Backend (Node.js crypto)</h4>
              <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <li>• AES-256-GCM decryption</li>
                <li>• 12-byte IV validation</li>
                <li>• SHA-256 key derivation</li>
                <li>• Base64 decoded processing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}