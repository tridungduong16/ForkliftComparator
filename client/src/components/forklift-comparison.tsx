import { useState } from "react";
import { Header } from "./header";
import { SearchFilters } from "./search-filters";
import { BrandGrid } from "./brand-grid";
import { ComparisonBar } from "./comparison-bar";
import { ComparisonModal } from "./comparison-modal";
import { StatsSection } from "./stats-section";
import { HelpMenu } from "./help-menu";
import { useQuery } from "@tanstack/react-query";
import type { ForkliftModel } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Fuel, Zap, ArrowRight } from "lucide-react";

export function ForkliftComparison() {
  const [selectedModels, setSelectedModels] = useState<ForkliftModel[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [capacityFilter, setCapacityFilter] = useState("All Capacities");
  const [powerTypeFilter, setPowerTypeFilter] = useState("All Types");

  const { data: models = [], isLoading } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: filteredModels = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models/filter", capacityFilter, powerTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (capacityFilter !== "All Capacities") {
        params.append("capacityRange", capacityFilter);
      }
      if (powerTypeFilter !== "All Types") {
        params.append("powerType", powerTypeFilter);
      }
      
      const response = await fetch(`/api/forklift-models/filter?${params}`);
      if (!response.ok) throw new Error("Failed to filter models");
      return response.json();
    },
    enabled: capacityFilter !== "All Capacities" || powerTypeFilter !== "All Types",
  });

  const { data: searchResults = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models/search", searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/forklift-models/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Failed to search models");
      return response.json();
    },
    enabled: searchQuery.length > 0,
  });

  const displayedModels = searchQuery.length > 0 
    ? searchResults 
    : (capacityFilter !== "All Capacities" || powerTypeFilter !== "All Types") 
      ? filteredModels 
      : models;

  const handleModelToggle = (model: ForkliftModel) => {
    setSelectedModels(prev => {
      const isSelected = prev.some(m => m.id === model.id);
      if (isSelected) {
        return prev.filter(m => m.id !== model.id);
      } else {
        if (prev.length >= 4) {
          alert("Maximum 4 models can be selected for comparison.");
          return prev;
        }
        return [...prev, model];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedModels([]);
  };

  const handleCompare = () => {
    if (selectedModels.length >= 2) {
      setIsComparisonModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-industrial-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-industrial-600">Loading forklift models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-50 text-industrial-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        <div className="mb-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    AI-Powered Intelligence Portal
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Advanced drag-and-drop comparison with AI insights and competitive analysis
                  </p>
                </div>
                <Link href="/advanced-comparison">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    Launch Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          capacityFilter={capacityFilter}
          setCapacityFilter={setCapacityFilter}
          powerTypeFilter={powerTypeFilter}
          setPowerTypeFilter={setPowerTypeFilter}
        />
        
        <BrandGrid 
          models={displayedModels}
          selectedModels={selectedModels}
          onModelToggle={handleModelToggle}
        />
        
        <StatsSection models={models} />
      </main>

      <ComparisonBar
        selectedModels={selectedModels}
        onClearSelection={handleClearSelection}
        onCompare={handleCompare}
        onRemoveModel={(model) => {
          setSelectedModels(prev => prev.filter(m => m.id !== model.id));
        }}
      />

      <ComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        selectedModels={selectedModels}
      />

      <HelpMenu />
    </div>
  );
}
