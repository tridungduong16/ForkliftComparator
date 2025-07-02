import { storage } from "./storage";
import type { Brochure, ForkliftModel } from "@shared/schema";

/**
 * Migration utility to ensure all existing brochures remain accessible
 * in the new series-based management system
 */
export class DataMigration {
  
  /**
   * Verify all brochures are properly linked to their models
   */
  async verifyBrochureIntegrity(): Promise<{
    totalBrochures: number;
    linkedBrochures: number;
    unlinkedBrochures: Brochure[];
    modelCoverage: Record<string, { hasModels: boolean; hasBrochures: boolean }>;
  }> {
    const allBrochures = await storage.getAllBrochures();
    const allModels = await storage.getAllForkliftModels();
    
    // Group models by brand for coverage analysis
    const brandCoverage: Record<string, { hasModels: boolean; hasBrochures: boolean }> = {};
    
    // Initialize brand coverage
    allModels.forEach(model => {
      if (!brandCoverage[model.brand]) {
        brandCoverage[model.brand] = { hasModels: true, hasBrochures: false };
      }
    });
    
    // Mark brands that have brochures
    allBrochures.forEach(brochure => {
      if (brandCoverage[brochure.brand]) {
        brandCoverage[brochure.brand].hasBrochures = true;
      } else {
        brandCoverage[brochure.brand] = { hasModels: false, hasBrochures: true };
      }
    });
    
    // Find models that should have brochure links
    const linkedBrochures = allBrochures.filter(brochure => {
      return allModels.some(model => 
        model.brand.toLowerCase() === brochure.brand.toLowerCase() &&
        (model.model.toLowerCase().includes(brochure.model.toLowerCase()) ||
         brochure.model.toLowerCase().includes(model.model.toLowerCase()))
      );
    });
    
    const unlinkedBrochures = allBrochures.filter(brochure => {
      return !allModels.some(model => 
        model.brand.toLowerCase() === brochure.brand.toLowerCase() &&
        (model.model.toLowerCase().includes(brochure.model.toLowerCase()) ||
         brochure.model.toLowerCase().includes(model.model.toLowerCase()))
      );
    });
    
    return {
      totalBrochures: allBrochures.length,
      linkedBrochures: linkedBrochures.length,
      unlinkedBrochures,
      modelCoverage: brandCoverage
    };
  }
  
  /**
   * Update model brochure URLs to ensure proper linking
   */
  async linkBrochuresToModels(): Promise<{
    updatedModels: number;
    skippedModels: number;
    errors: string[];
  }> {
    const allBrochures = await storage.getAllBrochures();
    const allModels = await storage.getAllForkliftModels();
    
    let updatedModels = 0;
    let skippedModels = 0;
    const errors: string[] = [];
    
    for (const model of allModels) {
      try {
        // Find matching brochure for this model
        const matchingBrochure = allBrochures.find(brochure => 
          brochure.brand.toLowerCase() === model.brand.toLowerCase() &&
          (model.model.toLowerCase().includes(brochure.model.toLowerCase()) ||
           brochure.model.toLowerCase().includes(model.model.toLowerCase()) ||
           this.isSeriesMatch(model.model, brochure.model))
        );
        
        if (matchingBrochure && !model.brochureUrl) {
          const success = await storage.updateModelBrochureUrl(model.id, matchingBrochure.fileUrl);
          if (success) {
            updatedModels++;
          } else {
            errors.push(`Failed to update model ${model.brand} ${model.model}`);
          }
        } else {
          skippedModels++;
        }
      } catch (error) {
        errors.push(`Error processing model ${model.brand} ${model.model}: ${error}`);
      }
    }
    
    return {
      updatedModels,
      skippedModels,
      errors
    };
  }
  
  /**
   * Check if a model and brochure belong to the same series
   */
  private isSeriesMatch(modelName: string, brochureName: string): boolean {
    // Extract series patterns (e.g., "8FG" from "8FG20", "NXP" from "NXP25")
    const modelSeries = modelName.replace(/\d+.*$/, '').trim();
    const brochureSeries = brochureName.replace(/\d+.*$/, '').trim();
    
    return modelSeries.toLowerCase() === brochureSeries.toLowerCase() && modelSeries.length > 1;
  }
  
  /**
   * Generate series mapping for the new interface
   */
  async generateSeriesMapping(): Promise<Record<string, {
    series: string[];
    models: ForkliftModel[];
    brochures: Brochure[];
  }>> {
    const allModels = await storage.getAllForkliftModels();
    const allBrochures = await storage.getAllBrochures();
    
    const brandMapping: Record<string, {
      series: string[];
      models: ForkliftModel[];
      brochures: Brochure[];
    }> = {};
    
    // Group models by brand and extract series
    allModels.forEach(model => {
      if (!brandMapping[model.brand]) {
        brandMapping[model.brand] = {
          series: [],
          models: [],
          brochures: []
        };
      }
      
      brandMapping[model.brand].models.push(model);
      
      // Extract series name (first part before numbers)
      const seriesName = model.model.replace(/\d+.*$/, '').trim() || model.model.split(' ')[0];
      if (!brandMapping[model.brand].series.includes(seriesName)) {
        brandMapping[model.brand].series.push(seriesName);
      }
    });
    
    // Add brochures to brand mapping
    allBrochures.forEach(brochure => {
      if (brandMapping[brochure.brand]) {
        brandMapping[brochure.brand].brochures.push(brochure);
      } else {
        // Handle brochures for brands not in models
        brandMapping[brochure.brand] = {
          series: [],
          models: [],
          brochures: [brochure]
        };
      }
    });
    
    return brandMapping;
  }
  
  /**
   * Run complete migration check and report
   */
  async runMigrationReport(): Promise<{
    integrity: any;
    linking: any;
    seriesMapping: any;
    recommendations: string[];
  }> {
    const integrity = await this.verifyBrochureIntegrity();
    const linking = await this.linkBrochuresToModels();
    const seriesMapping = await this.generateSeriesMapping();
    
    const recommendations: string[] = [];
    
    if (integrity.unlinkedBrochures.length > 0) {
      recommendations.push(`${integrity.unlinkedBrochures.length} brochures need manual model matching`);
    }
    
    if (linking.errors.length > 0) {
      recommendations.push(`${linking.errors.length} linking errors need attention`);
    }
    
    if (linking.updatedModels > 0) {
      recommendations.push(`Successfully linked ${linking.updatedModels} models to brochures`);
    }
    
    return {
      integrity,
      linking,
      seriesMapping,
      recommendations
    };
  }
}

export const dataMigration = new DataMigration();