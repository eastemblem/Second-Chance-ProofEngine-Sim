import { lazy } from "react";

// Lazy load heavy icon sets to reduce initial bundle
export const LazyReactIcons = {
  Si: lazy(() => import("react-icons/si")),
  Fa: lazy(() => import("react-icons/fa")),
  Md: lazy(() => import("react-icons/md")),
  Io: lazy(() => import("react-icons/io5"))
};

// Keep Lucide icons as regular imports since they're lightweight and frequently used
export * from "lucide-react";