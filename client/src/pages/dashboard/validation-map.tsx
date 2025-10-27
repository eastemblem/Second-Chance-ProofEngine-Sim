import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Loader2, Download, Trophy, Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useTokenAuth } from "@/hooks/use-token-auth";
import Navbar from "@/components/layout/navbar";
import { DashboardHeader } from "@/components/dashboard/core";
import { ValidationMapIntro } from "@/components/dashboard/validation/ValidationMapIntro";
import { ValidationMapWalkthrough } from "@/components/dashboard/validation/ValidationMapWalkthrough";
import { ExperimentEditModal } from "@/components/dashboard/validation/ExperimentEditModal";
import { AddExperimentModal } from "@/components/dashboard/validation/AddExperimentModal";
import { ColumnBadge } from "@/components/dashboard/validation/ColumnBadge";
import Footer from "@/components/layout/footer";
import type { CustomExperimentData } from "@/components/dashboard/validation/CustomExperimentModal";

// Lazy load heavy modal components for better performance
const ExperimentDetailsModal = lazy(() => 
  import("@/components/dashboard/validation/ExperimentDetailsModal").then(module => ({ default: module.ExperimentDetailsModal }))
);
const CustomExperimentModal = lazy(() => 
  import("@/components/dashboard/validation/CustomExperimentModal").then(module => ({ default: module.CustomExperimentModal }))
);

