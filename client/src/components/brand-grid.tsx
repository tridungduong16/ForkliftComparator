import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Info, FileText, Settings, GripVertical, Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import { ModelDetailsModal } from "@/components/model-details-modal";
import { useLocation } from "wouter";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ForkliftModel } from "@shared/schema";

// Import logos
import bobcatLogo from "@/assets/logos/bobcat.png";
import caterpillarLogo from "@/assets/logos/caterpillar.png";
import crownLogo from "@/assets/logos/crown.png";
import hysterLogo from "@/assets/logos/hyster.png";
import lindeLogo from "@/assets/logos/linde.png";
import mitsubishiLogo from "@/assets/logos/mitsubishi.png";
import tcmLogo from "@/assets/logos/tcm.png";
import toyotaLogo from "@/assets/logos/toyota.png";
import yaleLogo from "@/assets/logos/yale.png";
import hyundaiLogo from "@/assets/logos/hyundai.png";

interface BrandGridProps {
  models: ForkliftModel[];
  selectedModels: ForkliftModel[];
  onModelToggle: (model: ForkliftModel) => void;
}

// Define tier hierarchy for drag and drop
const TIER_HIERARCHY = ['ENTRY', 'MID', 'PREMIUM', 'SUPERHEAVY'];

export function BrandGrid({ models, selectedModels, onModelToggle }: BrandGridProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for new brand dialog
  const [showAddBrandDialog, setShowAddBrandDialog] = useState(false);
  const [newBrandForm, setNewBrandForm] = useState({
    name: '',
    country: '',
    description: ''
  });

  // State for new series dialog
  const [isAddSeriesDialogOpen, setIsAddSeriesDialogOpen] = useState(false);
  const [selectedBrandForNewSeries, setSelectedBrandForNewSeries] = useState<string>("");
  const [newSeriesForm, setNewSeriesForm] = useState({
    seriesName: '',
    tier: 'ENTRY',
    loadCapacity: 2500,
    powerType: 'LPG/Diesel',
    capacityFrom: 2000,
    capacityTo: 3500,
    capacityRange: '2000-3500 kg'
  });

  // State for edit series dialog
  const [isEditSeriesDialogOpen, setIsEditSeriesDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ForkliftModel | null>(null);
  const [editSeriesForm, setEditSeriesForm] = useState({
    seriesName: '',
    tier: 'ENTRY',
    loadCapacity: 2500,
    powerType: 'LPG/Diesel',
    capacityFrom: 2000,
    capacityTo: 3500,
    capacityRange: '2000-3500 kg',
    liftHeight: 300,
    operatingWeight: 3500,
    turnRadius: 85,
    travelSpeed: "11.0",
    priceRangeMin: 35000,
    priceRangeMax: 45000,
    warranty: 12,
    availability: "Available"
  });

  // Group models by brand
  const modelsByBrand = models.reduce((acc, model) => {
    if (!acc[model.brand]) {
      acc[model.brand] = [];
    }
    acc[model.brand].push(model);
    return acc;
  }, {} as Record<string, ForkliftModel[]>);

  // State for drag and drop ordering (visual only, no data changes)
  const [draggedItems, setDraggedItems] = useState<Record<string, ForkliftModel[]>>({});

  // Initialize dragged items state from grouped models by tier
  const getDisplayModels = (brand: string, tier: string) => {
    const tierKey = `${brand}-${tier}`;
    return draggedItems[tierKey] || modelsByBrand[brand]?.filter(model => model.tier === tier) || [];
  };

  // Drag and drop handlers - only for visual reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // If dropped in same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Only allow reordering within the same tier
    if (source.droppableId !== destination.droppableId) {
      toast({
        title: "Reordering Only",
        description: "Drag to reorder items within the same tier. Use Edit button to change tier.",
        variant: "default"
      });
      return;
    }

    // Update visual order without changing data
    const tierKey = source.droppableId;
    const [brand, tier] = tierKey.split('-');
    const currentItems = draggedItems[tierKey] || modelsByBrand[brand]?.filter(model => model.tier === tier) || [];
    const newItems = Array.from(currentItems);
    const [reorderedItem] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, reorderedItem);

    setDraggedItems(prev => ({
      ...prev,
      [tierKey]: newItems
    }));
  };

  // Mutation to update model tier
  const updateModelTierMutation = useMutation({
    mutationFn: async ({ modelId, newTier }: { modelId: number; newTier: string }) => {
      const response = await fetch(`/api/forklift-models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: newTier }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update model tier');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forklift-models'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update model tier",
        variant: "destructive",
      });
    },
  });

  // Add new brand mutation
  const addBrandMutation = useMutation({
    mutationFn: async (brandData: any) => {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add brand');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forklift-models'] });
      setShowAddBrandDialog(false);
      setNewBrandForm({ name: '', country: '', description: '' });
      toast({
        title: "Brand Added",
        description: "New brand has been successfully added to the system",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add new brand",
        variant: "destructive",
      });
    }
  });

  // Add new series mutation
  const addNewSeriesMutation = useMutation({
    mutationFn: async ({ seriesData, brand }: { seriesData: any; brand: string }) => {
      // Generate capacity range from from/to values
      const capacityRange = `${seriesData.capacityFrom}-${seriesData.capacityTo} kg`;
      
      const response = await fetch('/api/forklift-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          model: seriesData.seriesName,
          tier: seriesData.tier,
          loadCapacity: seriesData.loadCapacity,
          powerType: seriesData.powerType,
          capacityRange: capacityRange,
          liftHeight: 300,
          operatingWeight: 3500,
          turnRadius: 85,
          travelSpeed: "11.0",
          priceRangeMin: 35000,
          priceRangeMax: 45000,
          warranty: 12,
          availability: "Available",
          overallScore: "7.5"
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add series');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forklift-models'] });
      setIsAddSeriesDialogOpen(false);
      setNewSeriesForm({
        seriesName: '',
        tier: 'ENTRY',
        loadCapacity: 2500,
        powerType: 'LPG/Diesel',
        capacityFrom: 2000,
        capacityTo: 3500,
        capacityRange: '2000-3500 kg'
      });
      toast({
        title: "Series Added",
        description: "New series has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add new series",
        variant: "destructive",
      });
    }
  });

  // Edit series mutation
  const editSeriesMutation = useMutation({
    mutationFn: async (updateData: any) => {
      if (!editingModel) throw new Error('No model selected for editing');
      
      // Generate capacity range from from/to values
      const capacityRange = `${updateData.capacityFrom}-${updateData.capacityTo} kg`;
      
      const response = await fetch(`/api/forklift-models/${editingModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: updateData.seriesName,
          tier: updateData.tier,
          loadCapacity: updateData.loadCapacity,
          powerType: updateData.powerType,
          capacityRange: capacityRange,
          liftHeight: updateData.liftHeight,
          operatingWeight: updateData.operatingWeight,
          turnRadius: updateData.turnRadius,
          travelSpeed: updateData.travelSpeed,
          priceRangeMin: updateData.priceRangeMin,
          priceRangeMax: updateData.priceRangeMax,
          warranty: updateData.warranty,
          availability: updateData.availability
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update series');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forklift-models'] });
      setIsEditSeriesDialogOpen(false);
      setEditingModel(null);
      toast({
        title: "Series Updated",
        description: "Series has been successfully updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update series",
        variant: "destructive",
      });
    }
  });

  // Delete series mutation
  const deleteSeriesMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const response = await fetch(`/api/forklift-models/${modelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete series');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forklift-models'] });
      toast({
        title: "Series Deleted",
        description: "Series has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete series",
        variant: "destructive",
      });
    }
  });

  // Helper functions for edit/delete
  const handleEditSeries = (model: ForkliftModel) => {
    setEditingModel(model);
    // Parse existing capacity range or use defaults
    const capacityRange = model.capacityRange || '2000-3500 kg';
    const matches = capacityRange.match(/(\d+)-(\d+)/);
    const capacityFrom = matches ? parseInt(matches[1]) : 2000;
    const capacityTo = matches ? parseInt(matches[2]) : 3500;
    
    setEditSeriesForm({
      seriesName: model.model,
      tier: model.tier,
      loadCapacity: model.loadCapacity,
      powerType: model.powerType,
      capacityFrom,
      capacityTo,
      capacityRange: capacityRange,
      liftHeight: model.liftHeight,
      operatingWeight: model.operatingWeight,
      turnRadius: model.turnRadius,
      travelSpeed: model.travelSpeed,
      priceRangeMin: model.priceRangeMin,
      priceRangeMax: model.priceRangeMax,
      warranty: model.warranty,
      availability: model.availability
    });
    setIsEditSeriesDialogOpen(true);
  };

  const handleDeleteSeries = (model: ForkliftModel) => {
    if (window.confirm(`Are you sure you want to delete ${model.brand} ${model.model}? This action cannot be undone.`)) {
      deleteSeriesMutation.mutate(model.id);
    }
  };

  // Helper functions
  const getTierStyle = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'entry': return 'bg-green-100 text-green-800 border-green-300';
      case 'mid': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'superheavy': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'entry': return 'Entry';
      case 'mid': return 'Mid';
      case 'premium': return 'Premium';
      case 'superheavy': return 'Super Heavy';
      default: return tier;
    }
  };

  const getBrandLogo = (brand: string) => {
    switch (brand.toLowerCase()) {
      case "bobcat": return bobcatLogo;
      case "caterpillar": return caterpillarLogo;
      case "crown": return crownLogo;
      case "hyster": return hysterLogo;
      case "linde": return lindeLogo;
      case "mitsubishi": return mitsubishiLogo;
      case "tcm": return tcmLogo;
      case "toyota": return toyotaLogo;
      case "yale": return yaleLogo;
      case "hyundai": return hyundaiLogo;
      default: return null;
    }
  };

  // Tier Legend Component
  const TierLegend = () => (
    <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Tier Categories</h3>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Entry
          </Badge>
          <span className="text-xs text-gray-600">Basic models, cost-effective</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Mid
          </Badge>
          <span className="text-xs text-gray-600">Balanced features and price</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Premium
          </Badge>
          <span className="text-xs text-gray-600">Advanced technology, higher price</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            Super Heavy
          </Badge>
          <span className="text-xs text-gray-600">Heavy-duty, specialized applications</span>
        </div>
      </div>
    </div>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div>
        <TierLegend />
        
        {/* Add New Brand Section */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Brand Management</h3>
              <p className="text-sm text-blue-700">Add new forklift manufacturers to the system</p>
            </div>
            <Dialog open={showAddBrandDialog} onOpenChange={setShowAddBrandDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Brand
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Forklift Brand</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Brand Name</Label>
                    <Input
                      value={newBrandForm.name}
                      onChange={(e) => setNewBrandForm({...newBrandForm, name: e.target.value})}
                      placeholder="e.g., Clark, TCM, Heli"
                    />
                  </div>
                  <div>
                    <Label>Country/Region</Label>
                    <Input
                      value={newBrandForm.country}
                      onChange={(e) => setNewBrandForm({...newBrandForm, country: e.target.value})}
                      placeholder="e.g., USA, Japan, China"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newBrandForm.description}
                      onChange={(e) => setNewBrandForm({...newBrandForm, description: e.target.value})}
                      placeholder="Brief description of the brand"
                    />
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button 
                      onClick={() => addBrandMutation.mutate(newBrandForm)}
                      disabled={addBrandMutation.isPending || !newBrandForm.name}
                      className="flex-1"
                    >
                      {addBrandMutation.isPending ? "Adding..." : "Add Brand"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddBrandDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(modelsByBrand).map(([brand, brandModels]) => {
            const logo = getBrandLogo(brand);
            return (
              <Card key={brand} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    {/* Logo positioned at top left */}
                    <div className="absolute top-0 left-0">
                      {logo && (
                        <img 
                          src={logo} 
                          alt={`${brand} logo`} 
                          className="h-8 w-auto object-contain"
                        />
                      )}
                    </div>
                    {/* Brand name centered */}
                    <div className="text-center pt-2">
                      <h3 className="text-lg font-semibold text-gray-900">{brand}</h3>
                    </div>
                    {/* Model count at top right */}
                    <div className="absolute top-0 right-0">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {brandModels.length} Model{brandModels.length !== 1 ? 's' : ''}/Series
                      </span>
                    </div>
                  </div>

                  {/* Tier-based organization with drag-and-drop - only show tiers that have models */}
                  {TIER_HIERARCHY.map(tier => {
                    const tierModels = getDisplayModels(brand, tier);
                    
                    // Only render tier section if it has models
                    if (tierModels.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div key={tier} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={getTierStyle(tier)}>
                            {getTierLabel(tier)}
                          </Badge>
                          <span className="text-xs text-gray-500">({tierModels.length})</span>
                        </div>
                        
                        <Droppable droppableId={`${brand}-${tier}`} type="MODEL">
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`space-y-2 min-h-[50px] p-2 border-2 border-dashed border-gray-200 rounded-lg ${
                                snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : ''
                              }`}
                            >
                              {tierModels.map((model, index) => {
                                const isSelected = selectedModels.some(m => m.id === model.id);
                                return (
                                  <Draggable
                                    key={model.id.toString()}
                                    draggableId={model.id.toString()}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-all ${
                                          snapshot.isDragging ? 'shadow-lg' : ''
                                        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() => onModelToggle(model)}
                                            />
                                            <div>
                                              <div className="font-medium text-sm">{model.model}</div>
                                              <div className="text-xs text-gray-500">
                                                {model.capacityRange || `${model.loadCapacity}kg`}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex space-x-1">
                                            <button
                                              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const brandSlug = brand.toLowerCase().replace(/\s+/g, '-');
                                                const seriesSlug = model.model.toLowerCase().replace(/[\s\/\-]+/g, '-');
                                                setLocation(`/series/${brandSlug}/${seriesSlug}/info`);
                                              }}
                                              title="View Brochures & Competitor Pricing"
                                            >
                                              <Info className="w-4 h-4" />
                                            </button>
                                            <button
                                              className="text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 p-1 rounded"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleEditSeries(model);
                                              }}
                                              title="Edit Series"
                                            >
                                              <Settings className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}

                  {/* Add New Series Button */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <Dialog open={isAddSeriesDialogOpen} onOpenChange={setIsAddSeriesDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                          onClick={() => {
                            setSelectedBrandForNewSeries(brand);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Series
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Create New {selectedBrandForNewSeries} Series</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Series Name</Label>
                            <Input
                              value={newSeriesForm.seriesName}
                              onChange={(e) => setNewSeriesForm({...newSeriesForm, seriesName: e.target.value})}
                              placeholder="e.g., HT Series, 8FG Series, FC Series"
                            />
                          </div>
                          <div>
                            <Label>Tier Category</Label>
                            <Select value={newSeriesForm.tier} onValueChange={(value) => setNewSeriesForm({...newSeriesForm, tier: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ENTRY">Entry Level</SelectItem>
                                <SelectItem value="MID">Mid Range</SelectItem>
                                <SelectItem value="PREMIUM">Premium</SelectItem>
                                <SelectItem value="SUPERHEAVY">Super Heavy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Capacity Range (kg)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">From</Label>
                                <Input
                                  type="number"
                                  value={newSeriesForm.capacityFrom}
                                  onChange={(e) => {
                                    const from = parseInt(e.target.value) || 0;
                                    setNewSeriesForm({
                                      ...newSeriesForm, 
                                      capacityFrom: from,
                                      capacityRange: `${from}-${newSeriesForm.capacityTo} kg`,
                                      loadCapacity: Math.round((from + newSeriesForm.capacityTo) / 2)
                                    });
                                  }}
                                  placeholder="2000"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">To</Label>
                                <Input
                                  type="number"
                                  value={newSeriesForm.capacityTo}
                                  onChange={(e) => {
                                    const to = parseInt(e.target.value) || 0;
                                    setNewSeriesForm({
                                      ...newSeriesForm, 
                                      capacityTo: to,
                                      capacityRange: `${newSeriesForm.capacityFrom}-${to} kg`,
                                      loadCapacity: Math.round((newSeriesForm.capacityFrom + to) / 2)
                                    });
                                  }}
                                  placeholder="3500"
                                />
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Range: {newSeriesForm.capacityFrom}-{newSeriesForm.capacityTo} kg
                            </div>
                          </div>
                          <div>
                            <Label>Power Type</Label>
                            <Select value={newSeriesForm.powerType} onValueChange={(value) => setNewSeriesForm({...newSeriesForm, powerType: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LPG/Diesel">LPG/Diesel</SelectItem>
                                <SelectItem value="Electric">Electric</SelectItem>
                                <SelectItem value="LPG">LPG</SelectItem>
                                <SelectItem value="Diesel">Diesel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 mt-6">
                            <Button 
                              onClick={() => {
                                if (!newSeriesForm.seriesName) {
                                  toast({
                                    title: "Error",
                                    description: "Please enter a series name",
                                    variant: "destructive"
                                  });
                                  return;
                                }
                                addNewSeriesMutation.mutate({
                                  seriesData: newSeriesForm,
                                  brand: selectedBrandForNewSeries
                                });
                              }}
                              disabled={addNewSeriesMutation.isPending}
                              className="flex-1"
                            >
                              {addNewSeriesMutation.isPending ? "Creating..." : "Create Series"}
                            </Button>
                            <Button variant="outline" onClick={() => setIsAddSeriesDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Edit Series Dialog */}
                  <Dialog open={isEditSeriesDialogOpen} onOpenChange={setIsEditSeriesDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit {editingModel?.brand} {editingModel?.model}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Series Name</Label>
                            <Input
                              value={editSeriesForm.seriesName}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, seriesName: e.target.value})}
                              placeholder="e.g., HT Series, 8FG Series"
                            />
                          </div>
                          <div>
                            <Label>Tier Category</Label>
                            <Select value={editSeriesForm.tier} onValueChange={(value) => setEditSeriesForm({...editSeriesForm, tier: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ENTRY">Entry Level</SelectItem>
                                <SelectItem value="MID">Mid Range</SelectItem>
                                <SelectItem value="PREMIUM">Premium</SelectItem>
                                <SelectItem value="SUPERHEAVY">Super Heavy</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Capacity Range (kg)</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">From</Label>
                                <Input
                                  type="number"
                                  value={editSeriesForm.capacityFrom}
                                  onChange={(e) => {
                                    const from = parseInt(e.target.value) || 0;
                                    setEditSeriesForm({
                                      ...editSeriesForm, 
                                      capacityFrom: from,
                                      capacityRange: `${from}-${editSeriesForm.capacityTo} kg`,
                                      loadCapacity: Math.round((from + editSeriesForm.capacityTo) / 2)
                                    });
                                  }}
                                  placeholder="2000"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">To</Label>
                                <Input
                                  type="number"
                                  value={editSeriesForm.capacityTo}
                                  onChange={(e) => {
                                    const to = parseInt(e.target.value) || 0;
                                    setEditSeriesForm({
                                      ...editSeriesForm, 
                                      capacityTo: to,
                                      capacityRange: `${editSeriesForm.capacityFrom}-${to} kg`,
                                      loadCapacity: Math.round((editSeriesForm.capacityFrom + to) / 2)
                                    });
                                  }}
                                  placeholder="3500"
                                />
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Range: {editSeriesForm.capacityFrom}-{editSeriesForm.capacityTo} kg
                            </div>
                          </div>
                          <div>
                            <Label>Power Type</Label>
                            <Select value={editSeriesForm.powerType} onValueChange={(value) => setEditSeriesForm({...editSeriesForm, powerType: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LPG/Diesel">LPG/Diesel</SelectItem>
                                <SelectItem value="Electric">Electric</SelectItem>
                                <SelectItem value="LPG">LPG</SelectItem>
                                <SelectItem value="Diesel">Diesel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Lift Height (cm)</Label>
                            <Input
                              type="number"
                              value={editSeriesForm.liftHeight}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, liftHeight: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label>Operating Weight (kg)</Label>
                            <Input
                              type="number"
                              value={editSeriesForm.operatingWeight}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, operatingWeight: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Turn Radius (cm)</Label>
                            <Input
                              type="number"
                              value={editSeriesForm.turnRadius}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, turnRadius: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label>Travel Speed (km/h)</Label>
                            <Input
                              value={editSeriesForm.travelSpeed}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, travelSpeed: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Price Min (USD)</Label>
                            <Input
                              type="number"
                              value={editSeriesForm.priceRangeMin}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, priceRangeMin: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label>Price Max (USD)</Label>
                            <Input
                              type="number"
                              value={editSeriesForm.priceRangeMax}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, priceRangeMax: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Warranty (months)</Label>
                            <Input
                              type="number"
                              value={editSeriesForm.warranty}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, warranty: parseInt(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label>Availability</Label>
                            <Input
                              value={editSeriesForm.availability}
                              onChange={(e) => setEditSeriesForm({...editSeriesForm, availability: e.target.value})}
                              placeholder="e.g., In Stock, 2-3 weeks"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                          <Button 
                            onClick={() => editSeriesMutation.mutate(editSeriesForm)}
                            disabled={editSeriesMutation.isPending || !editSeriesForm.seriesName}
                            className="flex-1"
                          >
                            {editSeriesMutation.isPending ? "Updating..." : "Update Series"}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditSeriesDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              if (editingModel && window.confirm(`Are you sure you want to delete ${editingModel.brand} ${editingModel.model}? This action cannot be undone.`)) {
                                deleteSeriesMutation.mutate(editingModel.id);
                                setIsEditSeriesDialogOpen(false);
                              }
                            }}
                            disabled={deleteSeriesMutation.isPending}
                          >
                            {deleteSeriesMutation.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DragDropContext>
  );
}