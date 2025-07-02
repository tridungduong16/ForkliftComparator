import { useState } from "react";
import { Header } from "@/components/header";
import { BrandGrid } from "@/components/brand-grid";
import { ComparisonBar } from "@/components/comparison-bar";
import { ComparisonModal } from "@/components/comparison-modal";
import { StatsSection } from "@/components/stats-section";
import { useQuery } from "@tanstack/react-query";
import type { ForkliftModel } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Zap } from "lucide-react";

export default function DieselComparison() {
  const [selectedModels, setSelectedModels] = useState<ForkliftModel[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const { data: allModels = [], isLoading } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  // Filter for Diesel models only
  const dieselModels = allModels.filter(model => 
    model.powerType.toLowerCase().includes('diesel')
  );

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
          <p className="mt-4 text-industrial-600">Loading diesel forklift models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-50 text-industrial-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Models
            </Button>
          </Link>
          
          <Card className="bg-white rounded-xl shadow-sm border border-industrial-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-industrial-900">Diesel Forklift Comparison</h1>
              </div>
              <p className="text-industrial-600 mb-4">
                Compare diesel powered forklifts in the 2-3.5 tonne range. 
                Diesel forklifts offer superior torque, fuel efficiency, and are ideal for heavy-duty outdoor applications.
              </p>
              <div className="flex space-x-4">
                <Link href="/lpg">
                  <Button variant="outline">
                    View LPG Models
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <BrandGrid 
          models={dieselModels}
          selectedModels={selectedModels}
          onModelToggle={handleModelToggle}
        />
        
        <StatsSection models={dieselModels} />
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
    </div>
  );
}