import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, FileText, ExternalLink } from "lucide-react";
import type { ForkliftModel } from "@shared/schema";

interface ModelDetailsModalProps {
  model: ForkliftModel;
  children: React.ReactNode;
}

export function ModelDetailsModal({ model, children }: ModelDetailsModalProps) {
  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "ENTRY": return "Entry";
      case "MID": return "Mid";
      case "PREMIUM": return "Premium";
      default: return tier;
    }
  };

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case "ENTRY": return "bg-green-100 text-green-800 border-green-300";
      case "MID": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "PREMIUM": return "bg-purple-100 text-purple-800 border-purple-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatPrice = (min: number, max: number) => {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl font-bold">{model.brand} {model.model}</span>
            <Badge 
              variant="outline" 
              className={`${getTierStyle(model.tier)} font-semibold`}
            >
              {getTierLabel(model.tier)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Key Specifications */}
          <div>
            <h3 className="text-lg font-semibold text-industrial-900 mb-3">Key Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Load Capacity</div>
                <div className="font-semibold text-industrial-900">{model.loadCapacity} kg</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Capacity Range</div>
                <div className="font-semibold text-industrial-900">{model.capacityRange}</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Power Type</div>
                <div className="font-semibold text-industrial-900">{model.powerType}</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Lift Height</div>
                <div className="font-semibold text-industrial-900">{model.liftHeight} cm</div>
              </div>
            </div>
          </div>

          {/* Performance Data */}
          <div>
            <h3 className="text-lg font-semibold text-industrial-900 mb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Operating Weight</div>
                <div className="font-semibold text-industrial-900">{model.operatingWeight} kg</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Turn Radius</div>
                <div className="font-semibold text-industrial-900">{model.turnRadius} cm</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Travel Speed</div>
                <div className="font-semibold text-industrial-900">{model.travelSpeed} km/h</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Overall Score</div>
                <div className="font-semibold text-industrial-900">{model.overallScore}/10</div>
              </div>
            </div>
          </div>

          {/* Commercial Information */}
          <div>
            <h3 className="text-lg font-semibold text-industrial-900 mb-3">Commercial Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Price Range</div>
                <div className="font-semibold text-industrial-900">
                  {formatPrice(model.priceRangeMin, model.priceRangeMax)}
                </div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Warranty</div>
                <div className="font-semibold text-industrial-900">{model.warranty} months</div>
              </div>
              <div className="bg-industrial-50 p-3 rounded-lg">
                <div className="text-sm text-industrial-600">Availability</div>
                <div className="font-semibold text-industrial-900">{model.availability}</div>
              </div>
            </div>
          </div>

          {/* Tier Information */}
          <div>
            <h3 className="text-lg font-semibold text-industrial-900 mb-3">Tier Classification</h3>
            <div className="bg-industrial-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  className={`${getTierStyle(model.tier)} font-semibold`}
                >
                  {getTierLabel(model.tier)}
                </Badge>
                <span className="font-medium text-industrial-900">Tier</span>
              </div>
              <div className="text-sm text-industrial-600">
                {model.tier === "ENTRY" && "Designed for basic operations and price-sensitive buyers. Offers essential functionality with reliable performance."}
                {model.tier === "MID" && "Enhanced features with balanced performance. Ideal for businesses requiring improved productivity and efficiency."}
                {model.tier === "PREMIUM" && "Advanced technology with maximum efficiency. Premium features for demanding applications and high-volume operations."}
              </div>
            </div>
          </div>

          {/* Actions */}
          {model.brochureUrl && (
            <div className="border-t pt-4">
              <Button
                onClick={() => window.open(model.brochureUrl!, '_blank')}
                className="w-full"
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Technical Brochure
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}