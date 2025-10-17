import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Loader2, Download, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useTokenAuth } from "@/hooks/use-token-auth";
import Navbar from "@/components/layout/navbar";
import { DashboardHeader } from "@/components/dashboard/core";
import { ValidationMapIntro } from "@/components/dashboard/validation/ValidationMapIntro";
import { ValidationMapLoadingScreen } from "@/components/dashboard/validation/ValidationMapLoadingScreen";
import { ExperimentEditModal } from "@/components/dashboard/validation/ExperimentEditModal";
import Footer from "@/components/layout/footer";

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
  newInsights: string | null;
  completedAt: Date | null;
  masterData: ExperimentMaster;
}

export default function ValidationMap() {
  const { toast } = useToast();
  const { user: authUser, venture, isAuthenticated } = useTokenAuth();
  const [, setLocation] = useLocation();
  const ventureId = venture?.ventureId || null;
  const [debouncedValues, setDebouncedValues] = useState<Record<string, any>>({});
  
  // Create user object with isAuthenticated for DashboardHeader
  const user = authUser ? { ...authUser, isAuthenticated } : null;
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    experimentId: string;
    experimentName: string;
    experimentIdLabel: string;
    isCompleted: boolean;
    fieldName: string;
    fieldLabel: string;
    fieldValue: string;
    fieldType: "text" | "select";
    selectOptions?: { value: string; label: string }[];
  } | null>(null);

  // Fetch validation data for header
  const { data: validationData } = useQuery<any>({
    queryKey: ['/api/pitch/validation-status'],
    enabled: !!venture,
  });

  // Fetch experiments
  const { data: experimentsData, isLoading } = useQuery({
    queryKey: ["/api/validation-map"],
    enabled: !!ventureId,
  });

  const experiments = (experimentsData as any)?.data?.experiments || [];
  const proofScore = (experimentsData as any)?.data?.proofScore || 0;
  const status = (experimentsData as any)?.data?.status || "Building Validation";

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
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
      
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

  const handleUploadFiles = () => {
    setLocation("/dashboard#proof-vault");
  };

  // Open modal for editing a field
  const openEditModal = (
    exp: VentureExperiment,
    fieldName: string,
    fieldLabel: string,
    fieldType: "text" | "select" = "text",
    selectOptions?: { value: string; label: string }[]
  ) => {
    if (exp.status === "completed") return; // Don't open modal for completed experiments
    
    setModalConfig({
      experimentId: exp.id,
      experimentName: exp.masterData.name,
      experimentIdLabel: exp.masterData.experimentId,
      isCompleted: exp.status === "completed",
      fieldName,
      fieldLabel,
      fieldValue: (exp as any)[fieldName] || "",
      fieldType,
      selectOptions,
    });
    setIsModalOpen(true);
  };

  // Handle modal save
  const handleModalSave = (value: string) => {
    if (!modalConfig) return;
    
    updateMutation.mutate({
      id: modalConfig.experimentId,
      updates: { [modalConfig.fieldName]: value },
    });
    
    setIsModalOpen(false);
    setModalConfig(null);
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

    const headers = [
      "Experiment ID",
      "Experiment Name",
      "Validation Sphere",
      "Leap of Faith Assumption",
      "Hypothesis",
      "Behaviour",
      "Target Metric",
      "Actual Results",
      "Why",
      "New Insights",
      "Decision",
      "Status",
      "ProofTag",
      "Completed At",
    ];

    const rows = experiments.map((exp: VentureExperiment) => [
      exp.experimentId,
      exp.masterData.name,
      exp.masterData.validationSphere,
      exp.masterData.hypothesisTested || "",
      exp.userHypothesis || "",
      exp.masterData.signalTracked || "",
      exp.masterData.targetMetric || "",
      exp.results || "",
      exp.customNotes || "",
      exp.newInsights || "",
      exp.decision || "",
      exp.status,
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

  if (!user || !ventureId) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar showSignOut />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-6">
              <p className="text-gray-300">
                {!user ? "Loading user data..." : "No venture found. Please complete onboarding first."}
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar showSignOut />
        <DashboardHeader user={user} validationData={validationData} />
        <ValidationMapLoadingScreen />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar showSignOut />
      <DashboardHeader user={user} validationData={validationData} />
      
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <ValidationMapIntro />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleExportCSV} 
            variant="outline" 
            className="bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800"
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Experiments Table */}
        <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Your Experiments</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">Status</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">Experiment</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">Sphere</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">Leap of Faith Assumption</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">Hypothesis</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[150px]">Behaviour</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[150px]">Target Metric</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">Actual Results</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">Why</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">New Insights</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">Decision</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">ProofTag</th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((exp: VentureExperiment) => (
                    <tr
                      key={exp.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      data-testid={`row-experiment-${exp.id}`}
                    >
                      <td className="p-4">
                        {exp.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" data-testid={`icon-completed-${exp.id}`} />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-600" data-testid={`icon-not-completed-${exp.id}`} />
                        )}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white text-base" data-testid={`text-experiment-name-${exp.id}`}>
                            {exp.masterData.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            {exp.masterData.experimentId}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline" 
                          className="border-purple-500/50 text-purple-400 bg-purple-500/10"
                          data-testid={`badge-sphere-${exp.id}`}
                        >
                          {exp.masterData.validationSphere}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300">{exp.masterData.hypothesisTested || "—"}</p>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => openEditModal(exp, "userHypothesis", "Hypothesis")}
                          className={`min-h-[60px] p-3 rounded border ${
                            exp.status === "completed"
                              ? "bg-gray-800/30 border-gray-700/50 cursor-not-allowed"
                              : "bg-gray-800/50 border-gray-700 cursor-pointer hover:border-purple-500/50 hover:bg-gray-800/70"
                          } text-gray-200 text-sm transition-colors`}
                          data-testid={`input-hypothesis-${exp.id}`}
                        >
                          {exp.userHypothesis || (
                            <span className="text-gray-500">Click to enter hypothesis...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300">{exp.masterData.signalTracked || "—"}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300">{exp.masterData.targetMetric || "—"}</p>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => openEditModal(exp, "results", "Actual Results")}
                          className={`min-h-[60px] p-3 rounded border ${
                            exp.status === "completed"
                              ? "bg-gray-800/30 border-gray-700/50 cursor-not-allowed"
                              : "bg-gray-800/50 border-gray-700 cursor-pointer hover:border-purple-500/50 hover:bg-gray-800/70"
                          } text-gray-200 text-sm transition-colors`}
                          data-testid={`input-results-${exp.id}`}
                        >
                          {exp.results || (
                            <span className="text-gray-500">Click to enter results...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => openEditModal(exp, "customNotes", "Why")}
                          className={`min-h-[60px] p-3 rounded border ${
                            exp.status === "completed"
                              ? "bg-gray-800/30 border-gray-700/50 cursor-not-allowed"
                              : "bg-gray-800/50 border-gray-700 cursor-pointer hover:border-purple-500/50 hover:bg-gray-800/70"
                          } text-gray-200 text-sm transition-colors`}
                          data-testid={`input-why-${exp.id}`}
                        >
                          {exp.customNotes || (
                            <span className="text-gray-500">Click to explain why...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => openEditModal(exp, "newInsights", "New Insights")}
                          className={`min-h-[60px] p-3 rounded border ${
                            exp.status === "completed"
                              ? "bg-gray-800/30 border-gray-700/50 cursor-not-allowed"
                              : "bg-gray-800/50 border-gray-700 cursor-pointer hover:border-purple-500/50 hover:bg-gray-800/70"
                          } text-gray-200 text-sm transition-colors`}
                          data-testid={`input-insights-${exp.id}`}
                        >
                          {exp.newInsights || (
                            <span className="text-gray-500">Click to add insights...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => openEditModal(
                            exp,
                            "decision",
                            "Decision",
                            "select",
                            [
                              { value: "measure", label: "Measure" },
                              { value: "build", label: "Build" },
                              { value: "pivot", label: "Pivot" },
                              { value: "stop", label: "Stop" },
                            ]
                          )}
                          className={`min-h-[40px] p-3 rounded border ${
                            exp.status === "completed"
                              ? "bg-gray-800/30 border-gray-700/50 cursor-not-allowed"
                              : "bg-gray-800/50 border-gray-700 cursor-pointer hover:border-purple-500/50 hover:bg-gray-800/70"
                          } text-gray-200 text-sm transition-colors flex items-center`}
                          data-testid={`select-decision-${exp.id}`}
                        >
                          {exp.decision ? (
                            <span className="capitalize">{exp.decision}</span>
                          ) : (
                            <span className="text-gray-500">Click to select...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {exp.masterData.proofTag && exp.status === "completed" ? (
                          <Badge 
                            variant="secondary" 
                            className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                            data-testid={`badge-prooftag-${exp.id}`}
                          >
                            <Trophy className="mr-1 h-3 w-3" />
                            {exp.masterData.proofTag}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {exp.status !== "completed" && (
                          <Button
                            onClick={() => handleComplete(exp.id)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
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
                <p className="text-gray-400">
                  No experiments assigned yet. Complete your pitch scoring first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {modalConfig && (
        <ExperimentEditModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalConfig(null);
          }}
          experimentName={modalConfig.experimentName}
          experimentId={modalConfig.experimentIdLabel}
          isCompleted={modalConfig.isCompleted}
          fieldName={modalConfig.fieldName}
          fieldLabel={modalConfig.fieldLabel}
          fieldValue={modalConfig.fieldValue}
          fieldType={modalConfig.fieldType}
          selectOptions={modalConfig.selectOptions}
          onSave={handleModalSave}
        />
      )}

      <Footer />
    </div>
  );
}
