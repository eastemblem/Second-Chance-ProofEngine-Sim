import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Ensure React is available globally before any components load
(window as any).React = React;

// Import the full App back
import App from "./App";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Render full app with React hooks fix
createRoot(root).render(React.createElement(App));

// Mark as loaded and initialize optimizations
document.body.classList.add('loaded');

// Optimization loading disabled to prevent paint interference
// Performance monitoring was causing high LCP times (34+ seconds)
// Re-enable after investigating paint issue resolution
