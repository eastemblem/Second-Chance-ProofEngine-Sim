import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Info } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { useToast } from "@/hooks/use-toast";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

const RichTextEditor = lazy(() => 
  import("./RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

interface InlineFieldEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment: any;
  fieldName: "userHypothesis" | "results" | "customNotes" | "newInsights" | "decision";
  onSave: (id: string, updates: Record<string, any>) => void;
}

const fieldLabels = {
  userHypothesis: "Hypothesis",
  results: "Actual Results",
  customNotes: "Why?",
  newInsights: "New Insights",
  decision: "Decision",
};

const fieldColors = {
  userHypothesis: "bg-purple-500/20 text-purple-300",
  results: "bg-blue-500/20 text-blue-300",
  customNotes: "bg-amber-500/20 text-amber-300",
  newInsights: "bg-pink-500/20 text-pink-300",
  decision: "bg-red-500/20 text-red-300",
};

export function InlineFieldEditor({
  open,
  onOpenChange,
  experiment,
  fieldName,
  onSave,
}: InlineFieldEditorProps) {
  const { toast } = useToast();
  const [fieldValue, setFieldValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (experiment && open) {
      // Always reset to the current database value when opening the editor
      const currentValue = experiment[fieldName] || "";
      console.log(`Loading ${fieldName} for experiment ${experiment.id}:`, currentValue);
      setFieldValue(currentValue);
    }
  }, [experiment, fieldName, open]);

  // Reset field value when modal closes
  useEffect(() => {
    if (!open) {
      setFieldValue("");
    }
  }, [open]);

  if (!experiment) return null;

  const masterData = experiment.masterData;
  const fieldLabel = fieldLabels[fieldName];
  const fieldColor = fieldColors[fieldName];

  const handleSave = async () => {
    // Validate Decision field
    if (fieldName === "decision" && (!fieldValue || fieldValue.trim() === "")) {
      toast({
        title: "Decision Required",
        description: "Please select a decision (Go, Start, Pivot, or Learn / Measure) before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(experiment.id, { [fieldName]: fieldValue });
      onOpenChange(false);
      toast({
        title: "Saved",
        description: `${fieldLabel} updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFieldValue(experiment[fieldName] || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl font-bold text-white">
                  {masterData?.name || "Experiment"}
                </DialogTitle>
                {masterData?.definition && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button 
                        className="text-gray-400 hover:text-purple-400 transition-colors"
                        data-testid="button-info-experiment"
                      >
                        <Info className="h-5 w-5" />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      className="w-80 bg-gray-900 border-purple-500/30 text-gray-200 p-4"
                      side="bottom"
                    >
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-purple-300">Experiment Definition</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {masterData.definition}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 border px-3 py-1">
                {masterData?.validationSphere || "Desirability"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Editable Field Section */}
          <div className="space-y-3">
            <div className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${fieldColor}`}>
              {fieldLabel}
            </div>
            
            {fieldName === "decision" ? (
              <Select value={fieldValue} onValueChange={setFieldValue}>
                <SelectTrigger 
                  className="w-full bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-800/70"
                  data-testid="select-decision"
                >
                  <SelectValue placeholder="Select decision..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="go" data-testid="option-go">Go</SelectItem>
                  <SelectItem value="start" data-testid="option-start">Start</SelectItem>
                  <SelectItem value="pivot" data-testid="option-pivot">Pivot</SelectItem>
                  <SelectItem value="learn" data-testid="option-learn">Learn / Measure</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/50">
                <Suspense fallback={
                  <div className="p-4 text-gray-400 text-sm">Loading editor...</div>
                }>
                  <RichTextEditor
                    key={`${experiment.id}-${fieldName}`}
                    content={fieldValue}
                    onChange={setFieldValue}
                    placeholder={`Enter your ${fieldLabel.toLowerCase()}...`}
                  />
                </Suspense>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="bg-slate-800/50 border-slate-700/50 text-white hover:bg-slate-800/70"
              disabled={isSaving}
              data-testid="button-cancel"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              disabled={isSaving}
              data-testid="button-save"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
