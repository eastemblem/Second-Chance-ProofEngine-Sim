import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, User, Shield, Building, FileText, Navigation, Settings, CheckCircle, Upload, Plus, Award, Clock } from "lucide-react";
import { LoadingSpinner, EmptyState, PaginationLoading, EndIndicator } from "../shared";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  totalActivities: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

// Format time ago helper
function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return activityTime.toLocaleDateString();
}

// Get icon component helper
function getIconComponent(iconName: string) {
  const iconMap = {
    'User': User,
    'Shield': Shield,
    'Building': Building,
    'FileText': FileText,
    'TrendingUp': TrendingUp,
    'Navigation': Navigation,
    'Settings': Settings,
    'CheckCircle': CheckCircle,
    'Upload': Upload,
    'Plus': Plus,
    'Award': Award,
    'Circle': Clock
  };
  return iconMap[iconName as keyof typeof iconMap] || Clock;
}

export function ActivityFeed({ 
  activities, 
  totalActivities, 
  isLoading, 
  isLoadingMore, 
  hasMore, 
  onLoadMore 
}: ActivityFeedProps) {
  const activityContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll-based pagination for activities
  const handleActivityScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load more when user scrolls to within 100px of bottom
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  };

  const colorClasses = {
    green: "text-green-400 bg-green-400/20 border-green-400/30",
    blue: "text-blue-400 bg-blue-400/20 border-blue-400/30",
    purple: "text-purple-400 bg-purple-400/20 border-purple-400/30",
    yellow: "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
    orange: "text-orange-400 bg-orange-400/20 border-orange-400/30",
    red: "text-red-400 bg-red-400/20 border-red-400/30",
    gray: "text-gray-400 bg-gray-400/20 border-gray-400/30"
  };

  return (
    <Card className="border-gray-800" style={{ backgroundColor: '#0E0E12' }}>
      <CardHeader>
        <CardTitle className="text-white text-3xl font-bold">
          Recent Activity
        </CardTitle>
        <CardDescription className="text-gray-400">
          Your latest platform interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          ref={activityContainerRef}
          className="space-y-3 max-h-80 overflow-y-auto"
          onScroll={handleActivityScroll}
        >
          {isLoading && activities.length === 0 ? (
            <LoadingSpinner text="Loading activities..." />
          ) : activities.length > 0 ? (
            activities.map((activity) => {
              const timeAgo = formatTimeAgo(activity.timestamp);
              const IconComponent = getIconComponent(activity.icon);
              const colorClass = colorClasses[activity.color as keyof typeof colorClasses] || colorClasses.gray;
              
              return (
                <div key={activity.id} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800/30 to-gray-900/50 border border-gray-700/50 p-3 hover:border-gray-600/70 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${colorClass}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{activity.title}</p>
                      <p className="text-gray-400 text-xs truncate">{activity.description}</p>
                      <p className="text-gray-500 text-xs mt-1">{timeAgo}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Clock}
              title="No recent activity"
            />
          )}
          
          {/* Loading indicator for pagination */}
          {isLoadingMore && (
            <PaginationLoading text="Loading more activities..." />
          )}
          
          {/* End of activities indicator */}
          {!hasMore && activities.length > 0 && (
            <EndIndicator totalCount={totalActivities} itemName="activities" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}