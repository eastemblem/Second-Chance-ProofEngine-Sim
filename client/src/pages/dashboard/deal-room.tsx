import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, Building2, Globe, DollarSign, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTokenAuth } from "@/hooks/use-token-auth";
import Navbar from "@/components/layout/navbar";
import { DashboardHeader } from "@/components/dashboard/core";
import { DealRoomIntro } from "@/components/dashboard/dealroom/DealRoomIntro";
import { DealRoomWalkthrough } from "@/components/dashboard/dealroom/DealRoomWalkthrough";
import Footer from "@/components/layout/footer";
import { Slider } from "@/components/ui/slider";

interface Investor {
  investorId: string;
  stageOfGrowth: string;
  sector: string;
  regionGeography: string;
  investmentTicket: number;
  investmentTicketDisplay: string;
  targetProofScore: number;
}

interface ValidationData {
  proofScore: number;
  proofTagsUnlocked: number;
  totalProofTags: number;
  filesUploaded: number;
  status: string;
  certificateUrl?: string;
  reportUrl?: string;
}

export default function DealRoomPage() {
  const { user: authUser, venture, isLoading: authLoading } = useTokenAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Transform authUser to include isAuthenticated flag
  const user = authUser ? {
    ...authUser,
    isAuthenticated: true,
    venture: venture ? { 
      ventureId: venture.ventureId, 
      name: venture.name 
    } : undefined
  } : null;
  
  // Walkthrough state
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    const completed = localStorage.getItem('deal_room_walkthrough_completed');
    return completed !== 'true';
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [minProofScore, setMinProofScore] = useState([70]);

  // Fetch validation data
  const { data: validationData, isLoading: validationLoading } = useQuery<ValidationData>({
    queryKey: ['/api/v1/dashboard/validation'],
    enabled: !!user,
  });

  // Fetch investors
  const { 
    data: investorsResponse, 
    isLoading: investorsLoading,
    isError: investorsError,
    error: investorsErrorObj
  } = useQuery<{ success: boolean; data: Investor[] }>({
    queryKey: ['/api/v1/deal-room'],
    enabled: !!user && !showWalkthrough,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 2,
  });

  const investors = investorsResponse?.data || [];

  // Extract unique filter options (filter out empty/null/undefined values)
  const sectors = useMemo(() => {
    if (!Array.isArray(investors) || investors.length === 0) return [];
    const unique = new Set(
      investors
        .map(inv => inv.sector)
        .filter(s => s && s.trim() !== '')
    );
    return Array.from(unique).sort();
  }, [investors]);

  const stages = useMemo(() => {
    if (!Array.isArray(investors) || investors.length === 0) return [];
    const unique = new Set(
      investors
        .map(inv => inv.stageOfGrowth)
        .filter(s => s && s.trim() !== '')
    );
    return Array.from(unique).sort();
  }, [investors]);

  const regions = useMemo(() => {
    if (!Array.isArray(investors) || investors.length === 0) return [];
    const unique = new Set(
      investors
        .map(inv => inv.regionGeography)
        .filter(r => r && r.trim() !== '')
    );
    return Array.from(unique).sort();
  }, [investors]);

  // Filter investors
  const filteredInvestors = useMemo(() => {
    if (!Array.isArray(investors) || investors.length === 0) return [];
    
    return investors.filter(investor => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const investorId = investor.investorId?.toLowerCase() || '';
        const sector = investor.sector?.toLowerCase() || '';
        const region = investor.regionGeography?.toLowerCase() || '';
        
        if (
          !investorId.includes(query) &&
          !sector.includes(query) &&
          !region.includes(query)
        ) {
          return false;
        }
      }

      // Sector filter
      if (selectedSector !== "all" && investor.sector !== selectedSector) {
        return false;
      }

      // Stage filter
      if (selectedStage !== "all" && investor.stageOfGrowth !== selectedStage) {
        return false;
      }

      // Region filter
      if (selectedRegion !== "all" && investor.regionGeography !== selectedRegion) {
        return false;
      }

      // ProofScore filter (show investors whose target is >= the minimum threshold)
      if (investor.targetProofScore < minProofScore[0]) {
        return false;
      }

      return true;
    });
  }, [investors, searchQuery, selectedSector, selectedStage, selectedRegion, minProofScore]);

  // Request introduction mutation
  const requestIntroductionMutation = useMutation({
    mutationFn: async ({ investorId, investorDetails }: { investorId: string; investorDetails: Investor }) => {
      const response = await fetch('/api/v1/deal-room/request-introduction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ investorId, investorDetails }),
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Introduction Requested",
        description: "Our team will review your request and reach out shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Unable to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWalkthroughComplete = () => {
    localStorage.setItem('deal_room_walkthrough_completed', 'true');
    setShowWalkthrough(false);
  };

  const handleRequestIntroduction = (investor: Investor) => {
    requestIntroductionMutation.mutate({
      investorId: investor.investorId,
      investorDetails: investor,
    });
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Show loading state
  if (authLoading || validationLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Show error if no user
  if (!user) {
    return null;
  }

  // Show walkthrough
  if (showWalkthrough) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar showSignOut />
        <DashboardHeader user={user} validationData={validationData || null} />
        <DealRoomWalkthrough onComplete={handleWalkthroughComplete} />
        <Footer />
      </div>
    );
  }

  // Show error state for investors API failure
  if (investorsError) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar showSignOut />
        <DashboardHeader user={user} validationData={validationData || null} />
        
        <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
          <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">Unable to Load Investors</h2>
                <p className="text-gray-400 max-w-md">
                  We're having trouble connecting to our investor database. Please try again in a moment.
                </p>
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/v1/deal-room'] })}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-retry-investors"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Footer />
      </div>
    );
  }

  // Get badge type based on target ProofScore
  const getBadgeInfo = (targetScore: number) => {
    if (targetScore >= 90) {
      return { label: "Elite", className: "bg-gradient-to-r from-yellow-500 to-orange-500" };
    } else if (targetScore >= 80) {
      return { label: "High Bar", className: "bg-gradient-to-r from-orange-500 to-red-500" };
    } else {
      return { label: "Selective", className: "bg-gradient-to-r from-purple-500 to-blue-500" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar showSignOut />
      <DashboardHeader user={user} validationData={validationData || null} />
      
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <DealRoomIntro />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6">
        
        {/* Filter Section */}
        <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800" data-testid="deal-room-filters-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Find Your Investment Match</h3>
            
            <p className="text-gray-400 text-sm mb-6">
              Filter investors by stage, sector, geography, and investment criteria
            </p>

            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by investor ID, sector, or region..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  data-testid="input-search-investors"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-sector">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-stage">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-region">
                    <SelectValue placeholder="All Regions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ProofScore Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400 flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-400" />
                    Min ProofScore Threshold:
                  </label>
                  <Badge variant="outline" className="bg-purple-600/20 border-purple-500 text-purple-300">
                    {minProofScore[0]}
                  </Badge>
                </div>
                <Slider
                  value={minProofScore}
                  onValueChange={setMinProofScore}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                  data-testid="slider-proofscore"
                />
              </div>

              {/* Results Count */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-gray-300">
                  <span className="font-semibold text-purple-400">{filteredInvestors.length}</span> investors found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investor Cards Grid */}
        {investorsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : filteredInvestors.length === 0 ? (
          <Card className="bg-gray-900/60 backdrop-blur-sm border-gray-800">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No investors match your criteria</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvestors.map((investor) => {
              const badgeInfo = getBadgeInfo(investor.targetProofScore);
              
              return (
                <Card 
                  key={investor.investorId} 
                  className="bg-gray-900/60 backdrop-blur-sm border-gray-800 hover:border-purple-500/50 transition-all"
                  data-testid={`investor-card-${investor.investorId}`}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header with Avatar and Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {investor.targetProofScore}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{investor.investorId}</h3>
                          <p className="text-xs text-gray-400">
                            {investor.stageOfGrowth && investor.stageOfGrowth.trim() !== '' ? investor.stageOfGrowth : 'All stages'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${badgeInfo.className} text-white border-0`}>
                        {badgeInfo.label}
                      </Badge>
                    </div>

                    {/* Investor Details */}
                    <div className="space-y-3">
                      {/* Sector */}
                      <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <Building2 className="h-3 w-3" />
                          Sector Focus
                        </div>
                        <p className="text-sm text-purple-300 font-medium">
                          {investor.sector && investor.sector.trim() !== '' ? investor.sector : 'Not specified'}
                        </p>
                      </div>

                      {/* Geography */}
                      <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/20">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <Globe className="h-3 w-3" />
                          Geography
                        </div>
                        <p className="text-sm text-green-300 font-medium">
                          {investor.regionGeography && investor.regionGeography.trim() !== '' ? investor.regionGeography : 'Not specified'}
                        </p>
                      </div>

                      {/* Ticket Size */}
                      <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-500/20">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <DollarSign className="h-3 w-3" />
                          Ticket Size
                        </div>
                        <p className="text-sm text-orange-300 font-medium">{investor.investmentTicketDisplay}</p>
                      </div>

                      {/* Target ProofScore */}
                      <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                          <Target className="h-3 w-3" />
                          Target ProofScore
                        </div>
                        <p className="text-sm text-purple-300 font-medium">
                          {investor.targetProofScore}+
                          <span className="text-xs text-gray-400 ml-2">
                            Ventures with this score or higher preferred
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Request Introduction Button */}
                    <Button
                      onClick={() => handleRequestIntroduction(investor)}
                      disabled={requestIntroductionMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      data-testid={`button-request-introduction-${investor.investorId}`}
                    >
                      {requestIntroductionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          Request Introduction
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
