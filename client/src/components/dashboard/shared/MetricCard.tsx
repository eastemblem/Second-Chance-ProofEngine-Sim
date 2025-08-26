import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  color?: 'purple' | 'blue' | 'yellow' | 'green' | 'orange' | 'red' | 'teal' | 'indigo' | 'gray';
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = 'gray',
  children,
  onClick,
  className = ""
}: MetricCardProps) {
  const colorClasses = {
    purple: "from-purple-500/10 to-purple-600/20 border-purple-500/30 hover:border-purple-400/50",
    blue: "from-blue-500/10 to-blue-600/20 border-blue-500/30 hover:border-blue-400/50",
    yellow: "from-yellow-500/10 to-amber-600/20 border-yellow-500/30 hover:border-yellow-400/50",
    green: "from-green-500/10 to-green-600/20 border-green-500/30 hover:border-green-400/50",
    orange: "from-orange-500/10 to-orange-600/20 border-orange-500/30 hover:border-orange-400/50",
    red: "from-red-500/10 to-red-600/20 border-red-500/30 hover:border-red-400/50",
    teal: "from-teal-500/10 to-teal-600/20 border-teal-500/30 hover:border-teal-400/50",
    indigo: "from-indigo-500/10 to-indigo-600/20 border-indigo-500/30 hover:border-indigo-400/50",
    gray: "from-gray-500/10 to-gray-600/20 border-gray-500/30 hover:border-gray-400/50"
  };

  const textColorClasses = {
    purple: "text-purple-400",
    blue: "text-blue-400", 
    yellow: "text-yellow-400",
    green: "text-green-400",
    orange: "text-orange-400",
    red: "text-red-400",
    teal: "text-teal-400",
    indigo: "text-indigo-400",
    gray: "text-gray-400"
  };

  const iconBgClasses = {
    purple: "bg-purple-500/20",
    blue: "bg-blue-500/20",
    yellow: "bg-yellow-500/20", 
    green: "bg-green-500/20",
    orange: "bg-orange-500/20",
    red: "bg-red-500/20",
    teal: "bg-teal-500/20",
    indigo: "bg-indigo-500/20",
    gray: "bg-gray-500/20"
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${colorClasses[color]} border p-4 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative text-center">
        {Icon && (
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${iconBgClasses[color]} mx-auto`}>
              <Icon className={`w-6 h-6 ${textColorClasses[color]}`} />
            </div>
          </div>
        )}
        <div className={`text-2xl font-bold ${textColorClasses[color]} mb-2`}>{value}</div>
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-gray-400 text-sm">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}