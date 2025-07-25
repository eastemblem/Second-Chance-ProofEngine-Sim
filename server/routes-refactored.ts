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
import onboardingRoutes from "./routes/onboarding";
import v1ApiRoutes from "./routes/api/v1";
import healthRoutes from "./routes/health";
import sentryTestRoutes from "./routes/sentry-test";

// Legacy route imports (preserved during transition)
import apiRoutes from "./routes/index";
import authRoutes from "./routes/auth";
import authTokenRoutes from "./routes/auth-token";
import { getLeaderboard } from "./routes/leaderboard";
import { generateCertificate, downloadCertificate, getCertificateStatus } from "./routes/certificate";
import { generateReport } from "./routes/report";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize observability
  configureNewRelic();

  // Apply global middleware
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

  // API versioning and route organization
  console.log("🚀 Registering API routes with modular structure...");

  // V1 API routes (new modular structure)
  app.use('/api/v1', v1ApiRoutes);

  // Core feature routes (new modular structure)
  app.use('/api/dashboard', dashboardRoutes);
  
  // Sentry testing routes (development/testing)
  app.use(sentryTestRoutes);
  app.use('/api/vault', vaultRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  
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

  console.log("✅ All routes registered successfully with modular architecture");
  
  const httpServer = createServer(app);
  return httpServer;
}

// Export helper functions for backward compatibility
export * from "./utils/folder-mapping";
export * from "./utils/error-handler";