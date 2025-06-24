import { lazy, Suspense } from "react";

// Lazy load Recharts components for better performance
const LazyResponsiveContainer = lazy(() => 
  import("recharts").then(mod => ({ default: mod.ResponsiveContainer }))
);

const LazyBarChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.BarChart }))
);

const LazyBar = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Bar }))
);

const LazyXAxis = lazy(() => 
  import("recharts").then(mod => ({ default: mod.XAxis }))
);

const LazyYAxis = lazy(() => 
  import("recharts").then(mod => ({ default: mod.YAxis }))
);

const LazyCartesianGrid = lazy(() => 
  import("recharts").then(mod => ({ default: mod.CartesianGrid }))
);

const LazyCell = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Cell }))
);

interface OptimizedChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors: string[];
  height?: number;
}

export default function OptimizedChart({ 
  data, 
  dataKey, 
  nameKey, 
  colors, 
  height = 300 
}: OptimizedChartProps) {
  return (
    <Suspense fallback={
      <div 
        className="w-full bg-muted animate-pulse rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-muted-foreground text-sm">Loading chart...</div>
      </div>
    }>
      <LazyResponsiveContainer width="100%" height={height}>
        <LazyBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <LazyCartesianGrid strokeDasharray="3 3" />
          <LazyXAxis dataKey={nameKey} />
          <LazyYAxis />
          <LazyBar dataKey={dataKey}>
            {data.map((entry, index) => (
              <LazyCell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </LazyBar>
        </LazyBarChart>
      </LazyResponsiveContainer>
    </Suspense>
  );
}

export { LazyResponsiveContainer, LazyBarChart, LazyBar, LazyXAxis, LazyYAxis, LazyCartesianGrid, LazyCell };