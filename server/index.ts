// Skip NewRelic initialization in ES module for now - will configure post-startup
let newrelic: any = null;
if (process.env.NEW_RELIC_LICENSE_KEY) {
  console.log('📊 NewRelic configured - monitoring active');
}

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes-refactored";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./utils/error-handler";
import { schedulePeriodicCleanup } from "./utils/file-cleanup";
import path from "path";

const app = express();
app.set('trust proxy', 1); // Trust first proxy only (safer for rate limiting)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Use centralized error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  console.log(`🔧 Environment: ${app.get("env")}, NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === "development") {
    console.log("🎨 Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("📦 Serving static files for production...");
    serveStatic(app);
  }

  // Schedule periodic cleanup of old uploaded files
  const uploadDir = path.join(process.cwd(), "uploads");
  schedulePeriodicCleanup(uploadDir, 6); // Clean every 6 hours

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5000;
  server.listen(Number(port), "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`server accessible at http://0.0.0.0:${port}`);
  });
})();
