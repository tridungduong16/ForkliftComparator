import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Search, 
  Upload, 
  BarChart3, 
  Settings, 
  Info, 
  Plus,
  MousePointer,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  CheckSquare,
  DragHandleDots2,
  Bot,
  TrendingUp,
  AlertCircle
} from "lucide-react";

export function UserManual() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Forklift Intelligence Platform</h1>
        <p className="text-lg text-gray-600">Complete User Manual & Application Guide</p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline">Version 2.0</Badge>
          <Badge variant="outline">Updated December 2024</Badge>
        </div>
      </div>

      <Separator />

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Getting Started</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Platform Overview</li>
                <li>• Navigation Basics</li>
                <li>• Interface Layout</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Core Features</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Model Comparison</li>
                <li>• AI Intelligence Portal</li>
                <li>• Brochure Management</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Advanced Functions</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Series Management</li>
                <li>• Competitive Analysis</li>
                <li>• Data Export</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Support</h4>
              <ul className="space-y-1 text-sm text-gray-600 pl-4">
                <li>• Troubleshooting</li>
                <li>• FAQ</li>
                <li>• Contact Information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            The Forklift Intelligence Platform is a comprehensive tool designed for forklift dealers, manufacturers, 
            and industry professionals to compare, analyze, and manage forklift models across multiple brands and tiers.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Model Database</h4>
              <p className="text-sm text-blue-700">
                Access comprehensive specifications for 2-3.5 tonne capacity forklifts from 8 major brands
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">AI-Powered Analysis</h4>
              <p className="text-sm text-green-700">
                Generate competitive insights and extract specifications from brochures automatically
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Tier Classification</h4>
              <p className="text-sm text-purple-700">
                Models organized by Entry, Mid, Premium, and Super Heavy tiers for easy comparison
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5" />
            Navigation & Interface Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Main Interface Elements</h4>
            
            <div className="grid gap-4">
              <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Search & Filter Bar</span>
                </div>
                <p className="text-sm text-gray-600">
                  Located at the top of the page. Use to search by brand, model, capacity, or power type.
                </p>
              </div>

              <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Brand Grid</span>
                </div>
                <p className="text-sm text-gray-600">
                  Main content area showing forklift models organized by brand and tier. Each brand card displays available series.
                </p>
              </div>

              <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">Comparison Bar</span>
                </div>
                <p className="text-sm text-gray-600">
                  Appears at bottom when models are selected. Shows count and provides comparison options.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Action Buttons</h4>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-2 border rounded">
                <Info className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-sm font-medium">Blue Info Button</span>
                  <p className="text-xs text-gray-600">View brochures & competitor pricing</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 border rounded">
                <Settings className="w-4 h-4 text-red-600" />
                <div>
                  <span className="text-sm font-medium">Red Settings Button</span>
                  <p className="text-xs text-gray-600">Edit series specifications</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 border rounded">
                <Plus className="w-4 h-4 text-green-600" />
                <div>
                  <span className="text-sm font-medium">Add New Brand</span>
                  <p className="text-xs text-gray-600">Add new forklift manufacturer</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 border rounded">
                <DragHandleDots2 className="w-4 h-4 text-gray-600" />
                <div>
                  <span className="text-sm font-medium">Drag Handle</span>
                  <p className="text-xs text-gray-600">Reorder series between tiers</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Comparison Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Model Comparison Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Standard Comparison Process</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Select Models</p>
                  <p className="text-sm text-gray-600">Click checkboxes next to models you want to compare (up to 6 models)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Open Comparison</p>
                  <p className="text-sm text-gray-600">Click "Compare Selected" in the comparison bar that appears at the bottom</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Analyze Results</p>
                  <p className="text-sm text-gray-600">Review side-by-side specifications, pricing, and performance ratings</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">AI Intelligence Portal</h4>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Advanced AI Analysis</span>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                Access advanced competitive analysis with AI-generated insights and sales recommendations.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Competitive positioning analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span>AI-generated sales talk tracks</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span>Strengths and weaknesses analysis</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-700 font-medium">How to use the AI Intelligence Portal:</p>
              <ol className="space-y-2 text-sm text-gray-600 pl-4">
                <li>1. Select models using checkboxes</li>
                <li>2. Click "AI Intelligence Portal" in the comparison bar</li>
                <li>3. Drag and drop models in the comparison area</li>
                <li>4. Click "Generate AI Insights" for competitive analysis</li>
                <li>5. Review strengths, weaknesses, and talk tracks</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brochure Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Brochure Management & AI Scanning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Upload Process</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium">Access Upload Interface</p>
                  <p className="text-sm text-gray-600">Click the blue info button on any forklift series to access the brochure management page</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Upload className="w-4 h-4 text-green-600 mt-1" />
                <div>
                  <p className="font-medium">Select File</p>
                  <p className="text-sm text-gray-600">Choose PDF, DOC, or DOCX files up to 10MB. Supported formats include brochures, spec sheets, and quotes</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Settings className="w-4 h-4 text-purple-600 mt-1" />
                <div>
                  <p className="font-medium">Configure Settings</p>
                  <p className="text-sm text-gray-600">Select power type (Diesel, Electric, LPG/Petrol, Hybrid) and brochure type</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bot className="w-4 h-4 text-orange-600 mt-1" />
                <div>
                  <p className="font-medium">AI Processing</p>
                  <p className="text-sm text-gray-600">The system automatically extracts specifications, pricing, and technical details</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">AI Extraction Capabilities</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm text-yellow-800">
              <div>
                <p className="font-medium mb-1">Technical Specifications:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Load capacity and lift height</li>
                  <li>• Engine specifications and power</li>
                  <li>• Operating weight and dimensions</li>
                  <li>• Turn radius and travel speed</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Commercial Information:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Pricing ranges and options</li>
                  <li>• Warranty terms and coverage</li>
                  <li>• Features and accessories</li>
                  <li>• Tier classification</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Series Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Series Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Edit Series Specifications</h4>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-900">Accessing Edit Mode</span>
              </div>
              <p className="text-sm text-red-700">
                Click the red settings cog button on any series to access the edit interface where you can modify specifications, tier placement, and technical details.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-gray-800">Editable Fields:</h5>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Basic Information:</p>
                  <ul className="space-y-1 text-xs text-gray-600 pl-3">
                    <li>• Model name and series</li>
                    <li>• Brand and tier classification</li>
                    <li>• Load capacity (kg)</li>
                    <li>• Power type</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Technical Specifications:</p>
                  <ul className="space-y-1 text-xs text-gray-600 pl-3">
                    <li>• Lift height (mm)</li>
                    <li>• Operating weight (kg)</li>
                    <li>• Turn radius (mm)</li>
                    <li>• Travel speed (km/h)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Drag & Drop Tier Management</h4>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DragHandleDots2 className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Reorder Series Between Tiers</span>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Use the drag handle (vertical dots) to move series between Entry, Mid, Premium, and Super Heavy tiers.
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">Entry</Badge>
                  <span className="text-xs text-gray-600">Basic models, cost-effective solutions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">Mid</Badge>
                  <span className="text-xs text-gray-600">Balanced features and pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">Premium</Badge>
                  <span className="text-xs text-gray-600">Advanced technology, higher performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">Super Heavy</Badge>
                  <span className="text-xs text-gray-600">Heavy-duty, specialized applications</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-900">How many models can I compare at once?</h4>
              <p className="text-sm text-gray-600">You can compare up to 6 models simultaneously in the standard comparison view and unlimited models in the AI Intelligence Portal.</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-gray-900">What file formats are supported for brochure upload?</h4>
              <p className="text-sm text-gray-600">PDF, DOC, and DOCX files up to 10MB are supported. The AI system works best with clear, text-based documents.</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-gray-900">How accurate is the AI specification extraction?</h4>
              <p className="text-sm text-gray-600">The AI system achieves 85-95% accuracy for standard specifications. Always review extracted data before using it for critical decisions.</p>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-medium text-gray-900">Can I export comparison data?</h4>
              <p className="text-sm text-gray-600">Yes, use the export buttons in the comparison modal to download data in Excel or PDF format.</p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-gray-900">How do I add a new forklift brand?</h4>
              <p className="text-sm text-gray-600">Click the "Add New Brand" button in the brand management section, provide the brand details, and start adding series.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Technical Support</h4>
            <p className="text-sm text-blue-700">
              For technical issues, data problems, or feature requests, contact our support team.
              We provide comprehensive assistance with platform usage and troubleshooting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Getting Help</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Use the help button (bottom right) for instant assistance</li>
                <li>• Access video tutorials for step-by-step guidance</li>
                <li>• Check the AI assistant for common questions</li>
                <li>• Review this manual for comprehensive information</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Best Practices</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• Always review AI-extracted data before use</li>
                <li>• Use clear, high-quality brochures for best results</li>
                <li>• Save comparisons for future reference</li>
                <li>• Keep brochure files organized by brand and model</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}