// Helper function to strip HTML tags and truncate text
const stripHtmlAndTruncate = (html: string | null, maxLines: number = 2): { text: string; isTruncated: boolean } => {
  if (!html) return { text: '', isTruncated: false };
  
  // Strip HTML tags
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || '';
  
  // Split into words and approximate lines
  const words = text.split(' ');
  const approxWordsPerLine = 12; // Approximate words per line
  const maxWords = maxLines * approxWordsPerLine;
  
  if (words.length <= maxWords) {
    return { text, isTruncated: false };
  }
  
  const truncatedText = words.slice(0, maxWords).join(' ');
  return { text: truncatedText, isTruncated: true };
};

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
  
  // Check localStorage for walkthrough completion
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    const completed = localStorage.getItem('validation_map_walkthrough_completed');
    return completed !== 'true';
  });
  
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

  // Details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<VentureExperiment | null>(null);

  // Add experiment modal state
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Custom experiment modal state
  const [customExperimentModalOpen, setCustomExperimentModalOpen] = useState(false);

  // Track which experiments are being completed (supports concurrent completions)
  const [completingExperimentIds, setCompletingExperimentIds] = useState<Set<string>>(new Set());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch validation data for header
  const { data: validationData } = useQuery<any>({
    queryKey: ['/api/v1/dashboard/validation'],
    enabled: !!venture,
  });

  // Fetch experiments
  const { data: experimentsData, isLoading } = useQuery({
    queryKey: ["/api/validation-map"],
    enabled: !!ventureId,
  });

  // Fetch all experiment masters
  const { data: mastersData } = useQuery({
    queryKey: ["/api/validation-map/masters"],
    enabled: !!ventureId,
  });

  const experiments = (experimentsData as any)?.data?.experiments || [];
  const proofScore = (experimentsData as any)?.data?.proofScore || 0;
  const prooftags = (experimentsData as any)?.data?.prooftags || [];
  const status = (experimentsData as any)?.data?.status || "Building Validation";

  const allMasters = (mastersData as any)?.data || [];
  const addedExperimentIds = new Set(experiments.map((exp: VentureExperiment) => exp.experimentId));
  const availableExperiments = allMasters.filter((master: any) => !addedExperimentIds.has(master.experimentId));

  // Get unique categories from experiments for the filter
  const uniqueCategories = Array.from(new Set(experiments.map((exp: VentureExperiment) => exp.masterData.validationSphere))).sort() as string[];

  // Filter experiments based on search, status, and category filters (memoized for performance)
  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp: VentureExperiment) => {
      // Status filter
      if (statusFilter === "active" && exp.status === "completed") return false;
      if (statusFilter === "completed" && exp.status !== "completed") return false;

      // Category filter
      if (categoryFilter !== "all" && exp.masterData.validationSphere !== categoryFilter) return false;

      // Search filter (using debounced query for performance)
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesName = exp.masterData.name.toLowerCase().includes(query);
        const matchesCategory = exp.masterData.validationSphere.toLowerCase().includes(query);
        const matchesDecision = exp.decision?.toLowerCase().includes(query);
        
        return matchesName || matchesCategory || matchesDecision;
      }

      return true;
    });
  }, [experiments, statusFilter, categoryFilter, debouncedSearchQuery]);

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
      setCompletingExperimentIds(prev => new Set(prev).add(id));
      const response = await apiRequest("POST", `/api/validation-map/${id}/complete`);
      return response.json();
    },
    onSuccess: (data: any, id: string) => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation-map"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/dashboard/validation"] });
      setCompletingExperimentIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
      
      toast({
        title: "Experiment completed!",
        description: data?.data?.proofTag 
          ? `🏆 ProofTag Unlocked: ${data.data.proofTag}` 
          : "Great work on completing this experiment!",
        duration: 5000,
      });
    },
    onError: (error: Error, id: string) => {
      setCompletingExperimentIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: "Failed to complete experiment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete experiment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/validation-map/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation-map"] });
      toast({
        title: "Experiment deleted",
        description: "The experiment has been removed from your validation map",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create experiment mutation
  const createMutation = useMutation({
    mutationFn: async (experimentId: string) => {
      const response = await apiRequest("POST", "/api/validation-map", { experimentId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/validation-map"] });
      setAddModalOpen(false);
      toast({
        title: "Experiment added",
        description: "The experiment has been added to your validation map",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add experiment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create custom experiment mutation
  const createCustomMutation = useMutation({
    mutationFn: async (experimentData: CustomExperimentData) => {
      const response = await apiRequest("POST", "/api/validation-map/custom", experimentData);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/validation-map"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/validation-map/masters"] });
      setCustomExperimentModalOpen(false);
      toast({
        title: "Custom experiment created",
        description: "Your custom experiment has been added to your validation map",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create custom experiment",
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

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleViewDetails = (exp: VentureExperiment) => {
    setSelectedExperiment(exp);
    setDetailsModalOpen(true);
  };

  const handleAddExperiment = (experimentId: string) => {
    createMutation.mutate(experimentId);
  };

  const handleCreateCustomExperiment = (experimentData: CustomExperimentData) => {
    createCustomMutation.mutate(experimentData);
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
    if (completedCount < 3) {
      toast({
        title: "Export unavailable",
        description: "Complete at least 3 experiments to export your validation map",
        variant: "destructive",
      });
      return;
    }

    if (filteredExperiments.length === 0) {
      toast({
        title: "No data to export",
        description: "No experiments match your current filters",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Experiment ID",
      "Experiment Name",
      "Category",
      "Decision",
      "Core Assumption",
      "Hypothesis",
      "Target Behaviour",
      "Target Metric",
      "Actual Results",
      "Why ?",
      "New Insights",
    ];

    const rows = filteredExperiments.map((exp: VentureExperiment) => [
      exp.experimentId,
      exp.masterData.name,
      exp.masterData.validationSphere,
      exp.decision || "",
      exp.masterData.hypothesisTested || "",
      exp.userHypothesis || "",
      exp.masterData.signalTracked || "",
      exp.masterData.targetMetric || "",
      exp.results || "",
      exp.customNotes || "",
      exp.newInsights || "",
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
    link.setAttribute("download", `Validation-Map-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported!",
      description: `Successfully exported ${filteredExperiments.length} experiments to CSV`,
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

  // Handle walkthrough completion
  const handleWalkthroughComplete = () => {
    localStorage.setItem('validation_map_walkthrough_completed', 'true');
    setShowWalkthrough(false);
  };

  // Show walkthrough until user completes or skips it
  if (showWalkthrough) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar showSignOut />
        <DashboardHeader user={user} validationData={validationData} />
        <ValidationMapWalkthrough 
          isLoading={isLoading} 
          onComplete={handleWalkthroughComplete}
        />
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
        {/* Experiments Table */}
        <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Your Experiments</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setAddModalOpen(true)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="button-add-experiment"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Experiment
                </Button>
                <Button 
                  onClick={handleExportCSV} 
                  variant="outline" 
                  className="bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={completedCount < 3}
                  data-testid="button-export-csv"
                  title={completedCount < 3 ? `Complete at least 3 experiments to export (${completedCount}/3)` : "Export your validation map to CSV"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by experiment name, category, or decision..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-purple-500"
                    data-testid="input-search-experiments"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      data-testid="button-clear-search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Dropdown */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger 
                    className="w-[200px] bg-gray-800/50 border-gray-700 text-gray-200"
                    data-testid="select-category-filter"
                  >
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all" className="text-gray-200 focus:bg-gray-800">
                      All Categories
                    </SelectItem>
                    {uniqueCategories.map((category: string) => (
                      <SelectItem 
                        key={category} 
                        value={category} 
                        className="text-gray-200 focus:bg-gray-800"
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter Dropdown */}
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "completed")}>
                  <SelectTrigger 
                    className="w-[180px] bg-gray-800/50 border-gray-700 text-gray-200"
                    data-testid="select-status-filter"
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all" className="text-gray-200 focus:bg-gray-800">
                      All
                    </SelectItem>
                    <SelectItem value="active" className="text-gray-200 focus:bg-gray-800">
                      Active
                    </SelectItem>
                    <SelectItem value="completed" className="text-gray-200 focus:bg-gray-800">
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row Count Display */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <p className="text-gray-400">
                    Showing <span className="text-white font-semibold">{filteredExperiments.length}</span> of{" "}
                    <span className="text-white font-semibold">{experiments.length}</span> experiments
                    {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
                      <span className="ml-2 text-purple-400">
                        (filtered)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full">
                    <Trophy className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-purple-400 font-semibold text-xs">
                      {prooftags.length} ProofTag{prooftags.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-300"
                    data-testid="button-clear-filters"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="sticky left-0 z-20 p-4 text-left font-semibold text-gray-300 text-sm min-w-[220px] bg-gray-900/95 backdrop-blur-sm">
                      <ColumnBadge variant="slate">Actions</ColumnBadge>
                    </th>
                    <th className="sticky left-[220px] z-20 p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px] bg-gray-900/95 backdrop-blur-sm">
                      <ColumnBadge variant="purple">Experiment</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm">
                      <ColumnBadge variant="fuchsia">Category</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[120px]">
                      <ColumnBadge variant="pink">Decision</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">
                      <ColumnBadge variant="violet">Core Assumption</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">
                      <ColumnBadge variant="magenta">Hypothesis</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[150px]">
                      <ColumnBadge variant="cyan">Target Behaviour</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[150px]">
                      <ColumnBadge variant="amber">Target Metric</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">
                      <ColumnBadge variant="indigo">Actual Results</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">
                      <ColumnBadge variant="teal">Why ?</ColumnBadge>
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-300 text-sm min-w-[200px]">
                      <ColumnBadge variant="rose">New Insights</ColumnBadge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExperiments.map((exp: VentureExperiment) => (
                    <tr
                      key={exp.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      data-testid={`row-experiment-${exp.id}`}
                    >
                      <td className="sticky left-0 z-10 p-4 bg-gray-900/95 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          {exp.status !== "completed" && (
                            <>
                              <Button
                                onClick={() => handleViewDetails(exp)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                data-testid={`button-edit-${exp.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedExperiment(exp);
                                  handleDelete(exp.id);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                data-testid={`button-delete-${exp.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleComplete(exp.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={completingExperimentIds.has(exp.id)}
                                data-testid={`button-complete-${exp.id}`}
                              >
                                {completingExperimentIds.has(exp.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Complete"
                                )}
                              </Button>
                            </>
                          )}
                          {exp.status === "completed" && (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-500" data-testid={`icon-completed-${exp.id}`} />
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Completed
                              </Badge>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="sticky left-[220px] z-10 p-4 bg-gray-900/95 backdrop-blur-sm">
                        <div>
                          <p 
                            className="font-medium text-blue-400 text-base cursor-pointer hover:text-blue-300 hover:underline transition-colors break-words" 
                            data-testid={`text-experiment-name-${exp.id}`}
                            onClick={() => handleViewDetails(exp)}
                          >
                            {exp.masterData.name}
                          </p>
                          {exp.masterData.proofTag && exp.status === "completed" && (
                            <div className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded mt-2">
                              <span className="text-gray-400">ProofTag:</span>
                              <span className="text-yellow-400 font-medium">{exp.masterData.proofTag}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline" 
                          className="border-cyan-500/50 text-cyan-400 bg-cyan-500/10"
                          data-testid={`badge-sphere-${exp.id}`}
                        >
                          {exp.masterData.validationSphere}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {exp.decision ? (
                          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50 capitalize">
                            {exp.decision}
                          </Badge>
                        ) : (
                          <Select
                            value={exp.decision || ""}
                            onValueChange={(value) => {
                              updateMutation.mutate({ 
                                id: exp.id, 
                                updates: { decision: value } 
                              });
                            }}
                            disabled={exp.status === "completed"}
                          >
                            <SelectTrigger 
                              className="w-full bg-gray-800/50 border-gray-700 text-gray-200 hover:border-purple-500/50"
                              data-testid={`select-decision-${exp.id}`}
                            >
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
                        )}
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300 break-words max-w-[200px]">{exp.masterData.hypothesisTested || "—"}</p>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => handleViewDetails(exp)}
                          className="cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors max-w-[200px]"
                          data-testid={`input-hypothesis-${exp.id}`}
                        >
                          {exp.userHypothesis ? (
                            (() => {
                              const { text, isTruncated } = stripHtmlAndTruncate(exp.userHypothesis, 2);
                              return (
                                <div>
                                  <p className="text-sm text-gray-200 line-clamp-2 break-words">{text}</p>
                                  {isTruncated && <span className="text-xs text-purple-400 mt-1 inline-block">Read more...</span>}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-gray-500 text-sm">Click to view...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300 break-words max-w-[150px]">{exp.masterData.signalTracked || "—"}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-gray-300 break-words max-w-[150px]">{exp.masterData.targetMetric || "—"}</p>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => handleViewDetails(exp)}
                          className="cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors max-w-[200px]"
                          data-testid={`input-results-${exp.id}`}
                        >
                          {exp.results ? (
                            (() => {
                              const { text, isTruncated } = stripHtmlAndTruncate(exp.results, 2);
                              return (
                                <div>
                                  <p className="text-sm text-gray-200 line-clamp-2 break-words">{text}</p>
                                  {isTruncated && <span className="text-xs text-purple-400 mt-1 inline-block">Read more...</span>}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-gray-500 text-sm">Click to view...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => handleViewDetails(exp)}
                          className="cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors max-w-[200px]"
                          data-testid={`input-why-${exp.id}`}
                        >
                          {exp.customNotes ? (
                            (() => {
                              const { text, isTruncated } = stripHtmlAndTruncate(exp.customNotes, 2);
                              return (
                                <div>
                                  <p className="text-sm text-gray-200 line-clamp-2 break-words">{text}</p>
                                  {isTruncated && <span className="text-xs text-purple-400 mt-1 inline-block">Read more...</span>}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-gray-500 text-sm">Click to view...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div
                          onClick={() => handleViewDetails(exp)}
                          className="cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors max-w-[200px]"
                          data-testid={`input-insights-${exp.id}`}
                        >
                          {exp.newInsights ? (
                            (() => {
                              const { text, isTruncated } = stripHtmlAndTruncate(exp.newInsights, 2);
                              return (
                                <div>
                                  <p className="text-sm text-gray-200 line-clamp-2 break-words">{text}</p>
                                  {isTruncated && <span className="text-xs text-purple-400 mt-1 inline-block">Read more...</span>}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-gray-500 text-sm">Click to view...</span>
                          )}
                        </div>
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

      {/* Details Modal (Lazy loaded for better performance) */}
      <Suspense fallback={null}>
        <ExperimentDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          experiment={selectedExperiment}
          onDelete={handleDelete}
          onSave={(id: string, updates: any) => {
            updateMutation.mutate({ id, updates });
          }}
        />
      </Suspense>

      {/* Add Experiment Modal */}
      <AddExperimentModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        availableExperiments={availableExperiments}
        onAdd={handleAddExperiment}
        isAdding={createMutation.isPending}
        onOpenCustomExperiment={() => setCustomExperimentModalOpen(true)}
      />

      {/* Custom Experiment Modal (Lazy loaded for better performance) */}
      <Suspense fallback={null}>
        <CustomExperimentModal
          open={customExperimentModalOpen}
          onOpenChange={(open: boolean) => {
            setCustomExperimentModalOpen(open);
          }}
          onSubmit={handleCreateCustomExperiment}
          isSubmitting={createCustomMutation.isPending}
        />
      </Suspense>

      <Footer />
    </div>
  );
}
