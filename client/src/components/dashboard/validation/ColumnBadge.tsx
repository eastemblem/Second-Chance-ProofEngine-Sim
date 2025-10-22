interface ColumnBadgeProps {
  children: React.ReactNode;
  variant?: "purple" | "magenta" | "violet" | "indigo" | "blue" | "cyan" | "teal" | "emerald" | "green" | "lime" | "yellow" | "amber" | "orange" | "red" | "pink" | "rose" | "fuchsia" | "gray" | "slate";
}

export function ColumnBadge({ children, variant = "purple" }: ColumnBadgeProps) {
  const variants = {
    purple: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    magenta: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
    violet: "bg-gradient-to-r from-violet-500 to-purple-600 text-white",
    indigo: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    cyan: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
    teal: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    green: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
    lime: "bg-gradient-to-r from-lime-500 to-green-600 text-white",
    yellow: "bg-gradient-to-r from-yellow-500 to-amber-600 text-white",
    amber: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
    orange: "bg-gradient-to-r from-orange-500 to-red-600 text-white",
    red: "bg-gradient-to-r from-red-500 to-pink-600 text-white",
    pink: "bg-gradient-to-r from-pink-500 to-rose-600 text-white",
    rose: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
    fuchsia: "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white",
    gray: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
    slate: "bg-gradient-to-r from-slate-500 to-gray-600 text-white",
  };

  return (
    <div className={`inline-block px-4 py-1.5 rounded-md font-medium text-sm ${variants[variant]}`}>
      {children}
    </div>
  );
}
