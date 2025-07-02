import { Button } from "@/components/ui/button";
import { Settings, HelpCircle, Download } from "lucide-react";
import { Link } from "wouter";
import chanaxyLogo from "@/assets/chanaxy-logo.png";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-industrial-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center">
                <img 
                  src={chanaxyLogo} 
                  alt="Chanaxy.ai" 
                  className="h-12 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
                />
              </Link>
              <div className="flex items-center">
                <Settings className="text-primary text-2xl mr-2" />
                <h1 className="text-xl font-bold text-industrial-900">Forklift Intelligence</h1>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-industrial-700 hover:text-industrial-900 transition-colors">
              All Models
            </Link>
            <Link href="/pricing-intelligence" className="px-3 py-2 text-sm font-medium text-industrial-700 hover:text-industrial-900 transition-colors">
              Pricing Intelligence
            </Link>
            <Link href="/bulk-import" className="px-3 py-2 text-sm font-medium text-industrial-700 hover:text-industrial-900 transition-colors">
              Bulk Import
            </Link>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-800">AI Insights Available</span>
            </div>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-industrial-600 hover:text-industrial-800">
              <HelpCircle className="w-4 h-4 mr-1" />
              Help
            </Button>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
