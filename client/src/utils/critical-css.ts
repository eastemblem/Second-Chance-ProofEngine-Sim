// Critical CSS extraction and inlining
export const criticalCSS = `
/* Critical above-the-fold styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.min-h-screen {
  min-height: 100vh;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.rounded-full {
  border-radius: 9999px;
}

.h-8 { height: 2rem; }
.w-8 { width: 2rem; }

.border-b-2 {
  border-bottom-width: 2px;
}

.border-primary {
  border-color: hsl(var(--primary));
}

:root {
  --primary: 262.1 83.3% 57.8%;
}
`;

export function injectCriticalCSS() {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }
}