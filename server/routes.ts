import type { Express } from "express";
import { createServer, type Server } from "http";
import { appLogger } from "./utils/logger";

// Import route modules
import authRoutes from "./routes/auth";
import legacyRoutes from "./routes/legacy";
import v1Routes from "./routes/v1";
import healthRoutes from "./routes/health";
import sentryTestRoutes from "./routes/sentry-test";

// Import individual legacy routes for compatibility
import apiRoutes from "./routes/index";
import { getLeaderboard, createLeaderboardEntry } from "./routes/leaderboard";
import { generateCertificate, downloadCertificate, getCertificateStatus } from "./routes/certificate";
import { generateReport } from "./routes/report";

export async function registerRoutes(app: Express): Promise<Server> {
  appLogger.system("🚀 Registering routes with restructured architecture...");

  // ============================================
  // PHASE 1: AUTHENTICATION ROUTES
  // ============================================
  // Consolidated authentication (both session and JWT)
  app.use('/api/auth', authRoutes);
  appLogger.system("✅ Authentication routes registered: /api/auth/*");

  // ============================================
  // PHASE 2: LEGACY ROUTES (SESSION-BASED)
  // ============================================
  // Legacy session-based routes for backward compatibility
  app.use('/api/legacy', legacyRoutes);
  appLogger.system("✅ Legacy routes registered: /api/legacy/*");

  // ============================================
  // PHASE 3: V1 ROUTES (JWT-PROTECTED)
  // ============================================
  // Modern JWT-protected API routes
  app.use('/api/v1', v1Routes);
  appLogger.system("✅ V1 routes registered: /api/v1/*");

  // ============================================
  // PHASE 4: SYSTEM ROUTES
  // ============================================
  // Health monitoring and system status
  app.use('/api/health', healthRoutes);
  appLogger.system("✅ Health routes registered: /api/health/*");

  // Sentry error testing routes
  app.use(sentryTestRoutes);
  appLogger.system("✅ Sentry test routes registered");

  // ============================================
  // PHASE 5: LEGACY COMPATIBILITY ROUTES
  // ============================================
  // Legacy API routes for existing frontend compatibility
  app.use("/api", apiRoutes);
  appLogger.system("✅ Legacy API routes registered: /api/*");

  // Legacy leaderboard routes
  app.get("/api/leaderboard", getLeaderboard);
  app.post("/api/leaderboard", createLeaderboardEntry);
  appLogger.system("✅ Legacy leaderboard routes registered");

  // Legacy certificate routes
  app.post("/api/certificate/generate", generateCertificate);
  app.get("/api/certificate/download/:sessionId", downloadCertificate);
  app.get("/api/certificate/status/:sessionId", getCertificateStatus);
  appLogger.system("✅ Legacy certificate routes registered");

  // Legacy report routes
  app.post("/api/report/generate", generateReport);
  appLogger.system("✅ Legacy report routes registered");

  // Email routes (if available)
  try {
    const emailRoutes = (await import("./routes/emailRoutes")).default;
    app.use("/api/email", emailRoutes);
    appLogger.system("✅ Email routes registered: /api/email/*");
  } catch (error) {
    appLogger.system("⚠️ Email routes not available - continuing without email functionality");
  }

  // ============================================
  // ROUTE REGISTRATION SUMMARY
  // ============================================
  appLogger.system("🎯 Route registration complete!");
  appLogger.system("📋 Available route groups:");
  appLogger.system("  • /api/auth/* - Authentication (session + JWT)");
  appLogger.system("  • /api/legacy/* - Legacy session-based routes");
  appLogger.system("  • /api/v1/* - Modern JWT-protected routes");
  appLogger.system("  • /api/health/* - System monitoring");
  appLogger.system("  • /api/* - Legacy compatibility routes");

  // ============================================
  // CREATE HTTP SERVER
  // ============================================
  const httpServer = createServer(app);
  appLogger.system("🚀 HTTP server created successfully");

  return httpServer;
}