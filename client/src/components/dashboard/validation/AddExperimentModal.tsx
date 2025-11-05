import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface ExperimentMaster {
  experimentId: string;
  name: string;
  validationSphere: string;
  category: string;
  hypothesisTested: string;
  definition?: string;
  proofTag: string | null;
}

interface AddExperimentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableExperiments: ExperimentMaster[];
  onAdd: (experimentId: string) => void;
  isAdding: boolean;
  onOpenCustomExperiment?: () => void;
}

export function AddExperimentModal({
  open,
  onOpenChange,
  availableExperiments,
  onAdd,
  isAdding,
  onOpenCustomExperiment,
}: AddExperimentModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExperiments = availableExperiments.filter((exp) =>
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.validationSphere.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSphereColor = (sphere: string) => {
    switch (sphere.toLowerCase()) {
      case "desirability":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "viability":
        return "bg-green-500/20 text-green-300 border-green-500/40";
      case "feasibility":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "scaling":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/40";
    }
  };

  const handleAdd = (experimentId: string) => {
    onAdd(experimentId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Add Experiment
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Choose from the master list of validation experiments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search experiments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              data-testid="input-search-experiments"
            />
          </div>

          {/* Experiments List */}
          <ScrollArea className="h-[400px] rounded-md border border-slate-700/50 bg-slate-900/50 p-4">
            <div className="space-y-3">
              {filteredExperiments.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  No experiments found
                </p>
              ) : (
                filteredExperiments.map((exp) => (
                  <div
                    key={exp.experimentId}
                    className="flex items-start gap-4 p-4 rounded-lg border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                    data-testid={`experiment-item-${exp.experimentId}`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <h4 className="font-semibold text-white text-base">
                            {exp.name}
                          </h4>
                          {exp.definition && (
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <button 
                                  className="text-gray-400 hover:text-purple-400 transition-colors"
                                  data-testid={`button-info-${exp.experimentId}`}
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                className="w-80 bg-gray-900 border-purple-500/30 text-gray-200 p-4"
                                side="top"
                              >
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-purple-300">Experiment Definition</h4>
                                  <p className="text-sm text-gray-300 leading-relaxed">
                                    {exp.definition}
                                  </p>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAdd(exp.experimentId)}
                          disabled={isAdding}
                          className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                          data-testid={`button-add-${exp.experimentId}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={`${getSphereColor(exp.validationSphere)} border`}>
                          {exp.validationSphere}
                        </Badge>
                        {exp.category && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {exp.category}
                          </Badge>
                        )}
                        {exp.proofTag && (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/50">
                            🏆 {exp.proofTag}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-300 line-clamp-2">
                        {exp.hypothesisTested}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              {filteredExperiments.length} experiment{filteredExperiments.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="default"
            onClick={() => {
              onOpenChange(false);
              onOpenCustomExperiment?.();
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            data-testid="button-custom-experiment"
          >
            <Plus className="h-4 w-4 mr-2" />
            Custom Experiment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
