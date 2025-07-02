import { Button } from "@/components/ui/button";
import { X, Diff } from "lucide-react";
import type { ForkliftModel } from "@shared/schema";

interface ComparisonBarProps {
  selectedModels: ForkliftModel[];
  onClearSelection: () => void;
  onCompare: () => void;
  onRemoveModel: (model: ForkliftModel) => void;
}

export function ComparisonBar({ selectedModels, onClearSelection, onCompare, onRemoveModel }: ComparisonBarProps) {
  if (selectedModels.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-industrial-200 shadow-lg z-40 transform transition-transform duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-industrial-700">Selected for Comparison:</span>
            <div className="flex space-x-2 flex-wrap">
              {selectedModels.map((model) => (
                <span
                  key={model.id}
                  className="bg-primary/10 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  <span className="font-medium">{model.brand}</span>
                  <span className="mx-1">•</span>
                  <span>{model.model}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-auto p-0 text-primary-600 hover:text-primary-800"
                    onClick={() => onRemoveModel(model)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={onClearSelection}
              className="text-industrial-600 hover:text-industrial-800"
            >
              Clear All
            </Button>
            <Button
              onClick={onCompare}
              disabled={selectedModels.length < 2}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Diff className="w-4 h-4 mr-1" />
              Diff Models
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
