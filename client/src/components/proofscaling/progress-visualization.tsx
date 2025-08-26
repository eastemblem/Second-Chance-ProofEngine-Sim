import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Step {
  title: string;
  description: string;
  duration: string;
  completed?: boolean;
}

const steps: Step[] = [
  {
    title: "ProofScore Validation",
    description: "AI validates your startup readiness",
    duration: "24 hours",
    completed: true
  },
  {
    title: "Investor Matching", 
    description: "Algorithm matches you with VCs",
    duration: "48 hours",
    completed: true
  },
  {
    title: "Warm Introductions",
    description: "Get connected to interested investors",
    duration: "1 week",
    completed: false
  },
  {
    title: "Term Sheet",
    description: "Close your funding round",
    duration: "2-4 weeks",
    completed: false
  }
];

export function ProgressVisualization() {
  return (
    <div className="relative">
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative"
          >
            <Card className={`p-6 text-center transition-all duration-300 hover:shadow-lg ${
              step.completed 
                ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
                : 'bg-card/50 border-border/50 hover:border-primary/30'
            }`}>
              <div className="flex justify-center mb-4">
                {step.completed ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </motion.div>
                ) : (
                  <Circle className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <h3 className={`font-bold mb-2 ${step.completed ? 'text-green-500' : 'text-foreground'}`}>
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {step.description}
              </p>
              <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
                step.completed 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-primary/20 text-primary'
              }`}>
                {step.duration}
              </div>
            </Card>
            
            {/* Connecting arrow */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                >
                  <ArrowRight className={`w-6 h-6 ${step.completed ? 'text-green-500' : 'text-primary'}`} />
                </motion.div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="mt-8">
        <div className="w-full bg-border rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-primary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "50%" }}
            transition={{ duration: 2, delay: 0.5 }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Average timeline: 6-8 weeks from validation to funding
        </p>
      </div>
    </div>
  );
}