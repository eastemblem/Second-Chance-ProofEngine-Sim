import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Ensure React is available globally before any components load
(window as any).React = React;

// Import SimpleApp instead to test basic functionality
import SimpleApp from "./SimpleApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Render simple app without problematic hooks
createRoot(root).render(React.createElement(SimpleApp));

// Mark as loaded and initialize optimizations
document.body.classList.add('loaded');

// Optimization loading disabled to prevent paint interference
// Performance monitoring was causing high LCP times (34+ seconds)
// Re-enable after investigating paint issue resolution
