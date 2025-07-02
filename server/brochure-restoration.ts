import { storage } from "./storage";
import { brochureScanner } from "./ai-brochure-scanner";
import fs from "fs";
import path from "path";

export class BrochureRestoration {
  async restoreAllBrochures(): Promise<{
    restored: number;
    failed: number;
    errors: string[];
  }> {
    const brochuresDir = path.join(process.cwd(), 'uploads/brochures');
    const files = fs.readdirSync(brochuresDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    let restored = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const filename of pdfFiles) {
      try {
        const filePath = path.join(brochuresDir, filename);
        const stats = fs.statSync(filePath);
        
        // Use AI to extract brand and model information
        const specs = await brochureScanner.scanBrochure(filePath, "Auto-detect", "Auto-detect");
        
        // Create brochure record
        await storage.uploadBrochure({
          brand: specs.brand,
          model: specs.model,
          filename: filename,
          originalName: `${specs.brand} ${specs.model} Brochure.pdf`,
          fileSize: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          fileUrl: `/uploads/brochures/${filename}`
        });
        
        // Update model specifications with metric values
        await storage.updateModelSpecificationsFromBrochure(specs.brand, specs.model, specs);
        
        restored++;
        console.log(`Restored: ${specs.brand} ${specs.model}`);
        
      } catch (error: any) {
        failed++;
        errors.push(`Failed to restore ${filename}: ${error.message}`);
        console.error(`Failed to restore ${filename}:`, error);
      }
    }
    
    return { restored, failed, errors };
  }
}

export const brochureRestoration = new BrochureRestoration();