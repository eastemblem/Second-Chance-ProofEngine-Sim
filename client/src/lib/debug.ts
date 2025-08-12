// Production-safe debug utilities
export const isDevelopment = import.meta.env.MODE === 'development';

// Production-safe console methods
export const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

// For production, we can still track errors silently without console output
export const trackError = (error: any, context?: string) => {
  if (isDevelopment) {
    console.error(context ? `${context}:` : 'Error:', error);
  }
  // In production, errors are sent to Sentry without console output
};