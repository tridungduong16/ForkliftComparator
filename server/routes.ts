import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { brochureScanner } from "./ai-brochure-scanner";
import { dataMigration } from "./data-migration";
import { brochureRestoration } from "./brochure-restoration";
import { insertForkliftModelSchema, insertBrochureSchema, insertCompetitorQuoteSchema } from "@shared/schema";
// import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Quote Data Extraction Function
async function extractQuoteData(filePath: string, expectedBrand?: string): Promise<any> {
  try {
    const pdfParse = require('pdf-parse');
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a quote document analyzer. Extract structured data from forklift competitor quotes. Return JSON format with keys: competitorBrand, competitorModel, quotedPrice, quoteDate, powerType, capacity, warranty, supplierName, notes. If information is not found, use null. Focus on forklift equipment quotes.`
        },
        {
          role: "user",
          content: `Extract quote information from this document:\n\n${text}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const extracted = JSON.parse(response.choices[0].message.content || '{}');
    
    // Clean and format the extracted data
    return {
      competitorBrand: extracted.competitorBrand || expectedBrand || null,
      competitorModel: extracted.competitorModel || null,
      quotedPrice: extracted.quotedPrice || null,
      quoteDate: extracted.quoteDate || null,
      powerType: extracted.powerType || null,
      capacity: extracted.capacity || null,
      warranty: extracted.warranty || null,
      supplierName: extracted.supplierName || null,
      notes: extracted.notes || `AI extracted from ${path.basename(filePath)}`
    };
  } catch (error) {
    console.error('Quote extraction error:', error);
    return {};
  }
}

// Configure multer for file uploads
const brochureDir = path.join(process.cwd(), 'uploads/brochures');
const quotesDir = path.join(process.cwd(), 'uploads/quotes');

