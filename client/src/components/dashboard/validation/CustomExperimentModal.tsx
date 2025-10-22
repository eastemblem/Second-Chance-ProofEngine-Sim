import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface CustomExperimentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (experimentData: CustomExperimentData) => void;
  isSubmitting: boolean;
}

export interface CustomExperimentData {
  name: string;
  definition: string;
  hypothesisTested: string;
  experimentFormat: string;
  signalTracked: string;
  targetMetric: string;
  toolsPlatforms?: string;
  typicalDuration?: string;
  notes?: string;
}

export function CustomExperimentModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CustomExperimentModalProps) {
  const [formData, setFormData] = useState<CustomExperimentData>({
    name: "",
    definition: "",
    hypothesisTested: "",
    experimentFormat: "",
    signalTracked: "",
    targetMetric: "",
    toolsPlatforms: "",
    typicalDuration: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CustomExperimentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Experiment name is required";
    }
    if (!formData.definition.trim()) {
      newErrors.definition = "Definition is required";
    }
    if (!formData.hypothesisTested.trim()) {
      newErrors.hypothesisTested = "Hypothesis tested is required";
    }
    if (!formData.experimentFormat.trim()) {
      newErrors.experimentFormat = "Experiment format is required";
    }
    if (!formData.signalTracked.trim()) {
      newErrors.signalTracked = "Signal tracked is required";
    }
    if (!formData.targetMetric.trim()) {
      newErrors.targetMetric = "Target metric is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      definition: "",
      hypothesisTested: "",
      experimentFormat: "",
      signalTracked: "",
      targetMetric: "",
      toolsPlatforms: "",
      typicalDuration: "",
      notes: "",
    });
    setErrors({});
  };

  // Reset form when modal opens to ensure fresh state
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Reset form when modal closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Create Custom Experiment
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Design your own validation experiment with full control over all parameters
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Experiment Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Experiment Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Beta User Feedback Loop"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                data-testid="input-custom-name"
              />
              {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
            </div>

            {/* Definition */}
            <div className="space-y-2">
              <Label htmlFor="definition" className="text-white">
                Definition <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="definition"
                value={formData.definition}
                onChange={(e) => handleChange("definition", e.target.value)}
                placeholder="Describe what this experiment is about..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 min-h-[80px]"
                data-testid="input-custom-definition"
              />
              {errors.definition && <p className="text-sm text-red-400">{errors.definition}</p>}
            </div>

            {/* Hypothesis Tested */}
            <div className="space-y-2">
              <Label htmlFor="hypothesisTested" className="text-white">
                Hypothesis Tested <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="hypothesisTested"
                value={formData.hypothesisTested}
                onChange={(e) => handleChange("hypothesisTested", e.target.value)}
                placeholder="What hypothesis will this experiment validate?"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 min-h-[80px]"
                data-testid="input-custom-hypothesis"
              />
              {errors.hypothesisTested && <p className="text-sm text-red-400">{errors.hypothesisTested}</p>}
            </div>

            {/* Experiment Format */}
            <div className="space-y-2">
              <Label htmlFor="experimentFormat" className="text-white">
                Experiment Format <span className="text-red-400">*</span>
              </Label>
              <Input
                id="experimentFormat"
                value={formData.experimentFormat}
                onChange={(e) => handleChange("experimentFormat", e.target.value)}
                placeholder="e.g., A/B Test, Survey, Interview"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                data-testid="input-custom-format"
              />
              {errors.experimentFormat && <p className="text-sm text-red-400">{errors.experimentFormat}</p>}
            </div>

            {/* Signal Tracked */}
            <div className="space-y-2">
              <Label htmlFor="signalTracked" className="text-white">
                Signal Tracked (Target Behaviour) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="signalTracked"
                value={formData.signalTracked}
                onChange={(e) => handleChange("signalTracked", e.target.value)}
                placeholder="What behaviour are you tracking?"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                data-testid="input-custom-signal"
              />
              {errors.signalTracked && <p className="text-sm text-red-400">{errors.signalTracked}</p>}
            </div>

            {/* Target Metric */}
            <div className="space-y-2">
              <Label htmlFor="targetMetric" className="text-white">
                Target Metric <span className="text-red-400">*</span>
              </Label>
              <Input
                id="targetMetric"
                value={formData.targetMetric}
                onChange={(e) => handleChange("targetMetric", e.target.value)}
                placeholder="e.g., 30% conversion rate, 50 sign-ups"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                data-testid="input-custom-metric"
              />
              {errors.targetMetric && <p className="text-sm text-red-400">{errors.targetMetric}</p>}
            </div>

            {/* Tools/Platforms (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="toolsPlatforms" className="text-white">
                Tools/Platforms <span className="text-gray-500 text-sm">(Optional)</span>
              </Label>
              <Input
                id="toolsPlatforms"
                value={formData.toolsPlatforms}
                onChange={(e) => handleChange("toolsPlatforms", e.target.value)}
                placeholder="e.g., Google Analytics, Typeform, Hotjar"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                data-testid="input-custom-tools"
              />
            </div>

            {/* Typical Duration (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="typicalDuration" className="text-white">
                Typical Duration <span className="text-gray-500 text-sm">(Optional)</span>
              </Label>
              <Input
                id="typicalDuration"
                value={formData.typicalDuration}
                onChange={(e) => handleChange("typicalDuration", e.target.value)}
                placeholder="e.g., 2 weeks, 1 month"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
                data-testid="input-custom-duration"
              />
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">
                Additional Notes <span className="text-gray-500 text-sm">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional context or considerations..."
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500 min-h-[80px]"
                data-testid="input-custom-notes"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            data-testid="button-cancel-custom"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            data-testid="button-create-custom"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Experiment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
