import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./utils/chunk-optimizer";

// Initialize performance optimizations
initializeOptimizations();

// Enable advanced optimizations for sub-3s target
if (typeof window !== 'undefined') {
  import("./utils/advanced-optimizer").then(({ enableAdvancedOptimizations, optimizeMemoryUsage }) => {
    enableAdvancedOptimizations();
    optimizeMemoryUsage();
  });
}

createRoot(document.getElementById("root")!).render(<App />);