if (!fs.existsSync(brochureDir)) {
  fs.mkdirSync(brochureDir, { recursive: true });
}
if (!fs.existsSync(quotesDir)) {
  fs.mkdirSync(quotesDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use different directories based on field name
    if (file.fieldname === 'quote') {
      cb(null, quotesDir);
    } else {
      cb(null, brochureDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    // Allow PDFs for brochures and PDFs/images for quotes
    if (file.fieldname === 'quote') {
      if (file.mimetype === 'application/pdf' || 
          file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF and image files are allowed for quotes'));
      }
    } else {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for brochures'));
      }
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Test AI brochure scanning
  app.post("/api/test-ai-scan", async (req, res) => {
    try {
      console.log("Testing AI brochure scanning...");
      
      // Import the scanner dynamically
      const { brochureScanner } = await import('./ai-brochure-scanner.js');
      
      // Test with Toyota brochure
      const pdfPath = path.join(process.cwd(), 'uploads/brochures/brochure-1750071940153-841576755.pdf');
      
      const specs = await brochureScanner.scanBrochure(pdfPath, 'Toyota', '8FG FD Series', 'anthropic');
      
      res.json({
        success: true,
        message: "AI extraction successful",
        specifications: specs
      });
    } catch (error) {
      console.error("AI scanning error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get all forklift models
  app.get("/api/forklift-models", async (req, res) => {
    try {
      const models = await storage.getAllForkliftModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forklift models" });
    }
  });

  // Create new forklift model
  app.post("/api/forklift-models", async (req, res) => {
    try {
      const modelData = req.body;
      
      // Check for duplicates
      const existingModels = await storage.getAllForkliftModels();
      const duplicate = existingModels.find(m => 
        m.brand.toLowerCase() === modelData.brand.toLowerCase() && 
        m.model.toLowerCase().trim() === modelData.model.toLowerCase().trim()
      );
      
      if (duplicate) {
        return res.status(400).json({ 
          message: "Duplicate series not allowed",
          error: `${modelData.brand} ${modelData.model} already exists`
        });
      }
      
      const result = await storage.updateOrCreateModel(modelData);
      res.json({ 
        success: true, 
        message: "Model created successfully",
        result 
      });
    } catch (error) {
      console.error("Error creating model:", error);
      res.status(500).json({ 
        message: "Failed to create model",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get forklift models by brand
  app.get("/api/forklift-models/brand/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      const models = await storage.getForkliftModelsByBrand(brand);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models by brand" });
    }
  });

  // Get multiple forklift models by IDs for comparison
  app.post("/api/forklift-models/compare", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ message: "IDs must be an array" });
      }
      const models = await storage.getForkliftModelsByIds(ids);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models for comparison" });
    }
  });

  // Search forklift models
  app.get("/api/forklift-models/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      const models = await storage.searchForkliftModels(q);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to search forklift models" });
    }
  });

  // Filter forklift models
  app.get("/api/forklift-models/filter", async (req, res) => {
    try {
      const { capacityRange, powerType } = req.query;
      const models = await storage.filterForkliftModels(
        capacityRange as string,
        powerType as string
      );
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter forklift models" });
    }
  });



  app.get("/api/brochures", async (req, res) => {
    try {
      const brochures = await storage.getAllBrochures();
      res.json(brochures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brochures" });
    }
  });

  app.get("/api/brochures/brand/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      const brochures = await storage.getBrochuresByBrand(brand);
      res.json(brochures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brochures by brand" });
    }
  });

  app.get("/api/brochures/:brand/:model", async (req, res) => {
    try {
      const { brand, model } = req.params;
      const brochures = await storage.getBrochuresByModel(brand, model);
      res.json(brochures);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brochures by model" });
    }
  });

  // Standard brochure upload endpoint
  app.post("/api/brochures", upload.single('brochure'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { brand, model } = req.body;
      if (!brand || !model) {
        return res.status(400).json({ error: "Brand and model are required" });
      }

      // Store brochure info
      const brochure = await storage.uploadBrochure({
        brand: brand,
        model: model,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString(),
        fileUrl: `/uploads/brochures/${req.file.filename}`
      });

      res.json({ 
        success: true, 
        brochure,
        message: "Brochure uploaded successfully"
      });
    } catch (error) {
      console.error("Brochure upload error:", error);
      res.status(500).json({ error: "Failed to upload brochure" });
    }
  });

  // Serve brochure files for download
  app.get("/uploads/brochures/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'uploads', 'brochures', filename);
    
    // Check if file exists
    if (fs.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.delete("/api/brochures/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBrochure(id);
      if (success) {
        res.json({ message: "Brochure deleted successfully" });
      } else {
        res.status(404).json({ message: "Brochure not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete brochure" });
    }
  });

  app.delete("/api/forklift-models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteForkliftModel(id);
      
      if (success) {
        res.json({ message: "Model deleted successfully" });
      } else {
        res.status(404).json({ message: "Model not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete model" });
    }
  });

  app.patch("/api/forklift-models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const success = await storage.updateForkliftModel(id, updates);
      
      if (success) {
        res.json({ message: "Model updated successfully" });
      } else {
        res.status(404).json({ message: "Model not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  // PUT route for updating forklift models (for drag and drop)
  app.put("/api/forklift-models/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const success = await storage.updateForkliftModel(id, updates);
      
      if (success) {
        res.json({ message: "Model updated successfully" });
      } else {
        res.status(404).json({ message: "Model not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  // Update model sort order (for drag-and-drop reordering)
  app.patch("/api/forklift-models/reorder", async (req, res) => {
    try {
      const { brand, orderUpdates } = req.body;
      
      // Update each model's sort order without changing tier data
      for (const update of orderUpdates) {
        await storage.updateForkliftModel(update.id, { sortOrder: update.sortOrder });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating model order:", error);
      res.status(500).json({ error: "Failed to update model order" });
    }
  });

  // Fix Linde series - remove duplicates and keep only 4 correct series
  app.post("/api/fix-linde-series", async (req, res) => {
    try {
      // Get all models and find Linde ones to delete
      const allModels = await storage.getAllForkliftModels();
      const lindeModels = allModels.filter(m => m.brand === "Linde");
      
      // Delete all existing Linde models
      for (const model of lindeModels) {
        await storage.deleteForkliftModel(model.id);
      }
      
      // Add the correct 4 Linde series
      const correctLindeSeries = [
        {
          brand: "Linde",
          model: "Baoli Series",
          tier: "ENTRY",
          loadCapacity: 2500,
          liftHeight: 180,
          powerType: "LPG/Diesel",
          operatingWeight: 3500,
          turnRadius: 78,
          travelSpeed: "10.5",
          priceRangeMin: 28000,
          priceRangeMax: 34000,
          warranty: 12,
          availability: "In Stock",
          overallScore: "7.2",
          capacityRange: "2000-3500 kg",
          brochureUrl: null
        },
        {
          brand: "Linde",
          model: "HT Series",
          tier: "MID",
          loadCapacity: 2750,
          liftHeight: 185,
          powerType: "LPG/Diesel",
          operatingWeight: 3700,
          turnRadius: 80,
          travelSpeed: "11.0",
          priceRangeMin: 36000,
          priceRangeMax: 42000,
          warranty: 18,
          availability: "2-3 weeks",
          overallScore: "8.0",
          capacityRange: "2000-3500 kg",
          brochureUrl: null
        },
        {
          brand: "Linde",
          model: "H Series",
          tier: "PREMIUM",
          loadCapacity: 3000,
          liftHeight: 190,
          powerType: "LPG/Diesel",
          operatingWeight: 3850,
          turnRadius: 82,
          travelSpeed: "12.0",
          priceRangeMin: 48000,
          priceRangeMax: 54000,
          warranty: 24,
          availability: "4-5 weeks",
          overallScore: "8.6",
          capacityRange: "2000-3500 kg",
          brochureUrl: null
        },
        {
          brand: "Linde",
          model: "P Series",
          tier: "SUPERHEAVY",
          loadCapacity: 3500,
          liftHeight: 195,
          powerType: "LPG/Diesel",
          operatingWeight: 4100,
          turnRadius: 86,
          travelSpeed: "12.5",
          priceRangeMin: 60000,
          priceRangeMax: 70000,
          warranty: 36,
          availability: "6-8 weeks",
          overallScore: "9.0",
          capacityRange: "2000-3500 kg",
          brochureUrl: null
        }
      ];
      
      // Create the correct models
      for (const modelData of correctLindeSeries) {
        await storage.updateOrCreateModel(modelData);
      }
      
      res.json({ success: true, message: "Linde series fixed - now shows only 4 correct series" });
    } catch (error) {
      console.error("Error fixing Linde series:", error);
      res.status(500).json({ error: "Failed to fix Linde series" });
    }
  });

  app.put("/api/forklift-models/:id/brochure", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const { brochureUrl } = req.body;
      
      const success = await storage.updateModelBrochureUrl(modelId, brochureUrl);
      if (success) {
        res.json({ message: "Model brochure URL updated successfully" });
      } else {
        res.status(404).json({ message: "Model not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update model brochure URL" });
    }
  });

  // Import specification data
  app.post("/api/specifications/import", async (req, res) => {
    try {
      const { specifications } = req.body;
      if (!specifications || !Array.isArray(specifications)) {
        return res.status(400).json({ message: "Valid specifications array is required" });
      }

      const success = await storage.importSpecificationData(specifications);
      if (success) {
        res.json({ 
          message: "Specifications imported successfully", 
          count: specifications.length 
        });
      } else {
        res.status(500).json({ message: "Failed to import specifications" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to import specifications" });
    }
  });

  app.put("/api/forklift-models/:id/specifications", async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      const specifications = req.body;
      
      const success = await storage.updateModelSpecifications(modelId, specifications);
      if (success) {
        res.json({ message: "Model specifications updated successfully" });
      } else {
        res.status(404).json({ message: "Model not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update model specifications" });
    }
  });

  // Smart brochure upload endpoint with AI extraction
  app.post("/api/brochures/smart-upload", upload.single('brochure'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Process brochure with AI to extract brand and model
      try {
        const specs = await brochureScanner.scanBrochure(
          req.file.path,
          "Auto-detect", // Let AI determine brand
          "Auto-detect"  // Let AI determine model
        );

        // Store brochure info with AI-extracted data
        const brochure = await storage.uploadBrochure({
          brand: specs.brand,
          model: specs.model,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: new Date().toISOString(),
          fileUrl: `/uploads/brochures/${req.file.filename}`
        });

        // Update model specifications in database
        await storage.updateModelSpecificationsFromBrochure(specs.brand, specs.model, specs);

        res.json({ 
          success: true, 
          brand: specs.brand,
          model: specs.model,
          brochure,
          specifications: specs,
          message: `AI extracted and processed: ${specs.brand} ${specs.model}`
        });
      } catch (aiError: any) {
        console.error("AI processing failed:", aiError);
        res.status(500).json({ error: `AI processing failed: ${aiError.message}` });
      }
    } catch (error) {
      console.error("Smart upload error:", error);
      res.status(500).json({ error: "Failed to process brochure" });
    }
  });

  // Data migration endpoint for series-based management
  app.get("/api/data/migration-status", async (req, res) => {
    try {
      const report = await dataMigration.runMigrationReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate migration report" });
    }
  });

  app.post("/api/data/migrate", async (req, res) => {
    try {
      const report = await dataMigration.runMigrationReport();
      res.json({ 
        success: true, 
        message: "Migration completed successfully",
        report 
      });
    } catch (error) {
      res.status(500).json({ message: "Migration failed" });
    }
  });

  app.post("/api/data/restore-brochures", async (req, res) => {
    try {
      const result = await brochureRestoration.restoreAllBrochures();
      res.json({ 
        success: true, 
        message: "Brochure restoration completed",
        result 
      });
    } catch (error) {
      res.status(500).json({ message: "Brochure restoration failed" });
    }
  });

  // Competitor quote management endpoints
  app.post("/api/competitor-quotes", upload.single('quote'), async (req, res) => {
    try {
      // Handle both file upload and JSON data
      let quoteData;
      
      if (req.file) {
        // File upload with form data - use quotes directory
        const fileUrl = `/uploads/quotes/${req.file.filename}`;
        
        // Try to extract information from the quote document using AI
        let extractedData = {};
        try {
          if (req.file.mimetype === 'application/pdf') {
            extractedData = await extractQuoteData(req.file.path, req.body.competitorBrand);
          }
        } catch (error) {
          console.warn("Quote AI extraction failed, using manual data:", error);
        }
        
        quoteData = {
          brand: req.body.brand,
          model: req.body.model,
          competitorBrand: req.body.competitorBrand || extractedData.competitorBrand,
          competitorModel: req.body.competitorModel || extractedData.competitorModel,
          quotedPrice: req.body.quotedPrice || extractedData.quotedPrice,
          quoteDate: req.body.quoteDate || extractedData.quoteDate,
          powerType: req.body.powerType || extractedData.powerType,
          notes: req.body.notes || extractedData.notes,
          status: req.body.status || 'active',
          uploadedAt: new Date().toISOString(),
          filename: req.file.filename,
          fileUrl: fileUrl,
          // Additional extracted fields
          ...extractedData
        };
      } else {
        // JSON data without file
        quoteData = {
          ...req.body,
          uploadedAt: new Date().toISOString()
        };
      }
      
      const validatedData = insertCompetitorQuoteSchema.parse(quoteData);
      const quote = await storage.addCompetitorQuote(validatedData);
      res.json(quote);
    } catch (error) {
      console.error("Competitor quote upload error:", error);
      res.status(400).json({ message: "Invalid quote data" });
    }
  });

  app.get("/api/competitor-quotes", async (req, res) => {
    try {
      const { brand, model } = req.query;
      
      if (brand && model) {
        const quotes = await storage.getCompetitorQuotesByModel(
          brand as string, 
          model as string
        );
        res.json(quotes);
      } else {
        const quotes = await storage.getAllCompetitorQuotes();
        res.json(quotes);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch competitor quotes" });
    }
  });

  app.put("/api/competitor-quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const success = await storage.updateCompetitorQuote(id, updateData);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Quote not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete("/api/competitor-quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCompetitorQuote(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Quote not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Brand management endpoint
  app.post("/api/brands", async (req, res) => {
    try {
      const { name, country, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      // Create a placeholder model for the new brand to establish it in the system
      const newBrandModel = {
        brand: name,
        model: `${name} Series`,
        tier: 'ENTRY',
        loadCapacity: 2500,
        liftHeight: 3000,
        powerType: 'LPG/Diesel',
        operatingWeight: 4000,
        turnRadius: 2200,
        travelSpeed: '20 km/h',
        priceRangeMin: 45000,
        priceRangeMax: 55000,
        warranty: 12,
        overallScore: 'B+',
        capacityRange: '2000-3500 kg',
        brochureUrl: null
      };

      const result = await storage.updateOrCreateModel(newBrandModel);
      
      res.json({ 
        success: true,
        brand: name,
        model: newBrandModel.model,
        message: `Brand ${name} added successfully`
      });
    } catch (error) {
      console.error("Add brand error:", error);
      res.status(500).json({ message: "Failed to add brand" });
    }
  });

  // Bulk model update endpoint
  app.post("/api/forklift-models/bulk-update", async (req, res) => {
    try {
      const { models } = req.body;
      if (!Array.isArray(models)) {
        return res.status(400).json({ message: "Models array is required" });
      }

      let updated = 0;
      let created = 0;

      for (const modelData of models) {
        const success = await storage.updateOrCreateModel(modelData);
        if (success.created) {
          created++;
        } else if (success.updated) {
          updated++;
        }
      }

      res.json({ 
        success: true, 
        updated, 
        created,
        total: models.length,
        message: `Processed ${models.length} models: ${updated} updated, ${created} created`
      });
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).json({ message: "Failed to bulk update models" });
    }
  });

  // Series navigation routes
  app.get("/api/series/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      const models = await storage.getForkliftModelsByBrand(brand);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch series by brand" });
    }
  });

  app.get("/api/series/:brand/:series", async (req, res) => {
    try {
      const { brand, series } = req.params;
      const decodedSeries = decodeURIComponent(series.replace(/-/g, ' '));
      
      const allModels = await storage.getForkliftModelsByBrand(brand);
      const seriesModels = allModels.filter(model => {
        const normalizedModelName = model.model.toLowerCase().replace(/[-\s]+/g, ' ').trim();
        const normalizedSeriesName = decodedSeries.toLowerCase().replace(/[-\s]+/g, ' ').trim();
        
        return normalizedModelName.includes(normalizedSeriesName) ||
               normalizedSeriesName.includes(normalizedModelName) ||
               (model.series && model.series.toLowerCase().includes(normalizedSeriesName));
      });
      
      res.json(seriesModels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch series models" });
    }
  });

  // AI Insights endpoint
  app.post('/api/generate-insights', async (req, res) => {
    try {
      const { models }: { models: any[] } = req.body;

      if (!models || models.length === 0) {
        return res.status(400).json({ error: 'No models provided for comparison' });
      }

      // Generate insights for each model
      const insights = [];

      for (const model of models) {
        const insight = {
          model: model.model,
          brand: model.brand,
          strengths: `${model.tier} tier positioning with ${model.loadCapacity}kg capacity and ${model.powerType} power options. Strong reliability with ${model.warranty}-month warranty.`,
          weaknesses: model.tier === 'ENTRY' ? 'Limited advanced features compared to premium models' : 
                     model.tier === 'PREMIUM' ? 'Higher price point may limit market reach' :
                     'Mid-range positioning requires clear differentiation',
          competitiveAdvantage: `Proven performance in ${model.capacityRange} capacity range with excellent ${model.availability} availability`,
          talkTrack: `Emphasize ${model.warranty}-month warranty, proven reliability, and strong resale value. Highlight ${model.powerType} flexibility and ${model.overallScore} performance rating.`,
          pricePosition: `Competitive pricing at $${model.priceRangeMin?.toLocaleString()}-$${model.priceRangeMax?.toLocaleString()} delivers strong value in ${model.tier.toLowerCase()} segment`
        };
        insights.push(insight);
      }

      res.json({ insights, totalModels: models.length });

    } catch (error) {
      console.error('Error generating insights:', error);
      res.status(500).json({ 
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
