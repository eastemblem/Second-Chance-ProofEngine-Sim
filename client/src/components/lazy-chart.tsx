import { lazy, Suspense } from "react";

const LazyBarChart = lazy(() => import("recharts").then(mod => ({ 
  default: ({ children, ...props }: any) => {
    const { BarChart } = mod;
    return <BarChart {...props}>{children}</BarChart>;
  }
})));

const LazyResponsiveContainer = lazy(() => import("recharts").then(mod => ({ 
  default: mod.ResponsiveContainer 
})));

export function LazyChart({ children, ...props }: any) {
  return (
    <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded" />}>
      <LazyResponsiveContainer width="100%" height={300}>
        <LazyBarChart {...props}>
          {children}
        </LazyBarChart>
      </LazyResponsiveContainer>
    </Suspense>
  );
}

export const LazyBar = lazy(() => import("recharts").then(mod => ({ default: mod.Bar })));
export const LazyXAxis = lazy(() => import("recharts").then(mod => ({ default: mod.XAxis })));
export const LazyYAxis = lazy(() => import("recharts").then(mod => ({ default: mod.YAxis })));
export const LazyCartesianGrid = lazy(() => import("recharts").then(mod => ({ default: mod.CartesianGrid })));
export const LazyCell = lazy(() => import("recharts").then(mod => ({ default: mod.Cell })));