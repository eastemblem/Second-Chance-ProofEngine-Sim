import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";

// New middleware imports
import { performanceTracker, healthCheck } from "./middleware/performance";
import { errorHandler, notFoundHandler, timeoutHandler } from "./middleware/error-handling";
import { apiVersioning, contentNegotiation } from "./middleware/api-versioning";
import { corsConfig, sanitizeRequest } from "./middleware/security";

// Modular route imports
import dashboardRoutes from "./routes/dashboard";
import vaultRoutes from "./routes/vault";
import onboardingRoutes from "./routes/onboarding";
import v1ApiRoutes from "./routes/api/v1";
import healthRoutes from "./routes/health";

// Legacy route imports (preserved during transition)
import apiRoutes from "./routes/index";
import authRoutes from "./routes/auth";
import { getLeaderboard } from "./routes/leaderboard";
import { generateCertificate, downloadCertificate, getCertificateStatus } from "./routes/certificate";
import { generateReport } from "./routes/report";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply global middleware
  app.use(healthCheck);
  app.use(corsConfig);
  app.use(sanitizeRequest);
  app.use(apiVersioning);
  app.use(contentNegotiation);
  app.use(performanceTracker);
  app.use(timeoutHandler(30000));

  // API versioning and route organization
  console.log("🚀 Registering API routes with modular structure...");

  // V1 API routes (new modular structure)
  app.use('/api/v1', v1ApiRoutes);

  // Core feature routes (new modular structure)
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/vault', vaultRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  
  // Health and monitoring routes
  app.use('/api/health', healthRoutes);

  // Legacy routes (preserved during transition)
  app.use('/api', apiRoutes);
  app.use('/api/auth', authRoutes);

  // Individual route handlers (preserved)
  app.get('/api/leaderboard', getLeaderboard);
  app.post('/api/certificate/create', generateCertificate);
  app.get('/api/certificate/download/:id', downloadCertificate);
  app.get('/api/certificate/status/:id', getCertificateStatus);
  app.post('/api/report/create', generateReport);

  // Email routes (preserved)
  app.use("/api/email", (await import("./routes/emailRoutes")).default);

  // Apply error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  console.log("✅ All routes registered successfully with modular architecture");
  
  const httpServer = createServer(app);
  return httpServer;
}

// Export helper functions for backward compatibility
export * from "./utils/folder-mapping";
export * from "./utils/error-handler";