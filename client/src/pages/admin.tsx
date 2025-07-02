import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Link, Edit, Settings, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import type { Brochure, ForkliftModel } from "@shared/schema";

export default function Admin() {
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingModel, setEditingModel] = useState<ForkliftModel | null>(null);
  const [editForm, setEditForm] = useState({
    brand: "",
    model: "",
    tier: "",
    powerType: "",
    capacityRange: ""
  });
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newModelForm, setNewModelForm] = useState({
    brand: "",
    model: "",
    tier: "ENTRY",
    powerType: "Diesel",
    loadCapacity: 2500,
    liftHeight: 189,
    operatingWeight: 3500,
    turnRadius: 80,
    travelSpeed: "11.0",
    priceRangeMin: 30000,
    priceRangeMax: 40000,
    warranty: 12,
    availability: "Available",
    overallScore: "8.0",
    capacityRange: "2000-3500 kg"
  });
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  // Get unique brands from models
  const brandSet = new Set<string>();
  models.forEach(model => brandSet.add(model.brand));
  const availableBrands = Array.from(brandSet).sort();

  const updateModelMutation = useMutation({
    mutationFn: async (data: { id: number; model: any }) => {
      const response = await fetch(`/api/forklift-models/${data.id}/specifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.model),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({ title: "Success", description: "Model updated successfully" });
      setEditingModel(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update model", variant: "destructive" });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (modelData: any) => {
      const response = await fetch('/api/forklift-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData),
      });
      if (!response.ok) throw new Error('Creation failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({ title: "Success", description: "New model created successfully" });
      setIsCreatingNew(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create model", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/brochures/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brochures"] });
      toast({ title: "Success", description: "Brochure deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete brochure", variant: "destructive" });
    },
  });

  const startEdit = (model: ForkliftModel) => {
    setEditingModel(model);
    setEditForm({
      brand: model.brand,
      model: model.model,
      tier: model.tier,
      powerType: model.powerType,
      capacityRange: model.capacityRange
    });
  };

  const saveEdit = () => {
    if (!editingModel) return;
    updateModelMutation.mutate({
      id: editingModel.id,
      model: editForm
    });
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-industrial-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-industrial-900 mb-2">Admin Dashboard</h1>
            <p className="text-industrial-600">Manage forklift models, brochures, and system data</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
        </div>

        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Model Management
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Brand Management
            </TabsTrigger>
            <TabsTrigger value="brochures" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Brochures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Forklift Models ({models.length})</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreatingNew(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Model
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {models.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-3 border border-industrial-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-industrial-900">
                          {model.brand} - {model.model}
                        </h4>
                        <p className="text-sm text-industrial-600">
                          {model.tier} • {model.capacityRange} • {model.powerType}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(model)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {editingModel && (
                  <div className="mt-6 p-4 border border-industrial-300 rounded-lg bg-industrial-25">
                    <h4 className="font-semibold mb-4">Edit Model: {editingModel.brand} {editingModel.model}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand</Label>
                        <Input
                          value={editForm.brand}
                          onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input
                          value={editForm.model}
                          onChange={(e) => setEditForm({...editForm, model: e.target.value})}
                          placeholder="e.g., H2.0FT, 8FG20, GP20N"
                        />
                      </div>
                      <div>
                        <Label>Tier</Label>
                        <Select value={editForm.tier} onValueChange={(value) => setEditForm({...editForm, tier: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ENTRY">Entry</SelectItem>
                            <SelectItem value="MID">Mid</SelectItem>
                            <SelectItem value="PREMIUM">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Power Type</Label>
                        <Select value={editForm.powerType} onValueChange={(value) => setEditForm({...editForm, powerType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LPG">LPG</SelectItem>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Capacity Range</Label>
                        <Input
                          value={editForm.capacityRange}
                          onChange={(e) => setEditForm({...editForm, capacityRange: e.target.value})}
                          placeholder="e.g., 2-3.5 tonnes"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={saveEdit}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setEditingModel(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {isCreatingNew && (
                  <div className="mt-6 p-4 border border-blue-300 rounded-lg bg-blue-25">
                    <h4 className="font-semibold mb-4">Create New Model</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Brand</Label>
                        <Select value={newModelForm.brand} onValueChange={(value) => {
                          if (value === "new_brand") {
                            setIsCreatingBrand(true);
                          } else {
                            setNewModelForm({...newModelForm, brand: value});
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select or create brand" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableBrands.map(brand => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                            <SelectItem value="new_brand">+ Create New Brand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input
                          value={newModelForm.model}
                          onChange={(e) => setNewModelForm({...newModelForm, model: e.target.value})}
                          placeholder="e.g., 8FG20, H2.0FT, GP20N"
                        />
                      </div>
                      <div>
                        <Label>Tier</Label>
                        <Select value={newModelForm.tier} onValueChange={(value) => setNewModelForm({...newModelForm, tier: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ENTRY">Entry</SelectItem>
                            <SelectItem value="MID">Mid</SelectItem>
                            <SelectItem value="PREMIUM">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Power Type</Label>
                        <Select value={newModelForm.powerType} onValueChange={(value) => setNewModelForm({...newModelForm, powerType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LPG">LPG</SelectItem>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Load Capacity (kg)</Label>
                        <Input
                          type="number"
                          value={newModelForm.loadCapacity}
                          onChange={(e) => setNewModelForm({...newModelForm, loadCapacity: parseInt(e.target.value) || 2500})}
                        />
                      </div>
                      <div>
                        <Label>Lift Height (cm)</Label>
                        <Input
                          type="number"
                          value={newModelForm.liftHeight}
                          onChange={(e) => setNewModelForm({...newModelForm, liftHeight: parseInt(e.target.value) || 189})}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => createModelMutation.mutate(newModelForm)}>Create Model</Button>
                      <Button variant="outline" onClick={() => setIsCreatingNew(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Brand Management ({availableBrands.length} brands)</CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setIsCreatingBrand(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Brand
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {availableBrands.map(brand => {
                    const modelCount = models.filter(model => model.brand === brand).length;
                    return (
                      <div key={brand} className="p-4 border border-industrial-200 rounded-lg">
                        <h4 className="font-semibold text-industrial-900">{brand}</h4>
                        <p className="text-sm text-industrial-600">{modelCount} models</p>
                      </div>
                    );
                  })}
                </div>

                {isCreatingBrand && (
                  <div className="mt-6 p-4 border border-green-300 rounded-lg bg-green-25">
                    <h4 className="font-semibold mb-4">Create New Brand</h4>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label>Brand Name</Label>
                        <Input
                          value={newBrandName}
                          onChange={(e) => setNewBrandName(e.target.value)}
                          placeholder="e.g., Komatsu, Doosan, JCB"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => {
                        if (newBrandName.trim()) {
                          setNewModelForm({...newModelForm, brand: newBrandName.trim()});
                          setIsCreatingBrand(false);
                          setNewBrandName("");
                          toast({ title: "Success", description: `Brand "${newBrandName.trim()}" ready for use` });
                        }
                      }}>Add Brand</Button>
                      <Button variant="outline" onClick={() => {
                        setIsCreatingBrand(false);
                        setNewBrandName("");
                      }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brochures" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Uploaded Brochures ({brochures.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {brochures.length === 0 ? (
                    <p className="text-industrial-500 text-center py-8">No brochures uploaded yet</p>
                  ) : (
                    brochures.map(brochure => (
                      <div key={brochure.id} className="flex items-center justify-between p-3 border border-industrial-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-industrial-900">
                            {brochure.brand} - {brochure.model}
                          </h4>
                          <p className="text-sm text-industrial-600">{brochure.originalName}</p>
                          <p className="text-xs text-industrial-500">
                            {formatFileSize(brochure.fileSize)} • {new Date(brochure.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(brochure.fileUrl, '_blank')}
                          >
                            <Link className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(brochure.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}