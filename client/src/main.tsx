import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Minimal initialization to prevent blocking render
const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Immediate render with no blocking operations
createRoot(root).render(<App />);

// Mark as loaded and initialize optimizations
document.body.classList.add('loaded');

// Delayed optimization loading to prevent blocking
setTimeout(async () => {
  try {
    const { initializeOptimizations } = await import("./utils/chunk-optimizer");
    initializeOptimizations();
  } catch (error) {
    // Silently handle optimization errors
  }
}, 500);
