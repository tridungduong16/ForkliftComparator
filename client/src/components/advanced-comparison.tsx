import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Settings, Info, TrendingUp, AlertCircle } from "lucide-react";
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation } from '@tanstack/react-query';
import { HelpMenu } from './help-menu';
import type { ForkliftModel } from '@shared/schema';

interface SortableItemProps {
  id: string;
  model: ForkliftModel;
  selected: ForkliftModel[];
  onSelect: (model: ForkliftModel) => void;
}

function SortableItem({ id, model, selected, onSelect }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isSelected = selected.some(m => m.id === model.id);
  
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
        isSelected ? "border-blue-600 bg-blue-50 dark:bg-blue-950" : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onSelect(model)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{model.brand} – {model.model}</h3>
            <Badge variant={
              model.tier === 'ENTRY' ? 'secondary' :
              model.tier === 'MID' ? 'default' :
              model.tier === 'PREMIUM' ? 'destructive' : 'outline'
            }>
              {model.tier}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Power:</strong> {model.powerType}</p>
          <p><strong>Capacity:</strong> {model.loadCapacity}kg</p>
          <p><strong>Lift Height:</strong> {model.liftHeight}cm</p>
          <p><strong>Price Range:</strong> ${model.priceRangeMin?.toLocaleString()} - ${model.priceRangeMax?.toLocaleString()}</p>
          <p><strong>Warranty:</strong> {model.warranty} months</p>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">Score: {model.overallScore}</span>
          <span className={`text-xs px-2 py-1 rounded ${
            model.availability === 'In Stock' ? 'bg-green-100 text-green-800' :
            model.availability?.includes('weeks') ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {model.availability}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonInsight {
  model: string;
  brand: string;
  strengths: string;
  weaknesses: string;
  talkTrack: string;
  competitiveAdvantage: string;
  pricePosition: string;
}

export default function AdvancedComparison() {
  const [selectedModels, setSelectedModels] = useState<ForkliftModel[]>([]);
  const [insights, setInsights] = useState<ComparisonInsight[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { data: models = [], isLoading } = useQuery<ForkliftModel[]>({
    queryKey: ['/api/forklift-models'],
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async (selectedModels: ForkliftModel[]) => {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: selectedModels })
      });
      return response.json();
    },
    onSuccess: (data) => {
      setInsights(data.insights || []);
    }
  });

  const handleModelSelect = (model: ForkliftModel) => {
    setSelectedModels(prev => {
      const isSelected = prev.some(m => m.id === model.id);
      if (isSelected) {
        return prev.filter(m => m.id !== model.id);
      } else {
        return [...prev, model];
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = selectedModels.findIndex(m => m.id.toString() === active.id);
      const newIndex = selectedModels.findIndex(m => m.id.toString() === over?.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setSelectedModels(arrayMove(selectedModels, oldIndex, newIndex));
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Here you would typically upload the file to your server
      console.log('File uploaded:', file.name);
    }
  };

  const generateInsights = () => {
    if (selectedModels.length > 0) {
      generateInsightsMutation.mutate(selectedModels);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          FORKLIFT INTELLIGENCE PORTAL
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Select competitor models to compare. Drag to reorder. Upload brochures for AI insights.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <Button 
          onClick={generateInsights}
          disabled={selectedModels.length === 0 || generateInsightsMutation.isPending}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          {generateInsightsMutation.isPending ? 'Generating...' : 'Generate AI Insights'}
        </Button>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <Button variant="outline" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Upload Brochure
            </span>
          </Button>
          <Input 
            type="file" 
            className="hidden" 
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
        </label>

        {uploadedFile && (
          <Badge variant="outline" className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            {uploadedFile.name}
          </Badge>
        )}
      </div>

      {selectedModels.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Selected Models ({selectedModels.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedModels.map(model => (
              <Badge key={model.id} variant="default" className="px-3 py-1">
                {model.brand} {model.model}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext 
          items={models.map(m => m.id.toString())} 
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map(model => (
              <SortableItem
                key={model.id}
                id={model.id.toString()}
                model={model}
                selected={selectedModels}
                onSelect={handleModelSelect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {insights.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4">AI-Generated Comparison Insights</h3>
          <div className="grid gap-6">
            {insights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {insight.brand} {insight.model}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-1">Strengths</h4>
                      <p className="text-sm text-gray-700">{insight.strengths}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 mb-1">Weaknesses</h4>
                      <p className="text-sm text-gray-700">{insight.weaknesses}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-1">Competitive Advantage</h4>
                    <p className="text-sm text-gray-700">{insight.competitiveAdvantage}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-purple-700 mb-1">Sales Talk Track</h4>
                    <p className="text-sm text-gray-700 italic">{insight.talkTrack}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-1">Price Position</h4>
                    <p className="text-sm text-gray-700">{insight.pricePosition}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <HelpMenu />
    </div>
  );
}