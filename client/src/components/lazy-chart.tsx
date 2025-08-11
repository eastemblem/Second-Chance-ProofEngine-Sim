import { lazy, Suspense } from "react";

// Lazy load Recharts components for better performance
const ResponsiveContainer = lazy(() => 
  import("recharts").then(mod => ({ default: mod.ResponsiveContainer }))
);

const BarChart = lazy(() => 
  import("recharts").then(mod => ({ default: mod.BarChart }))
);

const Bar = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Bar as unknown as React.ComponentType<any> }))
);

const XAxis = lazy(() => 
  import("recharts").then(mod => ({ default: mod.XAxis }))
);

const YAxis = lazy(() => 
  import("recharts").then(mod => ({ default: mod.YAxis }))
);

const CartesianGrid = lazy(() => 
  import("recharts").then(mod => ({ default: mod.CartesianGrid }))
);

const Cell = lazy(() => 
  import("recharts").then(mod => ({ default: mod.Cell }))
);

interface LazyChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors: string[];
  height?: number;
}

export default function LazyChart({ 
  data, 
  dataKey, 
  nameKey, 
  colors, 
  height = 300 
}: LazyChartProps) {
  return (
    <Suspense fallback={
      <div 
        className="w-full bg-muted/30 animate-pulse rounded-lg flex items-center justify-center border"
        style={{ height }}
      >
        <div className="text-muted-foreground text-sm">Loading chart...</div>
      </div>
    }>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} />
          <YAxis />
          <Bar dataKey={dataKey}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Suspense>
  );
}

export { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell };