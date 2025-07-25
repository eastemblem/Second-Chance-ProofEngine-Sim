import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";

export default function ResetPasswordDebugPage() {
  const [match, params] = useRoute("/reset-password-debug/:token?");
  const [location] = useLocation();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Gather debug information
    const info = {
      currentLocation: location,
      windowSearch: typeof window !== 'undefined' ? window.location.search : 'N/A',
      windowHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
      wouterMatch: match,
      wouterParams: params,
      queryToken: new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('token'),
      pathToken: params?.token,
      timestamp: new Date().toISOString()
    };
    setDebugInfo(info);
    console.log('Reset Password Debug Info:', info);
  }, [location, match, params]);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Reset Password Debug Page</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Current Location (Wouter):</h3>
            <code className="bg-gray-100 p-2 rounded block">{debugInfo.currentLocation}</code>
          </div>
          
          <div>
            <h3 className="font-semibold">Window Location Search:</h3>
            <code className="bg-gray-100 p-2 rounded block">{debugInfo.windowSearch}</code>
          </div>
          
          <div>
            <h3 className="font-semibold">Window Location Href:</h3>
            <code className="bg-gray-100 p-2 rounded block">{debugInfo.windowHref}</code>
          </div>
          
          <div>
            <h3 className="font-semibold">Wouter Match:</h3>
            <code className="bg-gray-100 p-2 rounded block">{JSON.stringify(debugInfo.wouterMatch)}</code>
          </div>
          
          <div>
            <h3 className="font-semibold">Wouter Params:</h3>
            <code className="bg-gray-100 p-2 rounded block">{JSON.stringify(debugInfo.wouterParams)}</code>
          </div>
          
          <div>
            <h3 className="font-semibold">Token from Query:</h3>
            <code className="bg-gray-100 p-2 rounded block">{debugInfo.queryToken || 'NULL'}</code>
          </div>
          
          <div>
            <h3 className="font-semibold">Token from Path:</h3>
            <code className="bg-gray-100 p-2 rounded block">{debugInfo.pathToken || 'NULL'}</code>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Quick Tests:</h3>
          <div className="space-x-4">
            <a href="/reset-password?token=test123" className="bg-blue-500 text-white px-4 py-2 rounded">
              Test Query Parameter
            </a>
            <a href="/reset-password/test456" className="bg-green-500 text-white px-4 py-2 rounded">
              Test Path Parameter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}