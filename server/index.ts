// Initialize monitoring services
// Sentry must be imported before any other modules
import { initSentry, Sentry, enrichErrorContext } from "./sentry";
import { appLogger } from "./utils/logger";
const sentry = initSentry();

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
    
    appLogger.system('NewRelic module loaded, checking functions...', { 
      type: typeof newrelic,
      recordMetric: typeof newrelic?.recordMetric 
    });
    
    if (newrelic && typeof newrelic.recordMetric === 'function') {
      appLogger.system('NewRelic agent initialized successfully - monitoring active', {
        appName: 'Second Chance Platform',
        licenseKey: '***' + process.env.NEW_RELIC_LICENSE_KEY.slice(-4)
      });
      
      // Record startup metric
      newrelic.recordMetric('Custom/ApplicationStart', 1);
      appLogger.performance('Startup metric recorded successfully');
    } else {
      // NewRelic is in initialization phase - this is normal behavior
      appLogger.system('NewRelic agent in initialization phase (configuration loaded)');
      appLogger.system('NewRelic monitoring will activate once agent fully starts');
      
      // Don't throw error - the agent will become functional later
      // The require('newrelic') call starts the agent initialization process
    }
  } catch (error: any) {
    appLogger.error('NewRelic initialization failed - monitoring disabled', error);
    appLogger.warn('Verify your NEW_RELIC_LICENSE_KEY is valid in your Replit secrets');
    newrelic = null;
  }
} else {
  appLogger.warn('NewRelic license key not found - monitoring disabled');
  appLogger.info('Add NEW_RELIC_LICENSE_KEY to your Replit secrets to enable monitoring');
}

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cookieParser from "cookie-parser";
import compression from "compression";
import { pool } from "./db";
import { registerRoutes } from "./routes-refactored";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./utils/error-handler";
import { schedulePeriodicCleanup } from "./utils/file-cleanup";
import path from "path";

const app = express();

// OPTIMIZATION: Enable GZIP compression for all API responses
app.use(compression({
  // Compress all responses
  filter: (req: Request, res: Response) => {
    // Don't compress responses that are already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  // Compression level (6 is default, good balance of speed/compression)
  level: 6,
  // Compress responses over 1KB
  threshold: 1024
}));

// Add Sentry request handler (must be before all other handlers)
if (sentry && process.env.SENTRY_DSN) {
  // Modern Sentry doesn't require explicit handlers setup
  appLogger.system('Sentry request tracking integrated');
} else if (process.env.SENTRY_DSN) {
  appLogger.warn('Sentry DSN found but handlers not available - check integration');
} else {
  appLogger.warn('Sentry DSN not found - error tracking disabled');
}

app.set('trust proxy', 1); // Trust first proxy only (safer for rate limiting)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configure PostgreSQL session store
const PostgreSqlStore = connectPgSimple(session);

// Configure session middleware with PostgreSQL store
app.use(session({
  store: new PostgreSqlStore({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false, // Don't save empty sessions
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true // Prevent XSS attacks
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
    
    // Send metrics to NewRelic if available and functional
    if (newrelic && path.startsWith("/api") && typeof newrelic.recordMetric === 'function') {
      try {
        newrelic.recordMetric(`Custom/API${path}`, duration);
        newrelic.recordMetric('Custom/APIResponse', 1);
        if (res.statusCode >= 400) {
          newrelic.recordMetric('Custom/APIError', 1);
        }
      } catch (error) {
        // Silently fail if NewRelic recording fails
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Sentry error handling is integrated automatically in modern versions
  if (sentry && process.env.SENTRY_DSN) {
    appLogger.system('Sentry error tracking enabled');
  }

  // Use centralized error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  appLogger.system(`Environment: ${app.get("env")}, NODE_ENV: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === "development") {
    appLogger.system("Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    appLogger.system("Serving static files for production...");
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
    appLogger.system(`Server started on port ${port}`);
    appLogger.system(`Server accessible at http://0.0.0.0:${port}`);
  });
})();
