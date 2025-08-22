// Buffer polyfill for browser environment
import { Buffer } from 'buffer';

// Ensure Buffer is available globally in all contexts
if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

// Also ensure global is defined for crypto-browserify compatibility
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

export { Buffer };