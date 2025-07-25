// Sentry initialization for server-side error tracking
import * as Sentry from "@sentry/node";

let sentryInitialized = false;

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not found - error tracking disabled');
    console.log('💡 Add SENTRY_DSN to your Replit secrets to enable error monitoring');
    return null;
  }

  if (sentryInitialized) {
    return Sentry;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      integrations: [
        // HTTP integration for request tracing
        Sentry.httpIntegration(),
        // Express integration
        Sentry.expressIntegration(),
        // File system integration
        Sentry.fsIntegration(),
      ],
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        return event;
      },
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully for server-side error tracking');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 DSN configured: ***${process.env.SENTRY_DSN.slice(-8)}`);
    
    return Sentry;
  } catch (error: any) {
    console.error('❌ Sentry initialization failed:', error.message);
    return null;
  }
}

// Export Sentry instance for use throughout the application
export { Sentry };

// Error context enrichment with enhanced transmission logging
export function enrichErrorContext(error: Error, user: any = {}, context: any = {}) {
  if (!sentryInitialized) {
    console.log('📊 Error captured (Sentry not initialized):', error.message);
    return;
  }

  try {
    // Set user context if provided
    if (user && Object.keys(user).length > 0) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        venture: user.ventureName,
      });
    }

    // Add custom context
    Sentry.withScope((scope) => {
      // Add component context
      if (context.component) {
        scope.setTag('component', context.component);
      }
      if (context.page) {
        scope.setTag('page', context.page);
      }
      if (context.operation) {
        scope.setTag('operation', context.operation);
      }

      // Add business context
      if (context.proofScore) {
        scope.setExtra('proofScore', context.proofScore);
      }
      if (context.fileUpload) {
        scope.setExtra('fileUpload', context.fileUpload);
      }
      if (context.folderOperation) {
        scope.setExtra('folderOperation', context.folderOperation);
      }

      // Add request metadata
      if (context.requestPath) {
        scope.setExtra('requestPath', context.requestPath);
      }
      if (context.userAgent) {
        scope.setExtra('userAgent', context.userAgent);
      }

      // Enhanced logging for debugging transmission
      console.log('🔴 Sending error to Sentry dashboard:', error.message);
      console.log('📊 Error context:', {
        user: user ? Object.keys(user) : [],
        context: Object.keys(context),
        timestamp: new Date().toISOString()
      });
      
      // Capture the error
      Sentry.captureException(error);
      
      // Force flush to ensure immediate transmission
      Sentry.flush(2000).then(() => {
        console.log('✅ Error successfully transmitted to Sentry dashboard');
      }).catch((flushError) => {
        console.error('❌ Failed to transmit error to Sentry:', flushError);
      });
    });
  } catch (sentryError) {
    console.error('❌ Sentry error processing failed:', sentryError);
  }
}

// Performance monitoring
export function startTransaction(name: string, operation: string) {
  if (!sentryInitialized) return null;
  
  return Sentry.startSpan({
    name,
    op: operation,
  }, (span) => span);
}

// Custom error reporting
export function reportError(error: Error | string, level: 'error' | 'warning' | 'info' = 'error', extra?: Record<string, any>) {
  if (!sentryInitialized) {
    console.error('Sentry not initialized, logging error:', error);
    return;
  }
  
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (extra) {
      Object.keys(extra).forEach(key => {
        scope.setExtra(key, extra[key]);
      });
    }
    
    if (typeof error === 'string') {
      Sentry.captureMessage(error, level);
    } else {
      Sentry.captureException(error);
    }
  });
}