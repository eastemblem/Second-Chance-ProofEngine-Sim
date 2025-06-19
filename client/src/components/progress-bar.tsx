interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

const stepNames = [
  "Founder Details",
  "Venture Info", 
  "Team Members",
  "Pitch Deck",
  "Processing",
  "Analysis"
];

export default function ProgressBar({ currentStep, totalSteps, stepName }: ProgressBarProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-center items-center space-x-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 mb-2 ${
                i + 1 <= currentStep
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-gray-600 text-white border-gray-600"
              }`}
            >
              {i + 1 <= currentStep ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className="text-xs text-center text-muted-foreground max-w-20">
              {stepNames[i] || `Step ${i + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
