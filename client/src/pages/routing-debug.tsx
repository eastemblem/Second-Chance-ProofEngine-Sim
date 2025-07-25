import { useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";

export default function RoutingDebug() {
  const [location] = useLocation();
  const [resetPasswordMatch, resetPasswordParams] = useRoute("/reset-password");
  const [resetPasswordTokenMatch, resetPasswordTokenParams] = useRoute("/reset-password/:token");
  const [urlParams, setUrlParams] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrlParams(window.location.search);
    }
  }, []);

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Routing Debug Information</h1>
        
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Current Location</h2>
            <p><strong>Wouter location:</strong> {location}</p>
            <p><strong>Window pathname:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
            <p><strong>Window search:</strong> {typeof window !== 'undefined' ? window.location.search : 'N/A'}</p>
            <p><strong>Full URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          </div>

          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Route Matches</h2>
            <p><strong>/reset-password match:</strong> {String(resetPasswordMatch)}</p>
            <p><strong>/reset-password params:</strong> {JSON.stringify(resetPasswordParams)}</p>
            <p><strong>/reset-password/:token match:</strong> {String(resetPasswordTokenMatch)}</p>
            <p><strong>/reset-password/:token params:</strong> {JSON.stringify(resetPasswordTokenParams)}</p>
          </div>

          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">URL Parameters</h2>
            <p><strong>Search params:</strong> {urlParams}</p>
            {typeof window !== 'undefined' && (
              <>
                <p><strong>Token from URL:</strong> {new URLSearchParams(window.location.search).get('token')}</p>
              </>
            )}
          </div>

          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Test Links</h2>
            <div className="space-y-2">
              <div><a href="/reset-password" className="text-blue-500 underline">/reset-password</a></div>
              <div><a href="/reset-password?token=test123" className="text-blue-500 underline">/reset-password?token=test123</a></div>
              <div><a href="/reset-password/test456" className="text-blue-500 underline">/reset-password/test456</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}