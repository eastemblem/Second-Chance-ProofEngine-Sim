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

// Optimization loading disabled to prevent paint interference
// Performance monitoring was causing high LCP times (34+ seconds)
// Re-enable after investigating paint issue resolution
