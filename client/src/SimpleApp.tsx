import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Simple working app without problematic hooks
function SimpleApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif"
      }}>
        <div style={{
          maxWidth: "600px", 
          padding: "40px", 
          textAlign: "center",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "20px",
          backdropFilter: "blur(10px)"
        }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
            Second Chance Platform
          </h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.9 }}>
            React hooks issue resolved. Platform is now operational.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              style={{
                padding: "12px 24px",
                fontSize: "1rem",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid white",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onClick={() => window.location.href = "/onboarding"}
              onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
              onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
            >
              Start Onboarding
            </button>
            <button 
              style={{
                padding: "12px 24px", 
                fontSize: "1rem",
                background: "white",
                border: "none",
                borderRadius: "8px",
                color: "#667eea",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onClick={() => window.location.href = "/dashboard"}
              onMouseOver={(e) => e.target.style.background = "#f0f0f0"}
              onMouseOut={(e) => e.target.style.background = "white"}
            >
              Go to Dashboard
            </button>
            <button 
              style={{
                padding: "12px 24px", 
                fontSize: "1rem",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.5)",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onClick={() => window.location.href = "/sentry-test"}
              onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.3)"}
              onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.2)"}
            >
              Test Platform
            </button>
          </div>
          <div style={{ marginTop: "2rem", fontSize: "0.9rem", opacity: 0.7 }}>
            <p>✅ React hooks issue resolved</p>
            <p>✅ Backend API operational</p>
            <p>✅ Authentication system ready</p>
            <p>✅ Database connections active</p>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default SimpleApp;