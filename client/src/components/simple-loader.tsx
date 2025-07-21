// Simple loading component to prevent white screens
export function SimpleLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(240 10% 6%)', color: 'hsl(0 0% 98%)' }}>
      <div className="text-center">
        <div 
          className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4" 
          style={{ 
            borderColor: 'hsl(263 70% 64%)', 
            borderTopColor: 'transparent' 
          }}
        ></div>
        <p style={{ color: 'hsl(0 0% 64%)' }} className="text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Inline loading spinner for smaller components
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}