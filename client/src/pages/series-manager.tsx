import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Upload, FileText, Plus, Trash2, Settings, Edit, Save, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ForkliftModel, Brochure } from "@shared/schema";

export default function SeriesManager() {
  const { brand, series } = useParams();
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingModel, setEditingModel] = useState<ForkliftModel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  // Get the specific series we're editing
  const seriesName = series?.replace(/-/g, ' ');
  const seriesModels = models.filter(model => 
    model.brand.toLowerCase() === brand?.toLowerCase() &&
    model.model.toLowerCase().includes(seriesName?.toLowerCase() || '')
  );

  // Get brochures for this specific series
  const seriesBrochures = brochures.filter(b => 
    b.brand.toLowerCase() === brand?.toLowerCase() &&
    b.model.toLowerCase().includes(seriesName?.toLowerCase() || '')
  );

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/brochures/smart-upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/brochures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({ 
        title: "Success", 
        description: `AI processed: ${data.brand} ${data.model}` 
      });
      setSelectedFile(null);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Upload failed",
        variant: "destructive" 
      });
      setIsUploading(false);
    },
  });

  const deleteBrochureMutation = useMutation({
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

  const updateModelMutation = useMutation({
    mutationFn: async (updatedModel: Partial<ForkliftModel> & { id: number }) => {
      const response = await fetch(`/api/forklift-models/${updatedModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedModel),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({ title: "Success", description: "Model updated successfully" });
      setIsEditDialogOpen(false);
      setEditingModel(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update model", variant: "destructive" });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/forklift-models/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({ title: "Success", description: "Model deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete model", variant: "destructive" });
    },
  });

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('brochure', selectedFile);
    uploadMutation.mutate(formData);
  };

  const startEdit = (model: ForkliftModel) => {
    setEditingModel(model);
    setIsEditDialogOpen(true);
  };

  const handleSaveModel = () => {
    if (!editingModel) return;
    updateModelMutation.mutate(editingModel);
  };

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case "ENTRY": return "bg-green-100 text-green-800 border-green-300";
      case "MID": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "PREMIUM": return "bg-purple-100 text-purple-800 border-purple-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-industrial-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Models
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              {brand} {seriesName} Series
            </h1>
            <p className="text-industrial-600">Edit specifications and manage {brand} {seriesName} series models</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Brochure for {brand}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-industrial-300 p-6 text-center rounded-lg">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="brochure-upload"
                />
                <label htmlFor="brochure-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-industrial-400 mx-auto mb-4" />
                  <p className="text-industrial-600 mb-2">
                    Click to upload PDF brochure or drag and drop
                  </p>
                  <p className="text-sm text-industrial-500">
                    AI will automatically extract model specifications
                  </p>
                </label>
              </div>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-industrial-100 rounded-lg">
                  <span className="text-sm text-industrial-700">{selectedFile.name}</span>
                  <Button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    size="sm"
                  >
                    {isUploading ? "Processing..." : "Upload & Process"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Series Editing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Series Models */}
          <Card>
            <CardHeader>
              <CardTitle>{brand} {seriesName} Models ({seriesModels.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {seriesModels.length === 0 ? (
                  <p className="text-industrial-500 text-center py-8">
                    No models found for {brand} {seriesName} series
                  </p>
                ) : (
                  seriesModels.map((model: ForkliftModel) => (
                    <div key={model.id} className="border border-industrial-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-industrial-900">{model.model}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getTierStyle(model.tier)}`}
                        >
                          {model.tier}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-industrial-600">
                        <div>Load Capacity: {model.loadCapacity} kg</div>
                        <div>Lift Height: {model.liftHeight} cm</div>
                        <div>Operating Weight: {model.operatingWeight} kg</div>
                        <div>Turn Radius: {model.turnRadius} cm</div>
                        <div>Travel Speed: {model.travelSpeed} km/h</div>
                        <div>Power Type: {model.powerType}</div>
                      </div>
                      <div className="mt-3 flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(model)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Model</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {model.model}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteModelMutation.mutate(model.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Series Brochures */}
          <Card>
            <CardHeader>
              <CardTitle>{brand} {seriesName} Brochures ({seriesBrochures.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seriesBrochures.length === 0 ? (
                  <p className="text-industrial-500 text-center py-8">
                    No brochures uploaded for {brand} {seriesName} yet
                  </p>
                ) : (
                  seriesBrochures.map(brochure => (
                    <div key={brochure.id} className="flex items-center justify-between p-3 border border-industrial-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-industrial-900">
                          {brochure.model}
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
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBrochureMutation.mutate(brochure.id)}
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
      </main>
    </div>
  );
}