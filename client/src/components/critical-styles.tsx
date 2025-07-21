// Critical CSS injection to prevent white screen
export function CriticalStyles() {
  return (
    <style>{`
      /* Critical styles to prevent white screen on slow connections */
      body, #root {
        background-color: hsl(240 10% 6%) !important;
        color: hsl(0 0% 98%) !important;
        margin: 0;
        padding: 0;
        min-height: 100vh;
      }
      
      /* Loading fallback styles */
      .loading-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: hsl(240 10% 6%);
        color: hsl(0 0% 98%);
      }
      
      /* Spinner animation */
      .critical-spinner {
        width: 32px;
        height: 32px;
        border: 2px solid hsl(263 70% 64%);
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  );
}