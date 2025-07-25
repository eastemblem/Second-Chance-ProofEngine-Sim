// Sentry initialization for client-side error tracking
import * as Sentry from "@sentry/react";
import React from "react";

let sentryInitialized = false;

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not found - client error tracking disabled');
    console.log('💡 Add VITE_SENTRY_DSN to your environment variables to enable error monitoring');
    return null;
  }

  if (sentryInitialized) {
    return Sentry;
  }

  try {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE || 'development',
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration({
          // Capture interactions and navigation
          tracePropagationTargets: ["localhost", /^\/api/],
        }),
        Sentry.replayIntegration({
          // Capture replays of user sessions for debugging
          maskAllText: false,
          blockAllMedia: false,
        }),
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
        
        // Don't send events for localhost in development
        if (import.meta.env.MODE === 'development' && 
            event.request?.url?.includes('localhost')) {
          return null;
        }
        
        return event;
      },
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully for client-side error tracking');
    console.log(`📊 Environment: ${import.meta.env.MODE || 'development'}`);
    
    return Sentry;
  } catch (error: any) {
    console.error('❌ Sentry client initialization failed:', error.message);
    return null;
  }
}

// Error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Error context enrichment for React components
export function enrichErrorContext(error: Error, errorInfo: any, context: Record<string, any>) {
  if (!sentryInitialized) return;
  
  Sentry.withScope((scope) => {
    // Add component context
    if (errorInfo.componentStack) {
      scope.setContext('componentStack', {
        stack: errorInfo.componentStack,
      });
    }
    
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Add tags for better filtering
    if (context.component) {
      scope.setTag('component', context.component);
    }
    if (context.page) {
      scope.setTag('page', context.page);
    }
    
    Sentry.captureException(error);
  });
}

// Performance monitoring for React components
export function startTransaction(name: string, operation: string = 'navigation') {
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

// User context for better error tracking
export function setUserContext(user: { id: string; email?: string; [key: string]: any }) {
  if (!sentryInitialized) return;
  
  Sentry.setUser(user);
}

// Clear user context on logout
export function clearUserContext() {
  if (!sentryInitialized) return;
  
  Sentry.setUser(null);
}

export { Sentry };