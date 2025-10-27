import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, X, Pencil, Save } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Lazy load RichTextEditor for better performance (only loaded when edit mode is activated)
const RichTextEditor = lazy(() => 
  import("./RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

interface ExperimentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment: any;
  onDelete: (id: string) => void;
  onSave: (id: string, updates: Record<string, any>) => void;
}

export function ExperimentDetailsModal({
  open,
  onOpenChange,
  experiment,
  onDelete,
  onSave,
}: ExperimentDetailsModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedValues, setEditedValues] = useState({
    decision: '',
    userHypothesis: '',
    results: '',
    customNotes: '',
    newInsights: '',
  });

  // Reset edit mode and values when modal opens/closes or experiment changes
  useEffect(() => {
    if (experiment) {
      setEditedValues({
        decision: experiment.decision || '',
        userHypothesis: experiment.userHypothesis || '',
        results: experiment.results || '',
        customNotes: experiment.customNotes || '',
        newInsights: experiment.newInsights || '',
      });
      setIsEditMode(false);
    }
  }, [experiment, open]);

  if (!experiment) return null;

  const masterData = experiment.masterData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleDelete = () => {
    onDelete(experiment.id);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave(experiment.id, editedValues);
    setIsEditMode(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setEditedValues({
      decision: experiment.decision || '',
      userHypothesis: experiment.userHypothesis || '',
      results: experiment.results || '',
      customNotes: experiment.customNotes || '',
      newInsights: experiment.newInsights || '',
    });
    setIsEditMode(false);
  };

  // Prevent modal close during edit mode or delete dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (isEditMode || deleteDialogOpen)) {
      return; // Don't close modal during edit or delete confirmation
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                {/* Experiment Title with Status Badge */}
                <div className="flex items-center gap-3 mb-3">
                  <DialogTitle className="text-2xl font-bold text-white">
                    {masterData?.name || "Experiment Details"}
                  </DialogTitle>
                  <Badge className={`${getStatusColor(experiment.status)} border px-3 py-1 capitalize`}>
                    {experiment.status.replace("_", " ")}
                  </Badge>
                </div>
                
                {/* Category Tag (below title) */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-400 text-sm">Category:</span>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-1">
                    {masterData?.validationSphere || "N/A"}
                  </Badge>
                </div>
                
                {/* Decision and ProofTag on new row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Decision */}
                  {experiment.decision && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Decision:</span>
                      <Badge className="bg-gray-700/50 text-gray-300 border-gray-600 px-3 py-1 capitalize">
                        {experiment.decision}
                      </Badge>
                    </div>
                  )}
                  
                  {/* ProofTag */}
                  {masterData?.proofTag && experiment.status === "completed" && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">ProofTag:</span>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 px-3 py-1">
                        {masterData.proofTag}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action buttons in header */}
              <div className="flex items-center gap-2">
                {!isEditMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                      onClick={() => setIsEditMode(true)}
                      disabled={experiment.status === "completed"}
                      data-testid="button-edit-experiment"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => setDeleteDialogOpen(true)}
                      data-testid="button-delete-experiment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <Separator className="bg-purple-500/30" />

          <div className="space-y-6 py-4">
            {/* Core Assumption (read-only) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white mb-3">
                Core Assumption
              </div>
              <p className="text-gray-200 bg-gradient-to-br from-violet-900/20 via-slate-800/50 to-purple-900/20 p-3 rounded-lg border border-purple-500/20">
                {masterData?.hypothesisTested || "No assumption defined"}
              </p>
            </div>

            {/* Decision (editable) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-pink-500 to-rose-600 text-white mb-3">
                Decision
              </div>
              {isEditMode ? (
                <Select
                  value={editedValues.decision || ""}
                  onValueChange={(value) => setEditedValues({ ...editedValues, decision: value })}
                >
                  <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-gray-200 hover:border-purple-500/50">
                    <SelectValue placeholder="Select decision..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="measure" className="text-gray-200 focus:bg-gray-800">
                      Measure
                    </SelectItem>
                    <SelectItem value="pivot" className="text-gray-200 focus:bg-gray-800">
                      Pivot
                    </SelectItem>
                    <SelectItem value="persevere" className="text-gray-200 focus:bg-gray-800">
                      Persevere
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-gradient-to-br from-pink-900/20 via-slate-800/50 to-rose-900/20 p-3 rounded-lg border border-purple-500/20">
                  {experiment.decision ? (
                    <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50 capitalize">
                      {experiment.decision}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">No decision set</span>
                  )}
                </div>
              )}
            </div>

            {/* Hypothesis (editable) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white mb-3">
                Hypothesis
              </div>
              {isEditMode ? (
                <Suspense fallback={<div className="text-gray-400 p-3">Loading editor...</div>}>
                  <RichTextEditor
                    content={editedValues.userHypothesis}
                    onChange={(html) => setEditedValues({ ...editedValues, userHypothesis: html })}
                    placeholder="Enter your hypothesis..."
                  />
                </Suspense>
              ) : (
                <div 
                  className="text-gray-200 bg-gradient-to-br from-purple-900/20 via-slate-800/50 to-pink-900/20 p-3 rounded-lg border border-purple-500/20 prose prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
                    prose-h2:text-xl prose-h3:text-lg
                    prose-p:my-2 prose-p:leading-relaxed
                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-1
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:italic
                    prose-a:text-purple-400 prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: experiment.userHypothesis || "Not defined" }}
                />
              )}
            </div>

            {/* Target Behaviour (read-only) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white mb-3">
                Target Behaviour
              </div>
              <p className="text-gray-200 bg-gradient-to-br from-cyan-900/20 via-slate-800/50 to-blue-900/20 p-3 rounded-lg border border-purple-500/20">
                {masterData?.targetBehaviour || "No target behaviour"}
              </p>
            </div>

            {/* Target Metric (read-only) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white mb-3">
                Target Metric
              </div>
              <p className="text-gray-200 bg-gradient-to-br from-amber-900/20 via-slate-800/50 to-orange-900/20 p-3 rounded-lg border border-purple-500/20">
                {masterData?.targetMetric || "No metric defined"}
              </p>
            </div>

            {/* Actual Results (editable) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white mb-3">
                Actual Results
              </div>
              {isEditMode ? (
                <Suspense fallback={<div className="text-gray-400 p-3">Loading editor...</div>}>
                  <RichTextEditor
                    content={editedValues.results}
                    onChange={(html) => setEditedValues({ ...editedValues, results: html })}
                    placeholder="Enter your results..."
                  />
                </Suspense>
              ) : (
                <div 
                  className="text-gray-200 bg-gradient-to-br from-indigo-900/20 via-slate-800/50 to-purple-900/20 p-3 rounded-lg border border-purple-500/20 prose prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
                    prose-h2:text-xl prose-h3:text-lg
                    prose-p:my-2 prose-p:leading-relaxed
                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-1
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:italic
                    prose-a:text-purple-400 prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: experiment.results || "No results yet" }}
                />
              )}
            </div>

            {/* Why? (editable) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-teal-500 to-cyan-600 text-white mb-3">
                Why?
              </div>
              {isEditMode ? (
                <Suspense fallback={<div className="text-gray-400 p-3">Loading editor...</div>}>
                  <RichTextEditor
                    content={editedValues.customNotes}
                    onChange={(html) => setEditedValues({ ...editedValues, customNotes: html })}
                    placeholder="Explain why..."
                  />
                </Suspense>
              ) : (
                <div 
                  className="text-gray-200 bg-gradient-to-br from-teal-900/20 via-slate-800/50 to-cyan-900/20 p-3 rounded-lg border border-purple-500/20 prose prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
                    prose-h2:text-xl prose-h3:text-lg
                    prose-p:my-2 prose-p:leading-relaxed
                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-1
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:italic
                    prose-a:text-purple-400 prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: experiment.customNotes || "No notes" }}
                />
              )}
            </div>

            {/* New Insights (editable) */}
            <div>
              <div className="inline-block px-4 py-1.5 rounded-md font-medium text-sm bg-gradient-to-r from-rose-500 to-pink-600 text-white mb-3">
                New Insights
              </div>
              {isEditMode ? (
                <Suspense fallback={<div className="text-gray-400 p-3">Loading editor...</div>}>
                  <RichTextEditor
                    content={editedValues.newInsights}
                    onChange={(html) => setEditedValues({ ...editedValues, newInsights: html })}
                    placeholder="Add new insights..."
                  />
                </Suspense>
              ) : (
                <div 
                  className="text-gray-200 bg-gradient-to-br from-rose-900/20 via-slate-800/50 to-pink-900/20 p-3 rounded-lg border border-purple-500/20 prose prose-invert max-w-none
                    prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
                    prose-h2:text-xl prose-h3:text-lg
                    prose-p:my-2 prose-p:leading-relaxed
                    prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
                    prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
                    prose-li:my-1
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:italic
                    prose-a:text-purple-400 prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: experiment.newInsights || "No insights captured" }}
                />
              )}
            </div>
          </div>

          {/* Footer buttons in edit mode */}
          {isEditMode && (
            <>
              <Separator className="bg-purple-500/30 mt-6" />
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel-edit-footer"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  data-testid="button-save-experiment-footer"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Experiment?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete "{masterData?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
