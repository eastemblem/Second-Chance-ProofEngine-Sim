interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

export default function ProgressBar({ currentStep, totalSteps, stepName }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{stepName}</span>
      </div>
      <div className="w-full bg-border rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-purple-600 to-yellow-500 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
