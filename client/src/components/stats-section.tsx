import { Card, CardContent } from "@/components/ui/card";
import type { ForkliftModel } from "@shared/schema";

interface StatsSectionProps {
  models: ForkliftModel[];
}

export function StatsSection({ models }: StatsSectionProps) {
  const brands = [...new Set(models.map(model => model.brand))];
  const minCapacity = Math.min(...models.map(model => model.loadCapacity));
  const maxCapacity = Math.max(...models.map(model => model.loadCapacity));
  const minPrice = Math.min(...models.map(model => model.priceRangeMin));
  const maxPrice = Math.max(...models.map(model => model.priceRangeMax));

  const formatCapacityRange = () => {
    return `${(minCapacity / 1000).toFixed(0)}-${(maxCapacity / 1000).toFixed(0)}K`;
  };

  const formatPriceRange = () => {
    return `$${(minPrice / 1000).toFixed(0)}K-${(maxPrice / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-industrial-200 mb-8">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-industrial-900 mb-4">Market Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{models.length}</div>
            <div className="text-sm text-industrial-500">Total Models</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{brands.length}</div>
            <div className="text-sm text-industrial-500">Brands Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatCapacityRange()}</div>
            <div className="text-sm text-industrial-500">Capacity Range (lbs)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{formatPriceRange()}</div>
            <div className="text-sm text-industrial-500">Price Range</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
