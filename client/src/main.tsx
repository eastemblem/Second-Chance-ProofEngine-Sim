import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeOptimizations } from "./utils/chunk-optimizer";
import { injectCriticalCSS } from "./utils/critical-css";
import { registerServiceWorker } from "./utils/service-worker";
import "./utils/bundle-analyzer";

// Inject critical CSS immediately for fastest render
injectCriticalCSS();

// Initialize performance optimizations
initializeOptimizations();

// Register service worker for aggressive caching
registerServiceWorker();

// Lazy load main CSS after critical render
setTimeout(() => {
  import("./index.css");
}, 50);

createRoot(document.getElementById("root")!).render(<App />);
