import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, X, Pencil } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ExperimentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment: any;
  onDelete: (id: string) => void;
}

export function ExperimentDetailsModal({
  open,
  onOpenChange,
  experiment,
  onDelete,
}: ExperimentDetailsModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-white mb-3">
                  {masterData?.name || "Experiment Details"}
                </DialogTitle>
                <DialogDescription className="text-gray-300 mb-3">
                  {masterData?.validationSphere || "N/A"}
                </DialogDescription>
                
                {/* Tags in header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${getStatusColor(experiment.status)} border`}>
                    {experiment.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  
                  {experiment.decision && (
                    <Badge className="bg-gray-700/50 text-gray-300 border-gray-600 capitalize">
                      Decision: {experiment.decision}
                    </Badge>
                  )}
                  
                  {masterData?.proofTag && (
                    <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/50">
                      {masterData.proofTag}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action buttons in header */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => setDeleteDialogOpen(true)}
                  data-testid="button-delete-experiment"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-close-details"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Separator className="bg-purple-500/30" />

          <div className="space-y-6 py-4">

            {/* Core Assumption */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Core Assumption</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {masterData?.hypothesisTested || "No assumption defined"}
              </p>
            </div>

            {/* Hypothesis */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Hypothesis</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {experiment.userHypothesis || "Not defined"}
              </p>
            </div>

            {/* Target Behaviour */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Target Behaviour</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {masterData?.signalTracked || "No target behaviour"}
              </p>
            </div>

            {/* Target Metric */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Target Metric</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {masterData?.targetMetric || "No metric defined"}
              </p>
            </div>

            {/* Actual Results */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Actual Results</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {experiment.results || "No results yet"}
              </p>
            </div>

            {/* Why? */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Why?</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {experiment.customNotes || "No notes"}
              </p>
            </div>

            {/* New Insights */}
            <div>
              <h4 className="text-sm font-semibold text-purple-300 mb-2">New Insights</h4>
              <p className="text-gray-200 bg-slate-800/50 p-3 rounded-lg border border-purple-500/20">
                {experiment.newInsights || "No insights captured"}
              </p>
            </div>
          </div>
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
