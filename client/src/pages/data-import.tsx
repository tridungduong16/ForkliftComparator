import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Database, Download, Plus, Trash2 } from "lucide-react";
import type { Brochure, ForkliftModel } from "@shared/schema";

interface SpecificationData {
  brand: string;
  model: string;
  tier: string;
  fuelType: string;
  engine: string;
  engineTier: string;
  transmission: string;
  brakes: string;
  notes: string;
}

export default function DataImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBrochure, setSelectedBrochure] = useState<File | null>(null);
  const [specData, setSpecData] = useState("");
  const [parsedSpecs, setParsedSpecs] = useState<SpecificationData[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  const uploadBrochureMutation = useMutation({
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
      setSelectedBrochure(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload brochure", variant: "destructive" });
    },
  });

  const brands = Array.from(new Set(models.map(model => model.brand)));
  const modelsForBrand = models.filter(model => model.brand === selectedBrand);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setSelectedFile(file);
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSpecData(content);
      };
      reader.readAsText(file);
    } else {
      toast({ title: "Error", description: "Please select a text file", variant: "destructive" });
    }
  };

  const handleBrochureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedBrochure(file);
    } else {
      toast({ title: "Error", description: "Please select a PDF file", variant: "destructive" });
    }
  };

  const parseSpecificationData = () => {
    try {
      const lines = specData.split('\n').filter(line => line.trim());
      const parsed: SpecificationData[] = [];
      
      // Skip header lines and parse data rows
      let currentTier = '';
      
      for (const line of lines) {
        if (line.includes('ENTRY LEVEL') || line.includes('ENT')) {
          currentTier = 'ENTRY';
          continue;
        }
        if (line.includes('MID TIER') || line.includes('MID')) {
          currentTier = 'MID';
          continue;
        }
        if (line.includes('PREMIUM') || line.includes('TOP')) {
          currentTier = 'PREMIUM';
          continue;
        }
        
        // Skip header rows
        if (line.includes('Brand\t') || line.includes('Model/Tier\t') || line.trim() === '') {
          continue;
        }
        
        // Parse data rows (tab-separated)
        const columns = line.split('\t');
        if (columns.length >= 7) {
          parsed.push({
            brand: columns[0]?.trim() || '',
            model: columns[1]?.trim() || '',
            tier: currentTier,
            fuelType: columns[2]?.trim() || '',
            engine: columns[3]?.trim() || '',
            engineTier: columns[4]?.trim() || '',
            transmission: columns[5]?.trim() || '',
            brakes: columns[6]?.trim() || '',
            notes: columns[7]?.trim() || ''
          });
        }
      }
      
      setParsedSpecs(parsed);
      if (parsed.length > 0) {
        toast({ title: "Success", description: `Parsed ${parsed.length} specifications` });
      } else {
        toast({ title: "Warning", description: "No valid specifications found", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to parse specification data", variant: "destructive" });
    }
  };

  const handleUploadBrochure = async () => {
    if (!selectedBrochure || !selectedBrand || !selectedModel) {
      toast({ title: "Error", description: "Please select a brochure, brand, and model", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('brochure', selectedBrochure);
    formData.append('brand', selectedBrand);
    formData.append('model', selectedModel);

    try {
      await uploadBrochureMutation.mutateAsync(formData);
      setSelectedBrand("");
      setSelectedModel("");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `ENTRY LEVEL (ENT) — For basic operations, price-sensitive buyers
Brand   Model/Tier      Fuel Type       Engine (Tier)   Tier engine     Transmission    Brakes  Notes
Bobcat  NXP Series      LPG/Diesel      Yanmar / HMC (Tier III) III     Powershift (1-sp)       Drum    Entry model, basic functionality

MID TIER (MID) — For regular industrial users, balanced price/spec
Brand   Model/Tier      Fuel Type       Engine (Tier)   Tier engine     Transmission    Brakes  Notes
Toyota  7-Series        LPG/Diesel      1FS / 14Z-II (Tier III) III     Torque-converter        Oil-immersed disc       Mid to premium depending config

PREMIUM (TOP) — For high-demand operations, full features
Brand   Model/Tier      Fuel Type       Engine (Tier)   Tier engine     Transmission    Brakes  Notes
Linde   H20–H35 / HT B  LPG/Diesel      Kubota 2.4L (Tier III)  III     Hydrostatic     Oil-immersed disc       Hydrostatic drive, high end build`;

    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forklift-specs-template.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-industrial-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-industrial-900 mb-2">Data Import & Management</h1>
          <p className="text-industrial-600">Import specification data and upload brochures. Brochures are the primary source for capacity ranges and detailed specifications.</p>
        </div>

        <Tabs defaultValue="specifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="specifications">Specification Data</TabsTrigger>
            <TabsTrigger value="brochures">Brochures</TabsTrigger>
            <TabsTrigger value="combined">Combined Import</TabsTrigger>
          </TabsList>

          <TabsContent value="specifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Import Specification Data</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="spec-file">Text File (.txt)</Label>
                    <Input
                      id="spec-file"
                      type="file"
                      accept=".txt"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {selectedFile && (
                      <p className="text-sm text-industrial-600 mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="spec-data">Or Paste Data Directly</Label>
                    <Textarea
                      id="spec-data"
                      placeholder="Paste tab-separated specification data here..."
                      value={specData}
                      onChange={(e) => setSpecData(e.target.value)}
                      rows={8}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={parseSpecificationData} disabled={!specData}>
                      <Plus className="w-4 h-4 mr-2" />
                      Parse Data
                    </Button>
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Parsed Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Parsed Specifications ({parsedSpecs.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {parsedSpecs.length === 0 ? (
                      <p className="text-industrial-500 text-center py-8">No specifications parsed yet</p>
                    ) : (
                      parsedSpecs.map((spec, index) => (
                        <div key={index} className="p-3 border border-industrial-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-industrial-900">
                                {spec.brand} - {spec.model}
                              </h4>
                              <p className="text-sm text-industrial-600">
                                {spec.tier} • {spec.fuelType} • {spec.engine}
                              </p>
                              <p className="text-xs text-industrial-500">
                                {spec.transmission} • {spec.brakes}
                              </p>
                              {spec.notes && (
                                <p className="text-xs text-industrial-400 mt-1">{spec.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setParsedSpecs(prev => prev.filter((_, i) => i !== index))}
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
          </TabsContent>

          <TabsContent value="brochures" className="space-y-6">
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
                    <Label htmlFor="brochure-file">PDF Brochure</Label>
                    <Input
                      id="brochure-file"
                      type="file"
                      accept=".pdf"
                      onChange={handleBrochureChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {selectedBrochure && (
                      <p className="text-sm text-industrial-600 mt-2">
                        Selected: {selectedBrochure.name} ({formatFileSize(selectedBrochure.size)})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <input type="checkbox" id="ai-scanning" defaultChecked className="rounded" />
                    <label htmlFor="ai-scanning" className="text-sm text-blue-800">
                      Enable AI specification extraction (recommended)
                    </label>
                  </div>

                  <Button 
                    onClick={handleUploadBrochure} 
                    disabled={!selectedBrochure || !selectedBrand || !selectedModel || isUploading}
                    className="w-full"
                  >
                    {isUploading ? "Processing..." : "Upload & Extract Specifications"}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(brochure.fileUrl, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="combined" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Combined Import Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm text-industrial-600">
                  <h3>Recommended Import Workflow:</h3>
                  <ol>
                    <li><strong>Upload Brochures First:</strong> Brochures contain the actual capacity ranges (2-3t, 2-3.3t, etc.) that vary by series</li>
                    <li><strong>Import Specification Data:</strong> Use the technical data file to populate engine, transmission, and tier information</li>
                    <li><strong>Cross-Reference:</strong> Match specification data with brochure information for complete model profiles</li>
                    <li><strong>Validate Capacity Ranges:</strong> Ensure capacity ranges from brochures override any placeholder data</li>
                  </ol>
                  
                  <h3>Data Hierarchy:</h3>
                  <ul>
                    <li><strong>Brochures:</strong> Primary source for capacity ranges and detailed specifications</li>
                    <li><strong>Specification Data:</strong> Engine, transmission, brake, and tier classifications</li>
                    <li><strong>Series Logic:</strong> Same engine/drivetrain within series, varying counterweight/mast for different capacities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}