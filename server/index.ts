// NewRelic agent initialization 
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let newrelic: any = null;

// Try to initialize NewRelic using require for CommonJS compatibility
if (process.env.NEW_RELIC_LICENSE_KEY) {
  try {
    // Set app name environment variable if not set
    if (!process.env.NEW_RELIC_APP_NAME) {
      process.env.NEW_RELIC_APP_NAME = 'Second Chance Platform';
    }
    
    newrelic = require('newrelic');
    
    if (newrelic && typeof newrelic.recordMetric === 'function') {
      console.log('✅ NewRelic agent initialized successfully - monitoring active');
      console.log('📊 Application name: "Second Chance Platform"');  
      console.log('📊 License key configured: ***' + process.env.NEW_RELIC_LICENSE_KEY.slice(-4));
      
      // Record startup metric
      newrelic.recordMetric('Custom/ApplicationStart', 1);
    } else {
      throw new Error('NewRelic agent not properly loaded');
    }
  } catch (error) {
    console.log('❌ NewRelic initialization failed - monitoring disabled');
    console.error('Error details:', error.message);
    console.log('💡 Verify your NEW_RELIC_LICENSE_KEY is valid in your Replit secrets');
    newrelic = null;
  }
} else {
  console.log('⚠️ NewRelic license key not found - monitoring disabled');
  console.log('💡 Add NEW_RELIC_LICENSE_KEY to your Replit secrets to enable monitoring');
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
    
    // Send metrics to NewRelic if available
    if (newrelic && path.startsWith("/api")) {
      try {
        newrelic.recordMetric(`Custom/API${path}`, duration);
        newrelic.recordMetric('Custom/APIResponse', 1);
        if (res.statusCode >= 400) {
          newrelic.recordMetric('Custom/APIError', 1);
        }
      } catch (error) {
        // Silently fail if NewRelic not available
      }
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
