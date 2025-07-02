import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Bot, 
  Book, 
  Video, 
  FileText, 
  MessageCircle, 
  Settings, 
  Upload, 
  Search,
  BarChart3,
  Users,
  Database,
  Zap,
  Target,
  ChevronRight,
  PlayCircle
} from "lucide-react";

export function HelpMenu() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("guide");

  const QuickStartGuide = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-blue-900 mb-2">Welcome to Forklift Intelligence Platform</h3>
        <p className="text-sm text-blue-700">
          Your comprehensive tool for forklift comparison, competitive analysis, and market intelligence.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              Browse Forklift Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Start by exploring our comprehensive database of forklift models organized by brand and tier.</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">8 Major Brands</Badge>
              <Badge variant="outline">Entry to Premium Tiers</Badge>
              <Badge variant="outline">2-3.5 Tonne Capacity</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              Compare Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Select models using checkboxes and use our advanced comparison tools.</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-blue-500" />
                <span>Standard comparison modal</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ChevronRight className="w-4 h-4 text-blue-500" />
                <span>Advanced AI Intelligence Portal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              Upload Brochures & Generate Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">Upload competitor brochures and generate AI-powered competitive insights.</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4 text-purple-500" />
                <span>PDF brochure upload</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4 text-purple-500" />
                <span>AI specification extraction</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const FeatureGuide = () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="comparison">
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Model Comparison Features
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Standard Comparison</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Side-by-side specification comparison</li>
              <li>• Price range analysis</li>
              <li>• Technical specifications table</li>
              <li>• Performance ratings</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">AI Intelligence Portal</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Drag-and-drop model selection</li>
              <li>• AI-generated competitive insights</li>
              <li>• Sales talk tracks</li>
              <li>• Competitive positioning analysis</li>
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="brochures">
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            Brochure Management System
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="space-y-3">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium">Upload Process</h4>
              <p className="text-sm text-gray-600">Click info button → Upload brochure → Select power type → AI extracts specifications</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium">Supported Formats</h4>
              <p className="text-sm text-gray-600">PDF, DOC, DOCX files up to 10MB</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium">AI Processing</h4>
              <p className="text-sm text-gray-600">Automatic extraction of capacity, power specs, dimensions, and pricing</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="series">
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-600" />
            Series Management
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-3">
            <div className="bg-red-50 p-3 rounded">
              <h4 className="font-medium text-red-800">Edit Series (Red Cog)</h4>
              <p className="text-sm text-red-700">Modify specifications, tier placement, and technical details</p>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium text-blue-800">View Info (Blue i)</h4>
              <p className="text-sm text-blue-700">Access brochures, competitor quotes, and detailed specifications</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-gray-800">Drag & Drop</h4>
              <p className="text-sm text-gray-700">Reorganize series between tiers using drag handles</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="pricing">
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Pricing Intelligence
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-orange-50 p-3 rounded">
              <h4 className="font-medium text-orange-800">Competitor Quotes</h4>
              <p className="text-sm text-orange-700">Upload and track competitor pricing quotes with AI analysis</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-medium text-green-800">Price Positioning</h4>
              <p className="text-sm text-green-700">Compare your pricing against market ranges</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const ChatBot = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">AI Assistant</h3>
        </div>
        <p className="text-sm text-purple-700">
          Get instant help with common questions and tasks.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Frequently Asked Questions</h4>
        
        <div className="space-y-2">
          <Card className="p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-blue-500 mt-1" />
              <div>
                <p className="text-sm font-medium">How do I compare multiple models?</p>
                <p className="text-xs text-gray-600 mt-1">Select models using checkboxes, then click "Compare Selected" or use the AI Intelligence Portal.</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-green-500 mt-1" />
              <div>
                <p className="text-sm font-medium">How do I upload competitor brochures?</p>
                <p className="text-xs text-gray-600 mt-1">Click the blue info button on any series, then use the upload section to add PDF brochures.</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-purple-500 mt-1" />
              <div>
                <p className="text-sm font-medium">How do I edit series specifications?</p>
                <p className="text-xs text-gray-600 mt-1">Click the red settings cog on any series to modify specifications and tier placement.</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-orange-500 mt-1" />
              <div>
                <p className="text-sm font-medium">How do I add new brands or series?</p>
                <p className="text-xs text-gray-600 mt-1">Use the "Add New Brand" button in the brand management section or "Add New Series" within each brand.</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-red-500 mt-1" />
              <div>
                <p className="text-sm font-medium">What AI features are available?</p>
                <p className="text-xs text-gray-600 mt-1">AI brochure scanning, competitive insights generation, and specification extraction from uploaded documents.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const TutorialVideos = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Video Tutorials</h3>
        </div>
        <p className="text-sm text-red-700">
          Step-by-step video guides for all major features.
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Getting Started (3:45)</h4>
              <p className="text-sm text-gray-600">Overview of the platform and basic navigation</p>
            </div>
            <Badge variant="outline">Beginner</Badge>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Model Comparison (5:20)</h4>
              <p className="text-sm text-gray-600">How to compare models and interpret results</p>
            </div>
            <Badge variant="outline">Intermediate</Badge>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">AI Intelligence Portal (7:15)</h4>
              <p className="text-sm text-gray-600">Advanced comparison with AI insights</p>
            </div>
            <Badge variant="outline">Advanced</Badge>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Brochure Upload & AI Scanning (4:30)</h4>
              <p className="text-sm text-gray-600">Upload documents and extract specifications</p>
            </div>
            <Badge variant="outline">Intermediate</Badge>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <PlayCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Series Management (6:45)</h4>
              <p className="text-sm text-gray-600">Edit specifications and manage series data</p>
            </div>
            <Badge variant="outline">Advanced</Badge>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600" />
            Forklift Intelligence Platform - Help Center
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quick Start
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Tutorials
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="mt-6">
            <QuickStartGuide />
          </TabsContent>
          
          <TabsContent value="features" className="mt-6">
            <FeatureGuide />
          </TabsContent>
          
          <TabsContent value="bot" className="mt-6">
            <ChatBot />
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            <TutorialVideos />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}