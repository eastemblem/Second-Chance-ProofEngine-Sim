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
        Sentry.httpIntegration({ tracing: true }),
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

// Error context enrichment
export function enrichErrorContext(error: Error, context: Record<string, any>) {
  if (!sentryInitialized) return;
  
  Sentry.withScope((scope) => {
    // Add user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Add custom context
    Object.keys(context).forEach(key => {
      if (key !== 'userId') {
        scope.setContext(key, context[key]);
      }
    });
    
    // Add tags for better filtering
    if (context.component) {
      scope.setTag('component', context.component);
    }
    if (context.operation) {
      scope.setTag('operation', context.operation);
    }
    
    Sentry.captureException(error);
  });
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