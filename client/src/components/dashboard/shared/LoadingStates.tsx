import { RefreshCw, Clock } from "lucide-react";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <div className="text-center text-gray-400">
        <RefreshCw className={`${sizeClasses[size]} mx-auto mb-2 animate-spin opacity-50`} />
        {text && <p className={textSizeClasses[size]}>{text}</p>}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Clock, 
  title = "No data available", 
  description,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="text-center text-gray-400">
        <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs mt-1">{description}</p>}
      </div>
    </div>
  );
}

interface PaginationLoadingProps {
  text?: string;
  className?: string;
}

export function PaginationLoading({ text = "Loading more...", className = "" }: PaginationLoadingProps) {
  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <div className="text-center text-gray-400">
        <RefreshCw className="w-5 h-5 mx-auto mb-1 animate-spin opacity-50" />
        <p className="text-xs">{text}</p>
      </div>
    </div>
  );
}

interface EndIndicatorProps {
  totalCount?: number;
  itemName?: string;
  className?: string;
}

export function EndIndicator({ totalCount, itemName = "items", className = "" }: EndIndicatorProps) {
  return (
    <div className={`text-center py-2 ${className}`}>
      <p className="text-xs text-gray-500">
        {totalCount ? `All ${totalCount} ${itemName} loaded` : `End of ${itemName}`}
      </p>
    </div>
  );
}