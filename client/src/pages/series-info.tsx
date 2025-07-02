import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, ArrowLeft, FileText, TrendingUp, DollarSign, Calendar, ExternalLink, Upload, Plus, Trash2, Clock, Building2, Users, Globe, Phone, Mail, MapPin, Edit, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Brochure, CompetitorQuote, DistributorDetails, ForkliftModel } from "@shared/schema";

export default function SeriesInfo() {
  const { brand, series } = useParams();
  const [, setLocation] = useLocation();
  const [selectedBrochureFile, setSelectedBrochureFile] = useState<File | null>(null);
  const [selectedQuoteFile, setSelectedQuoteFile] = useState<File | null>(null);
  const [isBrochureDialogOpen, setIsBrochureDialogOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingModel, setEditingModel] = useState<ForkliftModel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    competitorBrand: '',
    competitorModel: '',
    quotedPrice: '',
    quoteDate: '',
    powerType: '',
    notes: '',
    status: 'active'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  const { data: competitorQuotes = [] } = useQuery<CompetitorQuote[]>({
    queryKey: ["/api/competitor-quotes"],
  });

  const { data: distributorDetails = [] } = useQuery<DistributorDetails[]>({
    queryKey: ["/api/distributor-details"],
  });

  // Helper functions and data processing
  const normalizeSeriesName = (name: string) => {
    return name.toLowerCase()
      .replace(/[-\s]+/g, ' ')  // Replace hyphens and multiple spaces with single space
      .replace(/\s+/g, ' ')     // Normalize multiple spaces to single space
      .trim();
  };

  const seriesName = series?.replace(/-/g, ' ');
  const normalizedSeriesName = normalizeSeriesName(series || '');
  
  const seriesModels = models.filter(model => {
    if (model.brand.toLowerCase() !== brand?.toLowerCase()) return false;
    
    const normalizedModelName = normalizeSeriesName(model.model);
    
    // Check if the normalized model name contains the normalized series name
    return normalizedModelName.includes(normalizedSeriesName) ||
           normalizedSeriesName.includes(normalizedModelName) ||
           model.series?.toLowerCase().includes(normalizedSeriesName);
  });

  // Calculate series ranges
  const getSeriesRanges = () => {
    if (seriesModels.length === 0) return { capacityRange: 'N/A', weightRange: 'N/A' };
    
    const capacities = seriesModels.map(m => m.loadCapacity);
    const weights = seriesModels.map(m => m.operatingWeight);
    
    const minCapacity = Math.min(...capacities);
    const maxCapacity = Math.max(...capacities);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    return {
      capacityRange: minCapacity === maxCapacity ? `${minCapacity} kg` : `${minCapacity} - ${maxCapacity} kg`,
      weightRange: minWeight === maxWeight ? `${minWeight} kg` : `${minWeight} - ${maxWeight} kg`
    };
  };

  const seriesRanges = getSeriesRanges();

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'ENTRY': return 'bg-green-100 text-green-800 border-green-300';
      case 'MID': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PREMIUM': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Update model mutation
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

  // Delete model mutation
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

  // Upload mutations
  const uploadBrochureMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/brochures', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brochures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({ title: "Success", description: "Brochure uploaded and stored successfully" });
      setSelectedBrochureFile(null);
      setIsBrochureDialogOpen(false);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsUploading(false);
    },
  });

  const uploadQuoteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/competitor-quotes', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitor-quotes"] });
      toast({ title: "Success", description: "Competitor quote uploaded successfully" });
      setSelectedQuoteFile(null);
      setQuoteForm({
        competitorBrand: '',
        competitorModel: '',
        quotedPrice: '',
        quoteDate: '',
        powerType: '',
        notes: '',
        status: 'active'
      });
      setIsQuoteDialogOpen(false);
      setIsUploading(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsUploading(false);
    },
  });

  // Delete mutations
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

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/competitor-quotes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitor-quotes"] });
      toast({ title: "Success", description: "Quote deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete quote", variant: "destructive" });
    },
  });

  // Filter data for this specific series
  const relatedBrochures = brochures.filter(b => 
    b.brand.toLowerCase() === brand?.toLowerCase() &&
    (b.model.toLowerCase().includes(seriesName?.toLowerCase() || '') ||
     seriesName?.toLowerCase().includes(b.model.toLowerCase() || ''))
  );

  const relatedQuotes = competitorQuotes.filter(q => 
    q.brand.toLowerCase() === brand?.toLowerCase() &&
    (q.model.toLowerCase().includes(seriesName?.toLowerCase() || '') ||
     seriesName?.toLowerCase().includes(q.model.toLowerCase() || ''))
  );

  // Helper functions
  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount.replace(/[^0-9.-]+/g, ""));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const isQuoteOld = (quoteDate: string) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(quoteDate) < sixMonthsAgo;
  };

  const handleBrochureUpload = () => {
    if (!selectedBrochureFile) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('brochure', selectedBrochureFile);
    formData.append('brand', brand || '');
    formData.append('model', seriesName || '');
    uploadBrochureMutation.mutate(formData);
  };

  const handleQuoteUpload = () => {
    if (!selectedQuoteFile || !quoteForm.competitorBrand || !quoteForm.quotedPrice) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('quote', selectedQuoteFile);
    formData.append('brand', brand || '');
    formData.append('model', seriesName || '');
    formData.append('competitorBrand', quoteForm.competitorBrand);
    formData.append('competitorModel', quoteForm.competitorModel);
    formData.append('quotedPrice', quoteForm.quotedPrice);
    formData.append('quoteDate', quoteForm.quoteDate);
    formData.append('powerType', quoteForm.powerType);
    formData.append('notes', quoteForm.notes);
    formData.append('status', quoteForm.status);
    uploadQuoteMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-industrial-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h1 className="text-2xl font-bold text-blue-600 mb-2">
              {brand} {seriesName} Series - Information
            </h1>
            <p className="text-industrial-600">
              View technical documentation and competitive pricing analysis
            </p>
          </div>
        </div>

        {/* Series Models Overview */}
        <Card className="mb-6">
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
                    <div className="grid grid-cols-2 gap-2 text-xs text-industrial-600 mb-3">
                      <div>Series Weight Range: {seriesRanges.capacityRange}</div>
                      <div>Lift Height: {model.liftHeight} cm</div>
                      <div>Operating Weight Range: {seriesRanges.weightRange}</div>
                      <div>Turn Radius: {model.turnRadius} cm</div>
                      <div>Travel Speed: {model.travelSpeed} km/h</div>
                      <div>Power Type: {model.powerType}</div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingModel(model);
                          setIsEditDialogOpen(true);
                        }}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete ${model.model}?`)) {
                            deleteModelMutation.mutate(model.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                        disabled={deleteModelMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deleteModelMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="brochures" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="brochures" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Technical Brochures ({relatedBrochures.length})
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Competitor Pricing ({relatedQuotes.length})
            </TabsTrigger>
          </TabsList>

          {/* Brochures Tab */}
          <TabsContent value="brochures">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Available Brochures & Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Series Documentation</h3>
                  <Dialog open={isBrochureDialogOpen} onOpenChange={setIsBrochureDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Brochure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Upload Series Brochure</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="brochure-file">Brochure File (PDF)</Label>
                          <Input
                            id="brochure-file"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSelectedBrochureFile(e.target.files?.[0] || null)}
                            className="mt-1"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Upload official brochures for {brand} {seriesName} series
                          </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsBrochureDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleBrochureUpload}
                            disabled={!selectedBrochureFile || isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {relatedBrochures.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-industrial-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-industrial-900 mb-2">
                      No brochures available
                    </h3>
                    <p className="text-industrial-500 mb-4">
                      Upload official brochures to build a comprehensive documentation library
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {relatedBrochures.map(brochure => (
                      <div key={brochure.id} className="flex items-center justify-between p-4 border border-industrial-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-industrial-900">
                              {brochure.model}
                            </h4>
                            {brochure.powerType && (
                              <Badge variant="outline" className="text-xs">
                                {brochure.powerType}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-industrial-600 mb-1">{brochure.originalName}</p>
                          <div className="flex items-center gap-4 text-xs text-industrial-500">
                            <span>{formatFileSize(brochure.fileSize)}</span>
                            <span>{new Date(brochure.uploadedAt).toLocaleDateString()}</span>
                            {brochure.status && (
                              <Badge variant={brochure.status === 'processed' ? 'default' : 'secondary'} className="text-xs">
                                {brochure.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(brochure.fileUrl, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete this brochure?`)) {
                                deleteBrochureMutation.mutate(brochure.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
                            disabled={deleteBrochureMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitor Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Competitive Pricing Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Competitive Intelligence</h3>
                  <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Quote
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Upload Competitor Quote</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="competitor-brand">Competitor Brand *</Label>
                            <Input
                              id="competitor-brand"
                              value={quoteForm.competitorBrand}
                              onChange={(e) => setQuoteForm({...quoteForm, competitorBrand: e.target.value})}
                              placeholder="e.g. Toyota, Hyster"
                            />
                          </div>
                          <div>
                            <Label htmlFor="competitor-model">Competitor Model</Label>
                            <Input
                              id="competitor-model"
                              value={quoteForm.competitorModel}
                              onChange={(e) => setQuoteForm({...quoteForm, competitorModel: e.target.value})}
                              placeholder="e.g. 25FG, H2.5TX"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="quoted-price">Quoted Price *</Label>
                            <Input
                              id="quoted-price"
                              value={quoteForm.quotedPrice}
                              onChange={(e) => setQuoteForm({...quoteForm, quotedPrice: e.target.value})}
                              placeholder="$25,000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quote-date">Quote Date</Label>
                            <Input
                              id="quote-date"
                              type="date"
                              value={quoteForm.quoteDate}
                              onChange={(e) => setQuoteForm({...quoteForm, quoteDate: e.target.value})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="power-type">Power Type</Label>
                          <Select value={quoteForm.powerType} onValueChange={(value) => setQuoteForm({...quoteForm, powerType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select power type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LPG/Diesel">LPG/Diesel</SelectItem>
                              <SelectItem value="Electric">Electric</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="quote-file">Quote File (PDF, Image)</Label>
                          <Input
                            id="quote-file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setSelectedQuoteFile(e.target.files?.[0] || null)}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Upload the actual quote document as proof
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={quoteForm.notes}
                            onChange={(e) => setQuoteForm({...quoteForm, notes: e.target.value})}
                            placeholder="Additional notes about this quote..."
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleQuoteUpload}
                            disabled={!quoteForm.competitorBrand || !quoteForm.quotedPrice || isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Quote
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {relatedQuotes.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-industrial-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-industrial-900 mb-2">
                      No pricing data available
                    </h3>
                    <p className="text-industrial-500 mb-4">
                      Upload competitor quotes with proof documents to build pricing intelligence
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {relatedQuotes.map(quote => (
                      <div key={quote.id} className="flex items-center justify-between p-4 border border-industrial-200 rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-industrial-900">
                              {quote.competitorBrand} {quote.competitorModel}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              vs {quote.brand} {quote.model}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-industrial-500">Quoted Price:</span>
                              <div className="font-medium text-green-600">
                                {formatCurrency(quote.quotedPrice)}
                              </div>
                            </div>
                            <div>
                              <span className="text-industrial-500">Quote Date:</span>
                              <div className="font-medium">
                                {new Date(quote.quoteDate).toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-industrial-500">Status:</span>
                              <div className="font-medium">
                                <Badge variant={quote.status === 'active' ? 'default' : 'secondary'}>
                                  {quote.status}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-industrial-500">Uploaded:</span>
                              <div className="font-medium">
                                {new Date(quote.uploadedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {quote.notes && (
                            <div className="mt-2 text-sm text-industrial-600">
                              <span className="font-medium">Notes:</span> {quote.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Model Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Model Details</DialogTitle>
            </DialogHeader>
            {editingModel && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="model">Model Name</Label>
                  <Input
                    id="model"
                    value={editingModel.model}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      model: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="tier">Tier</Label>
                  <Select
                    value={editingModel.tier}
                    onValueChange={(value) => setEditingModel({
                      ...editingModel,
                      tier: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRY">Entry</SelectItem>
                      <SelectItem value="MID">Mid</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="SUPERHEAVY">Super Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loadCapacity">Load Capacity (kg)</Label>
                  <Input
                    id="loadCapacity"
                    type="number"
                    value={editingModel.loadCapacity}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      loadCapacity: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="liftHeight">Lift Height (cm)</Label>
                  <Input
                    id="liftHeight"
                    type="number"
                    value={editingModel.liftHeight}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      liftHeight: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="powerType">Power Type</Label>
                  <Select
                    value={editingModel.powerType}
                    onValueChange={(value) => setEditingModel({
                      ...editingModel,
                      powerType: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LPG/Diesel">LPG/Diesel</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="LPG">LPG</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="operatingWeight">Operating Weight (kg)</Label>
                  <Input
                    id="operatingWeight"
                    type="number"
                    value={editingModel.operatingWeight}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      operatingWeight: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="turnRadius">Turn Radius (cm)</Label>
                  <Input
                    id="turnRadius"
                    type="number"
                    value={editingModel.turnRadius}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      turnRadius: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="travelSpeed">Travel Speed (km/h)</Label>
                  <Input
                    id="travelSpeed"
                    value={editingModel.travelSpeed}
                    onChange={(e) => setEditingModel({
                      ...editingModel,
                      travelSpeed: e.target.value
                    })}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingModel(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingModel) {
                        updateModelMutation.mutate(editingModel);
                      }
                    }}
                    disabled={updateModelMutation.isPending}
                  >
                    {updateModelMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}