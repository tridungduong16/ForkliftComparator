import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Brochure, CompetitorQuote } from "@shared/schema";

export default function SeriesBrochures() {
  const { brand, series } = useParams();
  const [, setLocation] = useLocation();

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  const { data: competitorQuotes = [] } = useQuery<CompetitorQuote[]>({
    queryKey: ["/api/competitor-quotes"],
  });

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

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('brochure', selectedFile);
    formData.append('powerType', powerType);
    formData.append('brochureType', brochureType);
    formData.append('forceBrand', brand || '');
    formData.append('forceSeries', series || '');
    uploadMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Filter brochures for this brand/series
  const seriesName = series?.replace(/-/g, ' ');
  const relatedBrochures = brochures.filter(b => 
    b.brand.toLowerCase() === brand?.toLowerCase() &&
    (b.model.toLowerCase().includes(seriesName?.toLowerCase() || '') ||
     seriesName?.toLowerCase().includes(b.model.toLowerCase() || ''))
  );

  return (
    <div className="min-h-screen bg-industrial-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              {brand} {seriesName} Series - Information
            </h1>
            <p className="text-industrial-600">View brochures and competitor pricing for the {brand} {seriesName} series</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload New Brochure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Power Type and Brochure Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-industrial-700 mb-2">
                    Power Type
                  </label>
                  <Select value={powerType} onValueChange={setPowerType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select power type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LPG">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          LPG Only
                        </div>
                      </SelectItem>
                      <SelectItem value="Diesel">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Diesel Only
                        </div>
                      </SelectItem>
                      <SelectItem value="LPG/Diesel">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          <Zap className="w-4 h-4" />
                          LPG & Diesel
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-industrial-700 mb-2">
                    Brochure Type
                  </label>
                  <Select value={brochureType} onValueChange={setBrochureType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brochure type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General Specifications</SelectItem>
                      <SelectItem value="LPG-Specific">LPG Variant Specs</SelectItem>
                      <SelectItem value="Diesel-Specific">Diesel Variant Specs</SelectItem>
                      <SelectItem value="Technical">Technical Manual</SelectItem>
                      <SelectItem value="Marketing">Marketing Brochure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    AI will automatically extract specifications for {brand} {seriesName} ({powerType})
                  </p>
                </label>
              </div>
              
              {selectedFile && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-industrial-100 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm text-industrial-700 font-medium">{selectedFile.name}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {powerType}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {brochureType}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={handleFileUpload}
                      disabled={isUploading}
                      size="sm"
                    >
                      {isUploading ? "Processing..." : "Upload & Process"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Brochures */}
        <Card>
          <CardHeader>
            <CardTitle>
              {brand} {seriesName} Brochures ({relatedBrochures.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedBrochures.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-industrial-300 mx-auto mb-4" />
                  <p className="text-industrial-500 mb-4">
                    No brochures uploaded for {brand} {seriesName} yet
                  </p>
                  <Button
                    onClick={() => document.getElementById('brochure-upload')?.click()}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload First Brochure
                  </Button>
                </div>
              ) : (
                relatedBrochures.map(brochure => (
                  <div key={brochure.id} className="flex items-center justify-between p-4 border border-industrial-200 rounded-lg bg-white">
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
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBrochureMutation.mutate(brochure.id)}
                        className="text-red-600 hover:text-red-800"
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
      </main>
    </div>
  );
}