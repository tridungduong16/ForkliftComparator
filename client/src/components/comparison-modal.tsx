import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, PrinterCheck, Share, FileText, Download } from "lucide-react";
import type { ForkliftModel } from "@shared/schema";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModels: ForkliftModel[];
}

export function ComparisonModal({ isOpen, onClose, selectedModels }: ComparisonModalProps) {
  if (selectedModels.length < 2) return null;

  const formatPrice = (min: number, max: number) => {
    return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
  };

  const getAvailabilityBadge = (availability: string) => {
    let variant: "default" | "secondary" | "destructive" = "default";
    if (availability === "In Stock") variant = "default";
    else if (availability.includes("weeks")) variant = "secondary";
    else variant = "destructive";

    return (
      <Badge variant={variant} className="text-xs">
        {availability}
      </Badge>
    );
  };

  const getBestValue = (values: number[], isHigherBetter = true) => {
    if (isHigherBetter) {
      return Math.max(...values);
    }
    return Math.min(...values);
  };

  const specifications = [
    {
      label: "Load Capacity",
      key: "loadCapacity" as keyof ForkliftModel,
      format: (value: number) => `${value.toLocaleString()} kg`,
      higherBetter: true,
    },
    {
      label: "Lift Height",
      key: "liftHeight" as keyof ForkliftModel,
      format: (value: number) => `${value} cm`,
      higherBetter: true,
    },
    {
      label: "Power Type",
      key: "powerType" as keyof ForkliftModel,
      format: (value: string) => value,
    },
    {
      label: "Operating Weight",
      key: "operatingWeight" as keyof ForkliftModel,
      format: (value: number) => `${value.toLocaleString()} kg`,
      higherBetter: false,
    },
    {
      label: "Turn Radius",
      key: "turnRadius" as keyof ForkliftModel,
      format: (value: number) => `${value} cm`,
      higherBetter: false,
    },
    {
      label: "Travel Speed",
      key: "travelSpeed" as keyof ForkliftModel,
      format: (value: string) => `${value} km/h`,
      higherBetter: true,
    },
    {
      label: "Warranty",
      key: "warranty" as keyof ForkliftModel,
      format: (value: number) => `${value} months`,
      higherBetter: true,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b border-industrial-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-industrial-900">
              Equipment Comparison
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-industrial-200">
                    <th className="text-left py-3 px-4 font-semibold text-industrial-900 bg-industrial-50">
                      Specification
                    </th>
                    {selectedModels.map((model) => (
                      <th
                        key={model.id}
                        className="text-center py-3 px-4 font-semibold text-industrial-900 bg-primary/5"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm text-primary-600 uppercase">
                            {model.brand}
                          </span>
                          <span className="font-bold">{model.model}</span>
                          <span className="text-xs text-industrial-500">
                            {model.tier === "ENTRY" ? "Entry Level" : 
                             model.tier === "MID" ? "Mid Range" : "Premium"}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-100">
                  {specifications.map((spec) => {
                    const values = selectedModels.map(model => {
                      const value = model[spec.key];
                      return typeof value === 'string' ? parseFloat(value) || 0 : Number(value);
                    });
                    
                    const bestValue = spec.higherBetter !== undefined 
                      ? getBestValue(values, spec.higherBetter) 
                      : null;

                    return (
                      <tr key={spec.label} className="hover:bg-industrial-50">
                        <td className="py-3 px-4 font-medium text-industrial-900">
                          {spec.label}
                        </td>
                        {selectedModels.map((model, index) => {
                          const value = model[spec.key];
                          const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : Number(value);
                          const isBest = bestValue !== null && numericValue === bestValue;
                          
                          return (
                            <td
                              key={model.id}
                              className={`py-3 px-4 text-center ${
                                isBest ? 'text-green-600 font-semibold' : ''
                              }`}
                            >
                              {spec.format(value as any)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  
                  <tr className="hover:bg-industrial-50">
                    <td className="py-3 px-4 font-medium text-industrial-900">
                      Est. Price Range
                    </td>
                    {selectedModels.map((model) => {
                      const minPrice = Math.min(...selectedModels.map(m => m.priceRangeMin));
                      const isBest = model.priceRangeMin === minPrice;
                      return (
                        <td
                          key={model.id}
                          className={`py-3 px-4 text-center ${
                            isBest ? 'text-green-600 font-semibold' : ''
                          }`}
                        >
                          {formatPrice(model.priceRangeMin, model.priceRangeMax)}
                        </td>
                      );
                    })}
                  </tr>
                  
                  <tr className="hover:bg-industrial-50">
                    <td className="py-3 px-4 font-medium text-industrial-900">
                      Availability
                    </td>
                    {selectedModels.map((model) => (
                      <td key={model.id} className="py-3 px-4 text-center">
                        {getAvailabilityBadge(model.availability)}
                      </td>
                    ))}
                  </tr>
                  
                  <tr className="hover:bg-industrial-50">
                    <td className="py-3 px-4 font-medium text-industrial-900">
                      Overall Score
                    </td>
                    {selectedModels.map((model) => {
                      const maxScore = Math.max(...selectedModels.map(m => parseFloat(m.overallScore)));
                      const isBest = parseFloat(model.overallScore) === maxScore;
                      return (
                        <td key={model.id} className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className={`text-lg font-bold ${
                              isBest ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              {model.overallScore}
                            </div>
                            <div className="ml-1 text-xs text-industrial-500">/10</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-industrial-200">
              <div className="flex space-x-3">
                <Button variant="outline" className="text-industrial-600 hover:text-industrial-800">
                  <PrinterCheck className="w-4 h-4 mr-1" />
                  PrinterCheck Report
                </Button>
                <Button variant="outline" className="text-industrial-600 hover:text-industrial-800">
                  <Share className="w-4 h-4 mr-1" />
                  Share Comparison
                </Button>
              </div>
              <div className="flex space-x-3">
                <Button className="bg-primary text-white hover:bg-primary/90">
                  <FileText className="w-4 h-4 mr-1" />
                  Request Quotes
                </Button>
                <Button className="bg-green-600 text-white hover:bg-green-700">
                  <Download className="w-4 h-4 mr-1" />
                  Export PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
