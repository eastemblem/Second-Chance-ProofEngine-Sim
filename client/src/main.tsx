import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./utils/chunk-optimizer";

// Initialize performance optimizations
initializeOptimizations();

createRoot(document.getElementById("root")!).render(<App />);
