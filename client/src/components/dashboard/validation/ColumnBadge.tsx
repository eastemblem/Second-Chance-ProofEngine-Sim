interface ColumnBadgeProps {
  children: React.ReactNode;
  variant?: "purple" | "yellow" | "blue" | "orange" | "cyan" | "gradient" | "gray" | "green";
}

export function ColumnBadge({ children, variant = "purple" }: ColumnBadgeProps) {
  const variants = {
    purple: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    yellow: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    orange: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    cyan: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white",
    gradient: "bg-gradient-to-r from-purple-500 to-orange-500 text-white",
    gray: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
    green: "bg-gradient-to-r from-green-500 to-green-600 text-white",
  };

  return (
    <div className={`inline-block px-4 py-1.5 rounded-md font-medium text-sm ${variants[variant]}`}>
      {children}
    </div>
  );
}
