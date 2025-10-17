import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Loader2, Download, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useTokenAuth } from "@/hooks/use-token-auth";

interface ExperimentMaster {
  experimentId: string;
  validationSphere: string;
  name: string;
  definition: string;
  hypothesisTested: string;
  experimentFormat: string;
  signalTracked: string;
  targetMetric: string;
  toolsPlatforms: string | null;
  typicalDuration: string | null;
  notes: string | null;
  proofTag: string | null;
}

interface VentureExperiment {
  id: string;
  ventureId: string;
  experimentId: string;
  slotNumber: number | null;
  assignedFrom: string | null;
  userHypothesis: string | null;
  results: string | null;
  decision: string | null;
  status: string;
  customNotes: string | null;
  completedAt: Date | null;
  masterData: ExperimentMaster;
}

export default function ValidationMap() {
  const { toast } = useToast();
  const { venture } = useTokenAuth();
  const ventureId = venture?.ventureId || null;
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [debouncedValues, setDebouncedValues] = useState<Record<string, any>>({});

  // Fetch experiments
  const { data: experimentsData, isLoading } = useQuery({
    queryKey: ["/api/validation-map"],
    enabled: !!ventureId,
  });

  const experiments = experimentsData?.data?.experiments || [];

  // Update experiment mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Record<string, any>;
    }) => {
      const response = await apiRequest("PATCH", `/api/validation-map/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation-map"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete experiment mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/validation-map/${id}/complete`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation-map"] });
      
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
      
      // Show ProofTag celebration if unlocked
      if (data?.data?.proofTag) {
        toast({
          title: "🏆 ProofTag Unlocked!",
          description: `You earned: ${data.data.proofTag}`,
          duration: 5000,
        });
      }
      
      toast({
        title: "Experiment completed!",
        description: `+${data?.data?.proofScoreIncrease || 5} ProofScore`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete experiment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-save with debounce
  useEffect(() => {
    const timers: Record<string, NodeJS.Timeout> = {};

    Object.entries(debouncedValues).forEach(([key, value]) => {
      const [id, field] = key.split(":");

      timers[key] = setTimeout(() => {
        updateMutation.mutate({
          id,
          updates: { [field]: value },
        });
        
        // Clear the debounced value after saving
        setDebouncedValues((prev) => {
          const { [key]: _, ...rest } = prev;
          return rest;
        });
      }, 500);
    });

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, [debouncedValues]);

  const handleCellChange = useCallback((id: string, field: string, value: any) => {
    const key = `${id}:${field}`;
    setDebouncedValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
  };

  const handleExportCSV = () => {
    if (experiments.length === 0) {
      toast({
        title: "No data to export",
        description: "Complete some experiments first",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Experiment ID",
      "Name",
      "Validation Sphere",
      "Status",
      "Your Hypothesis",
      "Results",
      "Decision",
      "ProofTag",
      "Completed At",
    ];

    const rows = experiments.map((exp: VentureExperiment) => [
      exp.experimentId,
      exp.masterData.name,
      exp.masterData.validationSphere,
      exp.status,
      exp.userHypothesis || "",
      exp.results || "",
      exp.decision || "",
      exp.status === "completed" ? exp.masterData.proofTag || "" : "",
      exp.completedAt ? new Date(exp.completedAt).toLocaleDateString() : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => 
        row.map((cell: string) => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `validation-map-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported!",
      description: "Your validation map has been exported successfully",
    });
  };

  const completedCount = experiments.filter((e: VentureExperiment) => e.status === "completed").length;
  const totalCount = experiments.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!ventureId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>No venture found. Please complete onboarding first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-validation-map" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-validation-map-title">Validation Map</h1>
          <p className="text-muted-foreground">
            Systematically validate your business through structured experiments
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" data-testid="button-export-csv">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>
            {completedCount} of {totalCount} experiments completed ({completionPercentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
              data-testid="progress-bar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Experiments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Experiments</CardTitle>
          <CardDescription>
            Click to edit hypothesis, results, and decision inline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Experiment</th>
                  <th className="p-3 text-left font-medium">Sphere</th>
                  <th className="p-3 text-left font-medium">Your Hypothesis</th>
                  <th className="p-3 text-left font-medium">Results</th>
                  <th className="p-3 text-left font-medium">Decision</th>
                  <th className="p-3 text-left font-medium">ProofTag</th>
                  <th className="p-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp: VentureExperiment) => (
                  <tr
                    key={exp.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                    data-testid={`row-experiment-${exp.id}`}
                  >
                    <td className="p-3">
                      {exp.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" data-testid={`icon-completed-${exp.id}`} />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" data-testid={`icon-not-completed-${exp.id}`} />
                      )}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium" data-testid={`text-experiment-name-${exp.id}`}>
                          {exp.masterData.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {exp.masterData.experimentId}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" data-testid={`badge-sphere-${exp.id}`}>
                        {exp.masterData.validationSphere}
                      </Badge>
                    </td>
                    <td className="p-3 min-w-[200px]">
                      <Textarea
                        value={exp.userHypothesis || ""}
                        onChange={(e) =>
                          handleCellChange(exp.id, "userHypothesis", e.target.value)
                        }
                        placeholder="Your hypothesis..."
                        className="min-h-[60px] resize-none"
                        disabled={exp.status === "completed"}
                        data-testid={`input-hypothesis-${exp.id}`}
                      />
                    </td>
                    <td className="p-3 min-w-[200px]">
                      <Textarea
                        value={exp.results || ""}
                        onChange={(e) =>
                          handleCellChange(exp.id, "results", e.target.value)
                        }
                        placeholder="Results..."
                        className="min-h-[60px] resize-none"
                        disabled={exp.status === "completed"}
                        data-testid={`input-results-${exp.id}`}
                      />
                    </td>
                    <td className="p-3">
                      <Select
                        value={exp.decision || ""}
                        onValueChange={(value) =>
                          handleCellChange(exp.id, "decision", value)
                        }
                        disabled={exp.status === "completed"}
                      >
                        <SelectTrigger className="w-[140px]" data-testid={`select-decision-${exp.id}`}>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="measure">Measure</SelectItem>
                          <SelectItem value="build">Build</SelectItem>
                          <SelectItem value="pivot">Pivot</SelectItem>
                          <SelectItem value="stop">Stop</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      {exp.masterData.proofTag && exp.status === "completed" ? (
                        <Badge variant="secondary" data-testid={`badge-prooftag-${exp.id}`}>
                          <Trophy className="mr-1 h-3 w-3" />
                          {exp.masterData.proofTag}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {exp.status !== "completed" && (
                        <Button
                          onClick={() => handleComplete(exp.id)}
                          size="sm"
                          disabled={completeMutation.isPending}
                          data-testid={`button-complete-${exp.id}`}
                        >
                          {completeMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Complete"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {experiments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No experiments assigned yet. Complete your pitch scoring first.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
