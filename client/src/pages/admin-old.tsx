import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Link, Edit, Plus, Settings } from "lucide-react";
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
    loadCapacity: 0,
    powerType: "",
    capacityRange: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/brochures/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brochures"] });
      toast({ title: "Success", description: "Brochure uploaded successfully" });
      setSelectedFile(null);
      setSelectedBrand("");
      setSelectedModel("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload brochure", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/brochures/${id}`, {
        method: 'DELETE',
      });
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

  const brands = Array.from(new Set(models.map(model => model.brand)));
  const modelsForBrand = models.filter(model => model.brand === selectedBrand);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({ title: "Error", description: "Please select a PDF file", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBrand || !selectedModel) {
      toast({ title: "Error", description: "Please select a file, brand, and model", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('brochure', selectedFile);
    formData.append('brand', selectedBrand);
    formData.append('model', selectedModel);

    try {
      await uploadMutation.mutateAsync(formData);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

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

  const startEdit = (model: ForkliftModel) => {
    setEditingModel(model);
    setEditForm({
      brand: model.brand,
      model: model.model,
      tier: model.tier,
      loadCapacity: model.loadCapacity,
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

  return (
    <div className="min-h-screen bg-industrial-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-industrial-900 mb-2">Admin Dashboard</h1>
          <p className="text-industrial-600">Manage forklift models, brochures, and system data</p>
        </div>

        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Model Management
            </TabsTrigger>
            <TabsTrigger value="brochures" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Brochures
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Forklift Models ({models.length})</CardTitle>
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
                          placeholder="e.g., 2000-3500 kg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={saveEdit}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setEditingModel(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brochures" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Brochure</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="model">Model Series</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsForBrand.map(model => (
                      <SelectItem key={model.id} value={model.model}>{model.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file">PDF Brochure</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                {selectedFile && (
                  <p className="text-sm text-industrial-600 mt-2">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || !selectedBrand || !selectedModel || isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload Brochure"}
              </Button>
            </CardContent>
          </Card>

          {/* Brochures List */}
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
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm text-industrial-600">
              <ul>
                <li>Upload PDF brochures for each forklift model series</li>
                <li>Each series can support multiple capacities (2t to 3.5t) as specified in the brochure</li>
                <li>Brochures should contain detailed specifications including capacity ranges, power types, and performance data</li>
                <li>Once uploaded, brochures will be accessible from the forklift comparison cards</li>
                <li>Maximum file size: 10MB per brochure</li>
              </ul>
            </div>
          </CardContent>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}