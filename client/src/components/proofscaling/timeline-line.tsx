interface TimelineLineProps {
  isActive?: boolean;
  isCompleted?: boolean;
}

export function TimelineLine({ isActive = false, isCompleted = false }: TimelineLineProps) {
  return (
    <div className="flex justify-center py-4">
      <div className={`w-1 h-8 transition-colors duration-300 ${
        isCompleted 
          ? 'bg-gradient-to-b from-green-500 to-blue-500' 
          : isActive 
            ? 'bg-gradient-to-b from-purple-500 to-blue-500' 
            : 'bg-gray-700'
      }`} />
    </div>
  );
}