import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  capacityFilter: string;
  setCapacityFilter: (filter: string) => void;
  powerTypeFilter: string;
  setPowerTypeFilter: (filter: string) => void;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  capacityFilter,
  setCapacityFilter,
  powerTypeFilter,
  setPowerTypeFilter,
}: SearchFiltersProps) {
  return (
    <div className="mb-8">
      <Card className="bg-white rounded-xl shadow-sm border border-industrial-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-industrial-900 mb-4">Find Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-industrial-700 mb-2">
                Search Models
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-industrial-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by model, brand, or specification..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-industrial-300 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-industrial-700 mb-2">
                Capacity Range
              </label>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="border-industrial-300 focus:ring-primary focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Capacities">All Capacities</SelectItem>
                  <SelectItem value="2000-3500 kg">2000-3500 kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-industrial-700 mb-2">
                Power Type
              </label>
              <Select value={powerTypeFilter} onValueChange={setPowerTypeFilter}>
                <SelectTrigger className="border-industrial-300 focus:ring-primary focus:border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Types">All Types</SelectItem>
                  <SelectItem value="LPG">LPG</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
