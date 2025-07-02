import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Database, Download, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import type { ForkliftModel } from "@shared/schema";

interface ModelUpdateData {
  brand: string;
  model: string;
  tier: 'ENT' | 'MID' | 'PREM';
  capacity: string;
  powerType: string;
  liftHeight?: string;
  operatingWeight?: string;
  priceMin?: number;
  priceMax?: number;
  warranty?: number;
  notes?: string;
}

export default function BulkDataImport() {
  const [csvData, setCsvData] = useState("");
  const [parsedData, setParsedData] = useState<ModelUpdateData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState<{valid: ModelUpdateData[], invalid: any[]}>({valid: [], invalid: []});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const updateModelsMutation = useMutation({
    mutationFn: async (data: ModelUpdateData[]) => {
      const response = await fetch('/api/forklift-models/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: data })
      });
      if (!response.ok) throw new Error('Failed to update models');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forklift-models"] });
      toast({
        title: "Success",
        description: `Updated ${result.updated} models successfully`
      });
      setParsedData([]);
      setCsvData("");
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update models",
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvData(text);
        parseCSVData(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSVData = (csvText: string) => {
    setIsProcessing(true);
    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const parsed: ModelUpdateData[] = [];
      const invalid: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        try {
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          const modelData: ModelUpdateData = {
            brand: rowData.brand || rowData.manufacturer || '',
            model: rowData.model || rowData['model name'] || '',
            tier: (rowData.tier || rowData.category || 'MID').toUpperCase() as 'ENT' | 'MID' | 'PREM',
            capacity: rowData.capacity || rowData['load capacity'] || '',
            powerType: rowData['power type'] || rowData.fuel || rowData.engine || 'LPG',
            liftHeight: rowData['lift height'] || rowData.height || '',
            operatingWeight: rowData['operating weight'] || rowData.weight || '',
            priceMin: rowData['price min'] ? parseInt(rowData['price min']) : undefined,
            priceMax: rowData['price max'] ? parseInt(rowData['price max']) : undefined,
            warranty: rowData.warranty ? parseInt(rowData.warranty) : undefined,
            notes: rowData.notes || rowData.comments || ''
          };

          if (modelData.brand && modelData.model) {
            parsed.push(modelData);
          } else {
            invalid.push({ row: i + 1, data: rowData, reason: 'Missing brand or model' });
          }
        } catch (error) {
          invalid.push({ row: i + 1, data: values, reason: 'Parsing error' });
        }
      }
      
      setParsedData(parsed);
      setValidationResults({ valid: parsed, invalid });
      
      toast({
        title: "Data Parsed",
        description: `Found ${parsed.length} valid models, ${invalid.length} invalid rows`
      });
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse CSV data",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = () => {
    if (!csvData.trim()) return;
    parseCSVData(csvData);
  };

  const handleUpdateModels = () => {
    if (validationResults.valid.length === 0) {
      toast({
        title: "No Data",
        description: "No valid model data to update",
        variant: "destructive"
      });
      return;
    }
    
    updateModelsMutation.mutate(validationResults.valid);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'ENT': return 'bg-green-100 text-green-800';
      case 'MID': return 'bg-blue-100 text-blue-800';
      case 'PREM': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateSampleCSV = () => {
    const sampleData = `brand,model,tier,capacity,power type,lift height,operating weight,price min,price max,warranty,notes
Toyota,8FG25,MID,2500kg,LPG,3000mm,3500kg,42000,48000,24,Standard model
Crown,FC5252,PREM,2500kg,Electric,3200mm,3200kg,48000,55000,36,Premium features
Clark,C25,ENT,2500kg,LPG,3000mm,3800kg,35000,42000,12,Entry level
Hyster,H2.5FT,MID,2500kg,LPG,3000mm,3600kg,44000,50000,24,Mid-range option
Linde,H25T,PREM,2500kg,LPG,3200mm,3400kg,46000,52000,36,High-end model`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forklift_models_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bulk Model Data Import</h1>
        <p className="text-gray-600">Import forklift models with ENT, MID, and PREM tier classifications</p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Select CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a CSV file with columns: brand, model, tier, capacity, power type, etc.
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateSampleCSV} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {selectedFile && (
                <div className="p-3 bg-blue-50 rounded border">
                  <p className="font-medium">File Selected: {selectedFile.name}</p>
                  <p className="text-sm text-gray-600">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Manual CSV Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csvData">Paste CSV Data</Label>
                <Textarea
                  id="csvData"
                  placeholder="brand,model,tier,capacity,power type
Toyota,8FG25,MID,2500kg,LPG
Crown,FC5252,PREM,2500kg,Electric"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <Button onClick={handleManualInput} disabled={!csvData.trim() || isProcessing}>
                {isProcessing ? "Processing..." : "Parse Data"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Preview & Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parsedData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No data to preview. Upload a file or enter CSV data manually.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Valid: {validationResults.valid.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>Invalid: {validationResults.invalid.length}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleUpdateModels}
                      disabled={validationResults.valid.length === 0 || updateModelsMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updateModelsMutation.isPending ? "Updating..." : `Update ${validationResults.valid.length} Models`}
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Brand</th>
                          <th className="p-2 text-left">Model</th>
                          <th className="p-2 text-left">Tier</th>
                          <th className="p-2 text-left">Capacity</th>
                          <th className="p-2 text-left">Power Type</th>
                          <th className="p-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResults.valid.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 font-medium">{item.brand}</td>
                            <td className="p-2">{item.model}</td>
                            <td className="p-2">
                              <Badge className={getTierColor(item.tier)}>
                                {item.tier}
                              </Badge>
                            </td>
                            <td className="p-2">{item.capacity}</td>
                            <td className="p-2">{item.powerType}</td>
                            <td className="p-2 text-gray-600">{item.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {validationResults.invalid.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium text-red-600 mb-2">Invalid Rows:</h3>
                      <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-auto">
                        {validationResults.invalid.map((item, index) => (
                          <div key={index} className="text-sm text-red-700">
                            Row {item.row}: {item.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Current Models Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Current Model Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{models.length}</div>
              <div className="text-sm text-gray-600">Total Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {models.filter(m => m.tier === 'ENTRY').length}
              </div>
              <div className="text-sm text-gray-600">Entry Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {models.filter(m => m.tier === 'MID').length}
              </div>
              <div className="text-sm text-gray-600">Mid Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {models.filter(m => m.tier === 'PREMIUM').length}
              </div>
              <div className="text-sm text-gray-600">Premium</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}