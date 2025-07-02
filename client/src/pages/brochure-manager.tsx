import { useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Brochure, ForkliftModel } from "@shared/schema";

export default function BrochureManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<{brand: string; model: string} | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [] } = useQuery<ForkliftModel[]>({
    queryKey: ["/api/forklift-models"],
  });

  const { data: brochures = [] } = useQuery<Brochure[]>({
    queryKey: ["/api/brochures"],
  });

  // AI will extract brand and model automatically

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsProcessing(true);
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
        description: `AI extracted and processed: ${data.brand} ${data.model}` 
      });
      setSelectedFile(null);
      setExtractedInfo(null);
      setIsProcessing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to upload brochure", 
        variant: "destructive" 
      });
      setIsProcessing(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({ title: "Error", description: "Please select a PDF file", variant: "destructive" });
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "Please select a PDF file", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append('brochure', selectedFile);
    
    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-industrial-900 mb-2">Smart Brochure Upload</h1>
          <p className="text-industrial-600">AI-powered brochure processing that automatically extracts brand, model, and specifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New Brochure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">PDF Brochure</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      Selected: {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      AI will automatically extract brand and model information
                    </p>
                  </div>
                )}
                {extractedInfo && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      Detected: {extractedInfo.brand} {extractedInfo.model}
                    </p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    AI Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Smart Upload & Process
                  </>
                )}
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">AI Smart Upload:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Choose PDF brochure file</li>
                  <li>2. AI automatically detects brand and model</li>
                  <li>3. Extracts specifications and updates database</li>
                  <li>4. Creates new models if not in database</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Existing Brochures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Uploaded Brochures ({brochures.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {brochures.length === 0 ? (
                <p className="text-industrial-500 text-center py-8">No brochures uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {brochures.map((brochure) => (
                    <div key={brochure.id} className="flex items-center justify-between p-3 border border-industrial-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-industrial-900">
                          {brochure.brand} {brochure.model}
                        </div>
                        <div className="text-sm text-industrial-500">
                          {brochure.filename} • {new Date(brochure.uploadedAt).toLocaleDateString()}
                        </div>
                        <div className="mt-1">
                          {getStatusBadge('processed')}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {brochure.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(brochure.fileUrl!, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(brochure.id)}
                          className="text-red-600 hover:text-red-800"
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
        </div>

        {/* Quick Upload for Attached Files */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Process Attached Brochures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Available PDFs to Process:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>• GN-7 Series Mid (Hyundai)</div>
                <div>• Hyster HXT-Series MID</div>
                <div>• TCM F1Series MID</div>
                <div>• Toyota 8FG FD Series</div>
                <div>• GE-7 Series brochure MID</div>
              </div>
            </div>
            <p className="text-industrial-600 text-sm">
              Use the upload form above to process these manufacturer brochures. 
              The AI will extract authentic specifications and update the forklift database automatically.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}