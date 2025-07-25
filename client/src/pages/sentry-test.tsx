// Comprehensive Sentry testing page for both frontend and backend error tracking
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reportError, enrichErrorContext, setUserContext, clearUserContext } from "@/lib/sentry";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function SentryTestPage() {
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error';
    message: string;
    timestamp: string;
  }>>([]);

  const addResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Frontend error tests
  const testFrontendError = () => {
    try {
      // Intentional error for testing
      throw new Error('Frontend test error - this is intentional');
    } catch (error: any) {
      enrichErrorContext(error, {}, {
        component: 'sentry-test-page',
        page: 'frontend-testing',
        testType: 'manual-frontend-error'
      });
      addResult('Frontend Error', 'error', 'Error sent to Sentry successfully');
    }
  };

  const testFrontendWarning = () => {
    reportError('Frontend warning test message', 'warning', {
      component: 'sentry-test-page',
      testType: 'frontend-warning',
      timestamp: new Date().toISOString()
    });
    addResult('Frontend Warning', 'success', 'Warning sent to Sentry successfully');
  };

  const testUserContext = () => {
    setUserContext({
      id: 'test-user-123',
      email: 'test@example.com',
      ventureName: 'Test Venture'
    });
    addResult('User Context', 'success', 'User context set in Sentry');
  };

  const testClearUserContext = () => {
    clearUserContext();
    addResult('Clear User Context', 'success', 'User context cleared from Sentry');
  };

  // Backend error tests using mutations
  const backendErrorMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/sentry-test/error');
      return response.json();
    },
    onSuccess: (data) => {
      addResult('Backend Error', 'error', data.message || 'Backend error test completed');
    },
    onError: (error: any) => {
      addResult('Backend Error', 'error', `Backend error: ${error.message}`);
    }
  });

  const backendWarningMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/sentry-test/warning');
      return response.json();
    },
    onSuccess: (data) => {
      addResult('Backend Warning', 'success', data.message || 'Backend warning test completed');
    },
    onError: (error: any) => {
      addResult('Backend Warning', 'error', `Backend warning failed: ${error.message}`);
    }
  });

  const backendCustomContextMutation = useMutation({
    mutationFn: async (testType: string) => {
      const response = await apiRequest('POST', '/api/sentry-test/custom-context', {
        userId: 'frontend-test-user',
        ventureName: 'Frontend Test Venture',
        testType: testType
      });
      return response.json();
    },
    onSuccess: (data) => {
      addResult('Backend Custom Context', 'error', data.message || 'Custom context error sent to Sentry');
    },
    onError: (error: any) => {
      addResult('Backend Custom Context', 'error', error.message);
    }
  });

  const performanceTestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/sentry-test/performance');
      return response.json();
    },
    onSuccess: (data) => {
      addResult('Performance Test', 'success', data.message || 'Performance monitoring test completed');
    },
    onError: (error: any) => {
      addResult('Performance Test', 'error', error.message);
    }
  });

  const scenarioTestMutation = useMutation({
    mutationFn: async (scenario: string) => {
      const response = await apiRequest('GET', `/api/sentry-test/scenarios/${scenario}`);
      return response.json();
    },
    onSuccess: (data) => {
      addResult(`Scenario: ${data.scenario}`, 'error', data.message || `${data.scenario} error sent to Sentry`);
    },
    onError: (error: any) => {
      addResult('Scenario Test', 'error', error.message);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Sentry Integration Testing</h1>
          <p className="text-gray-600">
            Comprehensive testing dashboard for both frontend and backend Sentry error tracking.
          </p>
          <Alert className="mt-4">
            <AlertDescription>
              This page tests Sentry error tracking integration. All errors generated here are intentional for testing purposes.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frontend Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-blue-600">🎯</span>
                Frontend Error Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testFrontendError}
                variant="destructive"
                className="w-full"
              >
                Test Frontend Error
              </Button>
              
              <Button 
                onClick={testFrontendWarning}
                variant="outline"
                className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                Test Frontend Warning
              </Button>
              
              <Button 
                onClick={testUserContext}
                variant="outline"
                className="w-full"
              >
                Set User Context
              </Button>
              
              <Button 
                onClick={testClearUserContext}
                variant="outline"
                className="w-full"
              >
                Clear User Context
              </Button>
            </CardContent>
          </Card>

          {/* Backend Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-600">🖥️</span>
                Backend Error Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => backendErrorMutation.mutate()}
                variant="destructive"
                className="w-full"
                disabled={backendErrorMutation.isPending}
              >
                {backendErrorMutation.isPending ? 'Testing...' : 'Test Backend Error'}
              </Button>
              
              <Button 
                onClick={() => backendWarningMutation.mutate()}
                variant="outline"
                className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                disabled={backendWarningMutation.isPending}
              >
                {backendWarningMutation.isPending ? 'Testing...' : 'Test Backend Warning'}
              </Button>
              
              <Button 
                onClick={() => backendCustomContextMutation.mutate('business-error')}
                variant="outline"
                className="w-full"
                disabled={backendCustomContextMutation.isPending}
              >
                {backendCustomContextMutation.isPending ? 'Testing...' : 'Test Custom Context'}
              </Button>
              
              <Button 
                onClick={() => performanceTestMutation.mutate()}
                variant="outline"
                className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                disabled={performanceTestMutation.isPending}
              >
                {performanceTestMutation.isPending ? 'Testing...' : 'Test Performance Monitoring'}
              </Button>
            </CardContent>
          </Card>

          {/* Scenario Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-red-600">⚡</span>
                Error Scenario Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['null-reference', 'validation-error', 'authorization-error', 'type-error'].map((scenario) => (
                <Button 
                  key={scenario}
                  onClick={() => scenarioTestMutation.mutate(scenario)}
                  variant="outline"
                  className="w-full"
                  disabled={scenarioTestMutation.isPending}
                >
                  {scenarioTestMutation.isPending ? 'Testing...' : `Test ${scenario.replace('-', ' ')}`}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-gray-600">📊</span>
                Test Results
                <Button 
                  onClick={() => setTestResults([])}
                  variant="ghost" 
                  size="sm"
                  className="ml-auto"
                >
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tests run yet</p>
                ) : (
                  testResults.map((result, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Badge 
                        variant={result.status === 'error' ? 'destructive' : 'default'}
                        className="flex-shrink-0"
                      >
                        {result.status}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{result.test}</p>
                        <p className="text-xs text-gray-600 break-words">{result.message}</p>
                        <p className="text-xs text-gray-400">{result.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sentry Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              After running tests, check your Sentry dashboard to see the captured errors, performance data, and user context.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900">Error Tracking</h4>
                <p className="text-blue-700">View captured exceptions with full context and stack traces</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-900">Performance Monitoring</h4>
                <p className="text-green-700">Monitor API response times and performance metrics</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-medium text-purple-900">User Context</h4>
                <p className="text-purple-700">Track errors by user and venture context</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}