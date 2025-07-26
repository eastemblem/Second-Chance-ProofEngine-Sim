import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";

// New middleware imports
import { performanceTracker, healthCheck } from "./middleware/performance";
import { errorHandler, notFoundHandler, timeoutHandler } from "./middleware/error-handling";
import { apiVersioning, contentNegotiation } from "./middleware/api-versioning";
import { corsConfig, fileUploadRateLimit, apiRateLimit } from "./middleware/security";
import { sanitizeInputComprehensive } from "./middleware/comprehensive-validation";
import { advancedErrorHandler, correlationMiddleware } from "./middleware/advanced-error-handling";
import { newRelicMiddleware, trackBusinessMetrics, configureNewRelic } from "./middleware/newrelic-observability";

// Modular route imports
import dashboardRoutes from "./routes/dashboard";
import vaultRoutes from "./routes/vault";
import v1ApiRoutes from "./routes/v1";
import healthRoutes from "./routes/health";
import sentryTestRoutes from "./routes/sentry-test";

// Legacy route imports (preserved during transition)
import apiRoutes from "./routes/index";
import authRoutes from "./routes/auth";
import authTokenRoutes from "./routes/auth-token";
import { getLeaderboard } from "./routes/leaderboard";
import { generateCertificate, downloadCertificate, getCertificateStatus } from "./routes/certificate";
import { generateReport } from "./routes/report";
import { appLogger } from "./utils/logger";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize observability
  configureNewRelic();

  // API versioning and route organization
  appLogger.system("Registering API routes with modular structure...");

  // V1 API routes (new modular structure) - MOUNTED FIRST TO AVOID MIDDLEWARE CONFLICTS
  app.use('/api/v1', v1ApiRoutes);

  // Apply global middleware AFTER v1 routes to avoid JWT conflicts
  app.use(healthCheck);
  app.use(correlationMiddleware);
  app.use(corsConfig);
  app.use(apiRateLimit); // General API rate limiting
  app.use(sanitizeInputComprehensive);
  app.use(apiVersioning);
  app.use(contentNegotiation);
  app.use(newRelicMiddleware);
  app.use(trackBusinessMetrics);
  app.use(performanceTracker);
  app.use(timeoutHandler(30000));

  // Core feature routes (new modular structure)
  app.use('/api/dashboard', dashboardRoutes);
  
  // Sentry testing routes (development/testing)
  app.use(sentryTestRoutes);
  app.use('/api/vault', vaultRoutes);
  // Note: Onboarding routes now handled exclusively by V1 API (/api/v1/onboarding)
  
  // Health and monitoring routes
  app.use('/api/health', healthRoutes);

  // Legacy routes (preserved during transition)
  app.use('/api', apiRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/auth-token', authTokenRoutes);

  // Individual route handlers (preserved)
  app.get('/api/leaderboard', getLeaderboard);
  app.post('/api/certificate/create', generateCertificate);
  app.get('/api/certificate/download/:id', downloadCertificate);
  app.get('/api/certificate/status/:id', getCertificateStatus);
  app.post('/api/report/create', generateReport);

  // Email routes (preserved)
  app.use("/api/email", (await import("./routes/emailRoutes")).default);

  // Serve React frontend from build directory temporarily
  app.use(express.static(path.join(process.cwd(), 'dist/public')));
  
  // Special handling for reset password route to bypass client routing issues
  app.get('/reset-password', (req, res) => {
    const token = req.query.token as string;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password - Second Chance</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .gradient-text { 
      background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
    }
    .gradient-button { 
      background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%); 
    }
    .gradient-button:hover { opacity: 0.9; }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
  <div class="w-full max-w-md px-4">
    <div class="bg-white rounded-lg shadow-xl border p-6">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold gradient-text">Reset Your Password</h1>
        <p class="text-gray-600 mt-2">Enter a new secure password for your account</p>
      </div>
      
      ${!token ? `
        <div class="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="text-red-600 text-sm">❌ Invalid reset link - no token found</div>
          <a href="/forgot-password" class="inline-block mt-3 text-blue-600 hover:underline">Request new reset link</a>
        </div>
      ` : `
        <form id="reset-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input 
              id="password" 
              type="password" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
              placeholder="Enter your new password"
              minlength="8"
            />
            <div class="text-xs text-gray-500 mt-1">Must be at least 8 characters</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input 
              id="confirmPassword" 
              type="password" 
              required 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
              placeholder="Confirm your new password" 
            />
          </div>
          <button 
            type="submit" 
            class="w-full gradient-button text-white py-2 px-4 rounded-md transition-opacity"
          >
            Reset Password
          </button>
        </form>
      `}
      
      <div id="message" class="mt-4 text-center text-sm"></div>
    </div>
  </div>
  
  <script>
    const token = '${token || ''}';
    
    if (token) {
      document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageDiv = document.getElementById('message');
        
        if (password !== confirmPassword) {
          messageDiv.innerHTML = '<div class="text-red-600">❌ Passwords do not match</div>';
          return;
        }
        
        if (password.length < 8) {
          messageDiv.innerHTML = '<div class="text-red-600">❌ Password must be at least 8 characters</div>';
          return;
        }
        
        try {
          messageDiv.innerHTML = '<div class="text-blue-600">🔄 Resetting password...</div>';
          
          const response = await fetch(\`/api/auth/reset-password/\${token}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
          });
          
          const data = await response.json();
          
          if (response.ok) {
            messageDiv.innerHTML = '<div class="text-green-600">✅ Password reset successfully! Redirecting to login...</div>';
            setTimeout(() => { window.location.href = '/login'; }, 2000);
          } else {
            messageDiv.innerHTML = \`<div class="text-red-600">❌ \${data.error || 'Failed to reset password'}</div>\`;
          }
        } catch (error) {
          messageDiv.innerHTML = '<div class="text-red-600">❌ Network error. Please try again.</div>';
        }
      });
    }
  </script>
</body>
</html>`;
    res.send(html);
  });

  // Fallback to serve index.html for SPA routing
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    const indexPath = path.join(process.cwd(), 'dist/public/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Second Chance Platform</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 2rem; background: #0f0f23; color: white; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .error { background: #dc2626; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
        .link { background: #6366f1; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; display: inline-block; margin: 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Second Chance Platform</h1>
        <div class="error">Frontend build not found. Run 'npm run build' to build the React application.</div>
        <p>Backend is running with all APIs operational:</p>
        <a href="/api/health" class="link">Health Check</a>
        <a href="/api/dashboard/validation?founderId=test" class="link">Test API</a>
    </div>
</body>
</html>
      `);
    }
  });

  // Apply error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(advancedErrorHandler);

  appLogger.system("All routes registered successfully with modular architecture");
  
  const httpServer = createServer(app);
  return httpServer;
}

// Export helper functions for backward compatibility
export * from "./utils/folder-mapping";
export * from "./utils/error-handler";