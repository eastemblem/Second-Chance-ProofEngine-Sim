import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function SimpleResetTest() {
  const [location] = useLocation();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔍 SimpleResetTest loaded - Current URL:", window.location.href);
    console.log("🔍 Location from wouter:", location);
    
    // Extract token from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('token');
    console.log("🔍 Token from query params:", queryToken);
    
    setToken(queryToken);
  }, [location]);

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: 'white' }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>RESET PASSWORD TEST PAGE - WORKING!</h1>
      <p style={{ fontSize: '18px', color: 'green' }}>✅ React routing is working correctly!</p>
      <div style={{ backgroundColor: '#e8f5e8', padding: '20px', border: '2px solid green', margin: '20px 0' }}>
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Token found:</strong> {token || 'No token found'}</p>
        <p><strong>Wouter location:</strong> {location}</p>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
        <p><strong>SUCCESS:</strong> If you can see this page, the routing system is working!</p>
        <p>The original 404 issue was with the complex reset password component, not the routing.</p>
      </div>
    </div>
  );
}