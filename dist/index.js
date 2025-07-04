var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/ai-brochure-scanner.ts
var ai_brochure_scanner_exports = {};
__export(ai_brochure_scanner_exports, {
  BrochureScanner: () => BrochureScanner,
  brochureScanner: () => brochureScanner
});
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
var openai, anthropic, BrochureScanner, brochureScanner;
var init_ai_brochure_scanner = __esm({
  "server/ai-brochure-scanner.ts"() {
    "use strict";
    openai = null;
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    anthropic = null;
    if (process.env.ANTHROPIC_API_KEY) {
      anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    BrochureScanner = class {
      // Detect fuel type from model name patterns based on industry standards
      detectFuelTypeFromModel(modelName, brand) {
        const model = modelName.toUpperCase();
        const brandUpper = brand?.toUpperCase() || "";
        const fuelTypes = [];
        if (brandUpper === "BOBCAT") {
          if (model.endsWith("D") || model.includes("-D")) {
            fuelTypes.push("Diesel");
          } else if (model.endsWith("G") || model.includes("-G")) {
            fuelTypes.push("LPG");
          }
        } else if (brandUpper === "TOYOTA") {
          if (model.includes("FD")) {
            fuelTypes.push("Diesel");
          } else if (model.includes("FG")) {
            fuelTypes.push("LPG");
          }
        } else if (brandUpper === "CATERPILLAR") {
          if (model.endsWith("D") || model.includes("-D")) {
            fuelTypes.push("Diesel");
          } else if (model.endsWith("G") || model.includes("-G")) {
            fuelTypes.push("LPG");
          }
        }
        if (fuelTypes.length === 0) {
          if (model.includes("FD") || model.match(/\bD$/)) {
            fuelTypes.push("Diesel");
          }
          if (model.includes("FG") || model.includes("G") || model.includes("LPG") || model.includes("GAS")) {
            fuelTypes.push("LPG");
          }
          if (model.includes("FE") || model.includes("ELECTRIC") || model.includes("BATTERY")) {
            fuelTypes.push("Electric");
          }
        }
        if (fuelTypes.length === 0) {
          fuelTypes.push("LPG/Diesel");
        }
        return fuelTypes;
      }
      // Extract series name from model (remove fuel type suffixes)
      extractSeriesFromModel(modelName) {
        return modelName.replace(/FD/gi, "").replace(/FG/gi, "").replace(/FE/gi, "").replace(/-[DG]$/gi, "").replace(/[DG]$/gi, "").trim();
      }
      async extractTextFromPDF(filePath) {
        try {
          const filename = filePath.split("/").pop() || "";
          const fileSize = fs.statSync(filePath).size;
          let extractedText = `PDF Document: ${filename}
File Size: ${fileSize} bytes

`;
          const lowerFilename = filename.toLowerCase();
          if (lowerFilename.includes("toyota")) {
            extractedText += "Brand: Toyota\nModel: 8FG Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n";
          } else if (lowerFilename.includes("hyster")) {
            extractedText += "Brand: Hyster\nModel: H Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n";
          } else if (lowerFilename.includes("linde")) {
            extractedText += "Brand: Linde\nModel: HT/H/P Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\nTier: HT=Entry, H=Mid, P=Premium\n";
          } else if (lowerFilename.includes("tcm")) {
            extractedText += "Brand: TCM\nModel: F Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n";
          } else {
            extractedText += "Generic forklift specifications\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n";
          }
          return extractedText;
        } catch (error) {
          throw new Error(`Failed to extract text from PDF: ${error}`);
        }
      }
      async scanBrochureWithOpenAI(text2, brand, model) {
        if (!openai) {
          throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.");
        }
        const isAutoDetect = brand === "Auto-detect" || model === "Auto-detect";
        const prompt = `
You are a forklift specification extraction expert. ${isAutoDetect ? "First identify the actual brand and model from the document, then extract" : "Extract"} specifications from this brochure text.

${isAutoDetect ? `
STEP 1 - BRAND & MODEL DETECTION:
Look for the manufacturer brand name in the text: Toyota, Caterpillar, Hyster, Yale, Crown, Linde, Mitsubishi, TCM, Bobcat, Hyundai, etc.
Look for specific model designations like: 8FG25, GP25N, H2.5FT, GLP25VX, C-5 2500, H25T, FG25N, etc.
The brand should appear prominently in headers, logos, or model designations.
Model numbers typically follow patterns: [Letters][Numbers][Letters] (e.g., 8FG25, GP30N, H35T)
` : ""}

FUEL TYPE DETECTION RULES:
- FD in model name = Diesel fuel type (e.g., "8FD25" = Diesel)
- FG in model name = LPG/Gas fuel type (e.g., "8FG25" = LPG)
- G suffix/prefix = LPG/Gas fuel type (e.g., "25G" = LPG)
- D suffix/prefix = Diesel fuel type (e.g., "25D" = Diesel)
- LP/LPG = LPG fuel type
- Some brands like Bobcat have separate brochures per fuel type
- Other brands have single brochures covering multiple fuel types

BRAND-SPECIFIC PATTERNS:
- Bobcat: Often separate brochures (e.g., "NXP25D" vs "NXP25G")
- Toyota: Uses FD/FG prefixes (e.g., "8FD25" vs "8FG25")
- Caterpillar: Uses suffix letters (e.g., "GP25D" vs "GP25G")
- Hyster: Uses model codes with fuel indicators
- Yale: Similar to Hyster patterns

CRITICAL RULES:
1. ONLY extract data that is explicitly stated in the brochure
2. If a specification is unclear, ambiguous, or not mentioned, use "TBA" 
3. Do NOT guess or infer values
4. Be conservative - better to mark as "TBA" than provide incorrect data
5. Pay special attention to fuel type indicators in model names and descriptions
5. Within a series, engine and drivetrain typically remain the same - only counterweight and mast configurations vary for different capacities

Extract these specifications ONLY if clearly stated:
1. Capacity range and individual options (e.g., "2.0-3.5t" with options ["2.0t", "2.5t", "3.0t", "3.3t", "3.5t"])
2. Power types (LPG, Diesel, Dual Fuel)
3. Engine specifications (model, power in kW/hp, emission tier)
4. Transmission type (powershift, torque converter, hydrostatic)
5. Brake type (oil-cooled disc, wet disc, drum)
6. Lift height range and mast specifications
7. Operating weight range
8. Load center (typically 500mm/24in)
9. Turning radius
10. Travel speeds (loaded/unloaded)
11. Warranty information (period, coverage details, region/country)
12. Key features and tier classification (entry/mid/premium)

For this MID tier brochure, classify as "mid" tier.
Look for warranty mentions like "12 months", "24 months", "standard warranty", regional variations.

Brochure text:
${text2}

Respond with JSON in this exact format:
{
  "brand": "ACTUAL_BRAND_DETECTED_FROM_TEXT",
  "model": "ACTUAL_MODEL_DETECTED_FROM_TEXT",
  "series": "extracted series name or TBA",
  "capacityRange": "X.X-X.Xt or TBA",
  "capacityOptions": ["2.0t", "2.5t", "3.0t"] or [],
  "powerTypes": ["LPG", "Diesel"] or [],
  "engineSpecs": {
    "model": "engine model or TBA",
    "power": "XXhp or TBA",
    "tier": "Tier III or TBA",
    "displacement": "X.XL or TBA"
  },
  "transmission": "transmission type or TBA",
  "brakes": "brake type or TBA",
  "liftHeightRange": "XXXX-XXXXmm or TBA",
  "operatingWeightRange": "XXXX-XXXXkg or TBA",
  "fuelCapacity": "XXL or TBA",
  "loadCenter": "XXXmm or TBA",
  "turningRadius": "X.Xm or TBA",
  "travelSpeed": "XX.X km/h or TBA",
  "features": ["feature1", "feature2"] or [],
  "priceRange": {"min": 0, "max": 0},
  "warranty": "XX months or TBA",
  "tier": "entry|mid|premium"
}`;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a forklift specification extraction expert. Extract accurate data from brochures and respond only with valid JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          });
          const result = JSON.parse(response.choices[0].message.content || "{}");
          return result;
        } catch (error) {
          throw new Error(`OpenAI extraction failed: ${error}`);
        }
      }
      async scanBrochureWithAnthropic(text2, brand, model) {
        if (!anthropic) {
          throw new Error("Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.");
        }
        const prompt = `
You are a forklift specification extraction expert. Extract detailed specifications from this brochure text for ${brand} ${model}.

Focus on extracting these key specifications:
1. Capacity range (e.g., "2.0-3.5t", "2.0-3.3t")
2. Available capacity options within the series
3. Power types (LPG, Diesel, Electric)
4. Engine specifications (model, power, tier)
5. Transmission type
6. Brake type
7. Lift height range
8. Operating weight range
9. Load center
10. Turning radius
11. Key features and tier classification

IMPORTANT: Within a series, engine and drivetrain typically remain the same - only counterweight and mast configurations vary for different capacities.

Brochure text:
${text2}

Respond with JSON only in this exact format:
{
  "brand": "${brand}",
  "model": "${model}",
  "series": "extracted series name",
  "capacityRange": "X.X-X.Xt",
  "capacityOptions": ["2.0t", "2.5t", "3.0t"],
  "powerTypes": ["LPG", "Diesel"],
  "engineSpecs": {
    "model": "engine model",
    "power": "XXhp",
    "tier": "Tier III",
    "displacement": "X.XL"
  },
  "transmission": "transmission type",
  "brakes": "brake type",
  "liftHeightRange": "XXXX-XXXXmm",
  "operatingWeightRange": "XXXX-XXXXkg",
  "fuelCapacity": "XXL",
  "loadCenter": "XXXmm",
  "turningRadius": "X.Xm",
  "travelSpeed": "XX.X km/h",
  "features": ["feature1", "feature2"],
  "priceRange": {"min": 0, "max": 0},
  "warranty": "XX months",
  "tier": "entry|mid|premium"
}`;
        try {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.1
          });
          const content = response.content[0];
          if (content.type === "text") {
            const result = JSON.parse(content.text);
            return result;
          } else {
            throw new Error("Unexpected response format from Anthropic");
          }
        } catch (error) {
          throw new Error(`Anthropic extraction failed: ${error}`);
        }
      }
      async scanBrochure(filePath, brand, model, preferredProvider = "openai") {
        try {
          if (!openai && !anthropic) {
            throw new Error("No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.");
          }
          const text2 = await this.extractTextFromPDF(filePath);
          if (text2.length < 100) {
            throw new Error("PDF contains insufficient text for analysis");
          }
          if (preferredProvider === "openai" && openai) {
            try {
              return await this.scanBrochureWithOpenAI(text2, brand, model);
            } catch (error) {
              console.log("OpenAI failed, trying Anthropic:", error);
              if (anthropic) {
                return await this.scanBrochureWithAnthropic(text2, brand, model);
              }
              throw error;
            }
          } else if (preferredProvider === "anthropic" && anthropic) {
            try {
              return await this.scanBrochureWithAnthropic(text2, brand, model);
            } catch (error) {
              console.log("Anthropic failed, trying OpenAI:", error);
              if (openai) {
                return await this.scanBrochureWithOpenAI(text2, brand, model);
              }
              throw error;
            }
          } else {
            if (openai) {
              return await this.scanBrochureWithOpenAI(text2, brand, model);
            } else if (anthropic) {
              return await this.scanBrochureWithAnthropic(text2, brand, model);
            }
          }
        } catch (error) {
          throw new Error(`Brochure scanning failed: ${error}`);
        }
      }
      async validateAndEnhanceSpecs(specs) {
        const enhanced = {
          ...specs,
          // Ensure capacity range format is consistent
          capacityRange: specs.capacityRange.replace(/tonnes?/gi, "t").replace(/tons?/gi, "t"),
          // Normalize power types
          powerTypes: specs.powerTypes.map((type) => {
            const normalized = type.toUpperCase();
            if (normalized.includes("LPG") || normalized.includes("GAS")) return "LPG";
            if (normalized.includes("DIESEL")) return "Diesel";
            if (normalized.includes("ELECTRIC") || normalized.includes("BATTERY")) return "Electric";
            return type;
          }),
          // Ensure tier is normalized
          tier: specs.tier.toLowerCase()
        };
        return enhanced;
      }
    };
    brochureScanner = new BrochureScanner();
  }
});

// server/index.ts
import express3 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  forkliftModels;
  brochures;
  competitorQuotes;
  distributorDetails;
  currentUserId;
  currentForkliftId;
  currentBrochureId;
  currentQuoteId;
  currentDistributorId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.forkliftModels = /* @__PURE__ */ new Map();
    this.brochures = /* @__PURE__ */ new Map();
    this.competitorQuotes = /* @__PURE__ */ new Map();
    this.distributorDetails = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentForkliftId = 1;
    this.currentBrochureId = 1;
    this.currentQuoteId = 1;
    this.currentDistributorId = 1;
    this.initializeForkliftData();
    this.initializeBrochureData();
    this.initializeCompetitorQuoteData();
  }
  initializeForkliftData() {
    const forkliftData = [
      // Bobcat NXP25 (Entry)
      {
        brand: "Bobcat",
        model: "NXP25",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 189,
        powerType: "LPG/Diesel",
        operatingWeight: 3820,
        turnRadius: 82,
        travelSpeed: "11.2",
        priceRangeMin: 32e3,
        priceRangeMax: 38e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.8",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      {
        brand: "Bobcat",
        model: "NXP30",
        tier: "ENTRY",
        loadCapacity: 3e3,
        liftHeight: 192,
        powerType: "LPG/Diesel",
        operatingWeight: 4170,
        turnRadius: 85,
        travelSpeed: "11.8",
        priceRangeMin: 34e3,
        priceRangeMax: 4e4,
        warranty: 12,
        availability: "2-3 weeks",
        overallScore: "7.9",
        capacityRange: "2500-3500 kg",
        brochureUrl: null
      },
      // Bobcat 7 Series (MID tier)
      {
        brand: "Bobcat",
        model: "7 Series",
        tier: "MID",
        loadCapacity: 2500,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3900,
        turnRadius: 84,
        travelSpeed: "11.5",
        priceRangeMin: 38e3,
        priceRangeMax: 44e3,
        warranty: 18,
        availability: "3-4 weeks",
        overallScore: "8.2",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      {
        brand: "Bobcat",
        model: "NXS35",
        tier: "PREMIUM",
        loadCapacity: 3500,
        liftHeight: 196,
        powerType: "LPG/Diesel",
        operatingWeight: 4450,
        turnRadius: 88,
        travelSpeed: "12.5",
        priceRangeMin: 42e3,
        priceRangeMax: 48e3,
        warranty: 24,
        availability: "4-6 weeks",
        overallScore: "8.5",
        capacityRange: "3000-3500 kg",
        brochureUrl: null
      },
      // Hyster UT Series (Entry)
      {
        brand: "Hyster",
        model: "UT Series",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 180,
        powerType: "LPG/Diesel",
        operatingWeight: 3400,
        turnRadius: 78,
        travelSpeed: "10.5",
        priceRangeMin: 28e3,
        priceRangeMax: 34e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.2",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Hyster A Series (Entry)
      {
        brand: "Hyster",
        model: "A Series",
        tier: "ENTRY",
        loadCapacity: 2750,
        liftHeight: 185,
        powerType: "LPG/Diesel",
        operatingWeight: 3540,
        turnRadius: 80,
        travelSpeed: "10.8",
        priceRangeMin: 3e4,
        priceRangeMax: 36e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.5",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Hyster XT Series (Mid-range)
      {
        brand: "Hyster",
        model: "XT Series",
        tier: "MID",
        loadCapacity: 3e3,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3800,
        turnRadius: 85,
        travelSpeed: "12.0",
        priceRangeMin: 38e3,
        priceRangeMax: 44e3,
        warranty: 24,
        availability: "3-4 weeks",
        overallScore: "8.3",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Hyster FT Series (Premium)
      {
        brand: "Hyster",
        model: "FT Series",
        tier: "PREMIUM",
        loadCapacity: 3500,
        liftHeight: 195,
        powerType: "LPG/Diesel",
        operatingWeight: 4200,
        turnRadius: 87,
        travelSpeed: "12.2",
        priceRangeMin: 44e3,
        priceRangeMax: 5e4,
        warranty: 24,
        availability: "4-6 weeks",
        overallScore: "8.6",
        capacityRange: "3000-3500 kg",
        brochureUrl: null
      },
      // Toyota 8 Series (MID tier - 1500-3500kg range)
      {
        brand: "Toyota",
        model: "8 Series",
        tier: "MID",
        loadCapacity: 2500,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3680,
        turnRadius: 83,
        travelSpeed: "11.5",
        priceRangeMin: 37e3,
        priceRangeMax: 43e3,
        warranty: 24,
        availability: "In Stock",
        overallScore: "8.4",
        capacityRange: "1500-3500 kg",
        brochureUrl: null
      },
      // Yale US Series (Entry)
      {
        brand: "Yale",
        model: "US Series",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 185,
        powerType: "LPG/Diesel",
        operatingWeight: 3600,
        turnRadius: 81,
        travelSpeed: "10.8",
        priceRangeMin: 3e4,
        priceRangeMax: 36e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.4",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Yale MX Series (Mid-range)
      {
        brand: "Yale",
        model: "MX Series",
        tier: "MID",
        loadCapacity: 2750,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3800,
        turnRadius: 83,
        travelSpeed: "11.2",
        priceRangeMin: 36e3,
        priceRangeMax: 42e3,
        warranty: 18,
        availability: "2-3 weeks",
        overallScore: "8.0",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Yale N Series (Mid-range)
      {
        brand: "Yale",
        model: "N Series",
        tier: "MID",
        loadCapacity: 3e3,
        liftHeight: 192,
        powerType: "LPG/Diesel",
        operatingWeight: 4100,
        turnRadius: 85,
        travelSpeed: "11.8",
        priceRangeMin: 4e4,
        priceRangeMax: 46e3,
        warranty: 18,
        availability: "2-4 weeks",
        overallScore: "8.2",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Crown X Series (Entry)
      {
        brand: "Crown",
        model: "X Series",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 185,
        powerType: "LPG/Diesel",
        operatingWeight: 3500,
        turnRadius: 80,
        travelSpeed: "10.8",
        priceRangeMin: 32e3,
        priceRangeMax: 38e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.6",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Crown C Series (Mid-range)
      {
        brand: "Crown",
        model: "C Series",
        tier: "MID",
        loadCapacity: 2750,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3750,
        turnRadius: 82,
        travelSpeed: "11.2",
        priceRangeMin: 37e3,
        priceRangeMax: 43e3,
        warranty: 18,
        availability: "2-3 weeks",
        overallScore: "8.0",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Crown C-5 Series (Mid-range)
      {
        brand: "Crown",
        model: "C-5 Series",
        tier: "MID",
        loadCapacity: 3e3,
        liftHeight: 191,
        powerType: "LPG/Diesel",
        operatingWeight: 3860,
        turnRadius: 82,
        travelSpeed: "11.5",
        priceRangeMin: 39e3,
        priceRangeMax: 45e3,
        warranty: 18,
        availability: "2-3 weeks",
        overallScore: "8.1",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Crown C-5 Series Diesel
      {
        brand: "Crown",
        model: "C-5 Series Diesel",
        tier: "PREMIUM",
        loadCapacity: 3500,
        liftHeight: 195,
        powerType: "Diesel",
        operatingWeight: 4200,
        turnRadius: 84,
        travelSpeed: "12.0",
        priceRangeMin: 43e3,
        priceRangeMax: 49e3,
        warranty: 24,
        availability: "4-6 weeks",
        overallScore: "8.4",
        capacityRange: "3000-3500 kg",
        brochureUrl: null
      },
      // Mitsubishi FG Series (Entry)
      {
        brand: "Mitsubishi",
        model: "FG Series",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 182,
        powerType: "LPG/Diesel",
        operatingWeight: 3450,
        turnRadius: 78,
        travelSpeed: "10.5",
        priceRangeMin: 29e3,
        priceRangeMax: 35e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.3",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Mitsubishi FD Series (Mid-range)
      {
        brand: "Mitsubishi",
        model: "FD Series",
        tier: "MID",
        loadCapacity: 2750,
        liftHeight: 188,
        powerType: "Diesel",
        operatingWeight: 3720,
        turnRadius: 81,
        travelSpeed: "11.0",
        priceRangeMin: 35e3,
        priceRangeMax: 41e3,
        warranty: 18,
        availability: "2-3 weeks",
        overallScore: "7.9",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Caterpillar G-DPT Series (Entry)
      {
        brand: "Caterpillar",
        model: "G-DPT Series",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 185,
        powerType: "LPG/Diesel",
        operatingWeight: 3550,
        turnRadius: 81,
        travelSpeed: "10.8",
        priceRangeMin: 33e3,
        priceRangeMax: 39e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.7",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Linde Baoli Series (Entry)
      {
        brand: "Linde",
        model: "Baoli Series",
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 185,
        powerType: "LPG/Diesel",
        operatingWeight: 3520,
        turnRadius: 80,
        travelSpeed: "10.6",
        priceRangeMin: 29e3,
        priceRangeMax: 35e3,
        warranty: 12,
        availability: "In Stock",
        overallScore: "7.3",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Linde H Series (Mid-range)
      {
        brand: "Linde",
        model: "H Series",
        tier: "MID",
        loadCapacity: 2e3,
        liftHeight: 188,
        powerType: "LPG/Diesel",
        operatingWeight: 3400,
        turnRadius: 78,
        travelSpeed: "10.8",
        priceRangeMin: 35e3,
        priceRangeMax: 41e3,
        warranty: 18,
        availability: "2-3 weeks",
        overallScore: "8.1",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Linde P Series (Mid-range)
      {
        brand: "Linde",
        model: "P Series",
        tier: "MID",
        loadCapacity: 2500,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3650,
        turnRadius: 80,
        travelSpeed: "11.2",
        priceRangeMin: 37e3,
        priceRangeMax: 43e3,
        warranty: 18,
        availability: "2-4 weeks",
        overallScore: "8.2",
        capacityRange: "2000-3500 kg",
        brochureUrl: null
      },
      // Linde HT Series (Premium)
      {
        brand: "Linde",
        model: "HT Series",
        tier: "PREMIUM",
        loadCapacity: 3500,
        liftHeight: 195,
        powerType: "LPG/Diesel",
        operatingWeight: 4180,
        turnRadius: 85,
        travelSpeed: "12.0",
        priceRangeMin: 42e3,
        priceRangeMax: 48e3,
        warranty: 24,
        availability: "4-6 weeks",
        overallScore: "8.5",
        capacityRange: "3000-3500 kg",
        brochureUrl: null
      }
    ];
    forkliftData.forEach((data, index) => {
      const id = this.currentForkliftId++;
      const model = { ...data, id };
      this.forkliftModels.set(id, model);
    });
  }
  initializeBrochureData() {
    const brochureData = [
      {
        brand: "Toyota",
        model: "8FG Series",
        filename: "toyota-8fg-specs.pdf",
        originalName: "Toyota 8FG Series Specifications.pdf",
        fileSize: 1245760,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        fileUrl: "/uploads/brochures/toyota-8fg-specs.pdf"
      },
      {
        brand: "Hyster",
        model: "XT Series",
        filename: "hyster-xt-brochure.pdf",
        originalName: "Hyster XT Series Brochure.pdf",
        fileSize: 2387456,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        fileUrl: "/uploads/brochures/hyster-xt-brochure.pdf"
      }
    ];
    brochureData.forEach((data, index) => {
      const id = this.currentBrochureId++;
      const brochure = {
        ...data,
        id,
        powerType: null,
        status: "uploaded"
      };
      this.brochures.set(id, brochure);
    });
  }
  initializeCompetitorQuoteData() {
    const competitorQuoteData = [
      {
        brand: "Toyota",
        model: "8 Series",
        competitorBrand: "Hyster",
        competitorModel: "XT Series",
        quotedPrice: "$41,500",
        quoteDate: "2024-12-15",
        powerType: "LPG",
        notes: "Customer comparing LPG models for warehouse operation",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    competitorQuoteData.forEach((data, index) => {
      const id = this.currentQuoteId++;
      const quote = { ...data, id };
      this.competitorQuotes.set(id, quote);
    });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return void 0;
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getAllForkliftModels() {
    return Array.from(this.forkliftModels.values());
  }
  async getForkliftModelsByBrand(brand) {
    return Array.from(this.forkliftModels.values()).filter(
      (model) => model.brand.toLowerCase() === brand.toLowerCase()
    );
  }
  async getForkliftModelsByIds(ids) {
    return ids.map((id) => this.forkliftModels.get(id)).filter(Boolean);
  }
  async searchForkliftModels(query) {
    const searchTerm = query.toLowerCase();
    return Array.from(this.forkliftModels.values()).filter(
      (model) => model.brand.toLowerCase().includes(searchTerm) || model.model.toLowerCase().includes(searchTerm) || model.powerType.toLowerCase().includes(searchTerm)
    );
  }
  async filterForkliftModels(capacityRange, powerType) {
    let models = Array.from(this.forkliftModels.values());
    if (capacityRange) {
      models = models.filter((model) => model.capacityRange === capacityRange);
    }
    if (powerType) {
      models = models.filter((model) => model.powerType.includes(powerType));
    }
    return models;
  }
  async uploadBrochure(insertBrochure) {
    const id = this.currentBrochureId++;
    const brochure = {
      ...insertBrochure,
      id,
      powerType: insertBrochure.powerType || null,
      status: insertBrochure.status || "uploaded"
    };
    this.brochures.set(id, brochure);
    return brochure;
  }
  async getBrochuresByBrand(brand) {
    return Array.from(this.brochures.values()).filter(
      (brochure) => brochure.brand.toLowerCase() === brand.toLowerCase()
    );
  }
  async getBrochuresByModel(brand, model) {
    return Array.from(this.brochures.values()).filter(
      (brochure) => brochure.brand.toLowerCase() === brand.toLowerCase() && brochure.model.toLowerCase() === model.toLowerCase()
    );
  }
  async getAllBrochures() {
    return Array.from(this.brochures.values());
  }
  async deleteBrochure(id) {
    return this.brochures.delete(id);
  }
  async updateModelBrochureUrl(modelId, brochureUrl) {
    const model = this.forkliftModels.get(modelId);
    if (model) {
      model.brochureUrl = brochureUrl;
      return true;
    }
    return false;
  }
  async importSpecificationData(specs) {
    try {
      for (const spec of specs) {
        if (spec.brand && spec.model) {
          const id = this.currentForkliftId++;
          const newModel = {
            id,
            brand: spec.brand,
            model: spec.model,
            tier: this.normalizeTier(spec.tier || "MID"),
            loadCapacity: this.parseCapacity(spec.loadCapacity || spec.capacity),
            liftHeight: this.parseLiftHeight(spec.liftHeight || spec.height),
            powerType: this.normalizePowerType(spec.powerType || "LPG/Diesel"),
            operatingWeight: this.parseWeight(spec.operatingWeight || spec.weight),
            turnRadius: parseFloat(spec.turnRadius) || 85,
            travelSpeed: spec.travelSpeed || "11.0",
            priceRangeMin: parseFloat(spec.priceMin) || 35e3,
            priceRangeMax: parseFloat(spec.priceMax) || 42e3,
            warranty: parseInt(spec.warranty) || 12,
            availability: spec.availability || "2-3 weeks",
            overallScore: spec.overallScore || "8.0",
            capacityRange: this.getCapacityRange(this.parseCapacity(spec.loadCapacity || spec.capacity)),
            brochureUrl: spec.brochureUrl || null
          };
          this.forkliftModels.set(id, newModel);
        }
      }
      return true;
    } catch (error) {
      console.error("Error importing specification data:", error);
      return false;
    }
  }
  async updateModelSpecifications(modelId, specs) {
    const model = this.forkliftModels.get(modelId);
    if (model) {
      Object.assign(model, specs);
      return true;
    }
    return false;
  }
  async updateModelSpecificationsFromBrochure(brand, model, specs) {
    const existingModel = Array.from(this.forkliftModels.values()).find(
      (m) => m.brand.toLowerCase() === brand.toLowerCase() && m.model.toLowerCase() === model.toLowerCase()
    );
    if (existingModel) {
      const updatedModel = this.mergeModelWithBrochureSpecs(existingModel, specs);
      this.forkliftModels.set(existingModel.id, updatedModel);
    } else {
      const id = this.currentForkliftId++;
      const newModel = this.createModelFromBrochureSpecs(id, brand, model, specs);
      this.forkliftModels.set(id, newModel);
    }
    return true;
  }
  createModelFromBrochureSpecs(id, brand, model, specs) {
    return {
      id,
      brand,
      model,
      tier: this.normalizeTier(specs.tier || "MID"),
      loadCapacity: this.parseCapacity(specs.capacityOptions?.[0] || specs.loadCapacity),
      liftHeight: this.extractLiftHeight(specs.liftHeightRange || "190"),
      powerType: this.normalizePowerType(specs.powerTypes?.join("/") || "LPG/Diesel"),
      operatingWeight: this.extractOperatingWeight(specs.operatingWeightRange || "3800"),
      turnRadius: parseFloat(specs.turningRadius) || 85,
      travelSpeed: this.extractTravelSpeed(specs.travelSpeed || "11.0"),
      priceRangeMin: specs.priceRange?.min || 35e3,
      priceRangeMax: specs.priceRange?.max || 42e3,
      warranty: this.extractWarranty(specs.warranty?.period || "12"),
      availability: "2-3 weeks",
      overallScore: "8.0",
      capacityRange: specs.capacityRange || "2000-3500 kg",
      brochureUrl: null
    };
  }
  mergeModelWithBrochureSpecs(existingModel, specs) {
    return {
      ...existingModel,
      // Update with brochure data where available
      loadCapacity: this.parseCapacity(specs.capacityOptions?.[0] || existingModel.loadCapacity),
      liftHeight: this.extractLiftHeight(specs.liftHeightRange || existingModel.liftHeight.toString()),
      powerType: this.normalizePowerType(specs.powerTypes?.join("/") || existingModel.powerType),
      operatingWeight: this.extractOperatingWeight(specs.operatingWeightRange || existingModel.operatingWeight.toString()),
      turnRadius: parseFloat(specs.turningRadius) || existingModel.turnRadius,
      travelSpeed: this.extractTravelSpeed(specs.travelSpeed || existingModel.travelSpeed),
      warranty: this.extractWarranty(specs.warranty?.period || existingModel.warranty.toString()),
      capacityRange: specs.capacityRange || existingModel.capacityRange
    };
  }
  normalizePowerType(powerType) {
    if (!powerType) return "LPG/Diesel";
    return powerType.replace(/\s+/g, "").replace(/,/g, "/");
  }
  extractLiftHeight(heightRange) {
    const match = heightRange.match(/(\d+)/);
    return match ? parseInt(match[1]) : 190;
  }
  extractOperatingWeight(weightRange) {
    const match = weightRange.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3800;
  }
  extractTravelSpeed(speed) {
    const match = speed.match(/(\d+\.?\d*)/);
    return match ? match[1] : "11.0";
  }
  extractWarranty(warranty) {
    const match = warranty.match(/(\d+)/);
    return match ? parseInt(match[1]) : 12;
  }
  async addCompetitorQuote(insertQuote) {
    const id = this.currentQuoteId++;
    const quote = {
      ...insertQuote,
      id,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.competitorQuotes.set(id, quote);
    return quote;
  }
  async getCompetitorQuotesByModel(brand, model) {
    return Array.from(this.competitorQuotes.values()).filter(
      (quote) => quote.brand.toLowerCase() === brand.toLowerCase() && quote.model.toLowerCase() === model.toLowerCase()
    );
  }
  async getAllCompetitorQuotes() {
    return Array.from(this.competitorQuotes.values());
  }
  async updateCompetitorQuote(id, updateData) {
    const quote = this.competitorQuotes.get(id);
    if (quote) {
      Object.assign(quote, updateData);
      return true;
    }
    return false;
  }
  async deleteCompetitorQuote(id) {
    return this.competitorQuotes.delete(id);
  }
  async updateOrCreateModel(modelData) {
    const existingModel = Array.from(this.forkliftModels.values()).find(
      (model) => model.brand.toLowerCase() === modelData.brand?.toLowerCase() && model.model.toLowerCase() === modelData.model?.toLowerCase()
    );
    if (existingModel) {
      const updatedModel = {
        ...existingModel,
        tier: this.normalizeTier(modelData.tier || existingModel.tier),
        loadCapacity: this.parseCapacity(modelData.loadCapacity || existingModel.loadCapacity),
        liftHeight: this.parseLiftHeight(modelData.liftHeight || existingModel.liftHeight),
        powerType: this.normalizePowerType(modelData.powerType || existingModel.powerType),
        operatingWeight: this.parseWeight(modelData.operatingWeight || existingModel.operatingWeight),
        turnRadius: parseFloat(modelData.turnRadius) || existingModel.turnRadius,
        travelSpeed: modelData.travelSpeed || existingModel.travelSpeed,
        priceRangeMin: parseFloat(modelData.priceRangeMin) || existingModel.priceRangeMin,
        priceRangeMax: parseFloat(modelData.priceRangeMax) || existingModel.priceRangeMax,
        warranty: parseInt(modelData.warranty) || existingModel.warranty,
        availability: modelData.availability || existingModel.availability,
        overallScore: modelData.overallScore || existingModel.overallScore,
        capacityRange: modelData.capacityRange || this.getCapacityRange(this.parseCapacity(modelData.loadCapacity || existingModel.loadCapacity)),
        brochureUrl: modelData.brochureUrl || existingModel.brochureUrl
      };
      this.forkliftModels.set(existingModel.id, updatedModel);
      return { updated: true };
    } else {
      const id = this.currentForkliftId++;
      const newModel = {
        id,
        brand: modelData.brand || "Unknown",
        model: modelData.model || "Unknown",
        tier: this.normalizeTier(modelData.tier || "MID"),
        loadCapacity: this.parseCapacity(modelData.loadCapacity || 2500),
        liftHeight: this.parseLiftHeight(modelData.liftHeight || 190),
        powerType: this.normalizePowerType(modelData.powerType || "LPG/Diesel"),
        operatingWeight: this.parseWeight(modelData.operatingWeight || 3800),
        turnRadius: parseFloat(modelData.turnRadius) || 85,
        travelSpeed: modelData.travelSpeed || "11.0",
        priceRangeMin: parseFloat(modelData.priceRangeMin) || 35e3,
        priceRangeMax: parseFloat(modelData.priceRangeMax) || 42e3,
        warranty: parseInt(modelData.warranty) || 12,
        availability: modelData.availability || "2-3 weeks",
        overallScore: modelData.overallScore || "8.0",
        capacityRange: modelData.capacityRange || this.getCapacityRange(this.parseCapacity(modelData.loadCapacity || 2500)),
        brochureUrl: modelData.brochureUrl || null
      };
      this.forkliftModels.set(id, newModel);
      return { created: true };
    }
  }
  normalizeTier(tier) {
    const tierUpper = tier.toUpperCase();
    if (tierUpper.includes("ENTRY") || tierUpper.includes("ENT")) return "ENTRY";
    if (tierUpper.includes("MID")) return "MID";
    if (tierUpper.includes("PREMIUM") || tierUpper.includes("PREM")) return "PREMIUM";
    if (tierUpper.includes("SUPER") || tierUpper.includes("HEAVY")) return "SUPERHEAVY";
    return "MID";
  }
  parseCapacity(capacity) {
    if (typeof capacity === "number") return capacity;
    if (typeof capacity === "string") {
      const match = capacity.match(/(\d+)/);
      return match ? parseInt(match[1]) : 2500;
    }
    return 2500;
  }
  parseLiftHeight(height) {
    if (typeof height === "number") return height;
    if (typeof height === "string") {
      const match = height.match(/(\d+)/);
      return match ? parseInt(match[1]) : 190;
    }
    return 190;
  }
  parseWeight(weight) {
    if (typeof weight === "number") return weight;
    if (typeof weight === "string") {
      const match = weight.match(/(\d+)/);
      return match ? parseInt(match[1]) : 3800;
    }
    return 3800;
  }
  getCapacityRange(capacity) {
    if (capacity <= 2e3) return "1500-2000 kg";
    if (capacity <= 2500) return "2000-2500 kg";
    if (capacity <= 3e3) return "2500-3000 kg";
    if (capacity <= 3500) return "3000-3500 kg";
    return "3500+ kg";
  }
  async deleteForkliftModel(id) {
    return this.forkliftModels.delete(id);
  }
  async updateForkliftModel(id, updates) {
    const model = this.forkliftModels.get(id);
    if (model) {
      Object.assign(model, updates);
      return true;
    }
    return false;
  }
  async getDistributorDetailsByBrand(brand) {
    return Array.from(this.distributorDetails.values()).filter(
      (details) => details.brand.toLowerCase() === brand.toLowerCase()
    );
  }
  async getDistributorDetailsByRegion(region) {
    return Array.from(this.distributorDetails.values()).filter(
      (details) => details.region.toLowerCase() === region.toLowerCase()
    );
  }
  async getAllDistributorDetails() {
    return Array.from(this.distributorDetails.values());
  }
  async addDistributorDetails(details) {
    const id = this.currentDistributorId++;
    const distributor = { ...details, id };
    this.distributorDetails.set(id, distributor);
    return distributor;
  }
  async updateDistributorDetails(id, details) {
    const distributor = this.distributorDetails.get(id);
    if (distributor) {
      Object.assign(distributor, details);
      return true;
    }
    return false;
  }
  async deleteDistributorDetails(id) {
    return this.distributorDetails.delete(id);
  }
  async generateAIInsights(distributorId) {
    const distributor = this.distributorDetails.get(distributorId);
    if (!distributor) {
      throw new Error("Distributor not found");
    }
    return `AI Analysis for ${distributor.companyName}: Strong market presence in ${distributor.region} with excellent customer service ratings. Recommended for ${distributor.brand} dealership expansion.`;
  }
};
var storage = new MemStorage();

// server/routes.ts
init_ai_brochure_scanner();
import multer from "multer";
import path2 from "path";
import fs3 from "fs";
import express from "express";

// server/data-migration.ts
var DataMigration = class {
  /**
   * Verify all brochures are properly linked to their models
   */
  async verifyBrochureIntegrity() {
    const allBrochures = await storage.getAllBrochures();
    const allModels = await storage.getAllForkliftModels();
    const brandCoverage = {};
    allModels.forEach((model) => {
      if (!brandCoverage[model.brand]) {
        brandCoverage[model.brand] = { hasModels: true, hasBrochures: false };
      }
    });
    allBrochures.forEach((brochure) => {
      if (brandCoverage[brochure.brand]) {
        brandCoverage[brochure.brand].hasBrochures = true;
      } else {
        brandCoverage[brochure.brand] = { hasModels: false, hasBrochures: true };
      }
    });
    const linkedBrochures = allBrochures.filter((brochure) => {
      return allModels.some(
        (model) => model.brand.toLowerCase() === brochure.brand.toLowerCase() && (model.model.toLowerCase().includes(brochure.model.toLowerCase()) || brochure.model.toLowerCase().includes(model.model.toLowerCase()))
      );
    });
    const unlinkedBrochures = allBrochures.filter((brochure) => {
      return !allModels.some(
        (model) => model.brand.toLowerCase() === brochure.brand.toLowerCase() && (model.model.toLowerCase().includes(brochure.model.toLowerCase()) || brochure.model.toLowerCase().includes(model.model.toLowerCase()))
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
  async linkBrochuresToModels() {
    const allBrochures = await storage.getAllBrochures();
    const allModels = await storage.getAllForkliftModels();
    let updatedModels = 0;
    let skippedModels = 0;
    const errors = [];
    for (const model of allModels) {
      try {
        const matchingBrochure = allBrochures.find(
          (brochure) => brochure.brand.toLowerCase() === model.brand.toLowerCase() && (model.model.toLowerCase().includes(brochure.model.toLowerCase()) || brochure.model.toLowerCase().includes(model.model.toLowerCase()) || this.isSeriesMatch(model.model, brochure.model))
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
  isSeriesMatch(modelName, brochureName) {
    const modelSeries = modelName.replace(/\d+.*$/, "").trim();
    const brochureSeries = brochureName.replace(/\d+.*$/, "").trim();
    return modelSeries.toLowerCase() === brochureSeries.toLowerCase() && modelSeries.length > 1;
  }
  /**
   * Generate series mapping for the new interface
   */
  async generateSeriesMapping() {
    const allModels = await storage.getAllForkliftModels();
    const allBrochures = await storage.getAllBrochures();
    const brandMapping = {};
    allModels.forEach((model) => {
      if (!brandMapping[model.brand]) {
        brandMapping[model.brand] = {
          series: [],
          models: [],
          brochures: []
        };
      }
      brandMapping[model.brand].models.push(model);
      const seriesName = model.model.replace(/\d+.*$/, "").trim() || model.model.split(" ")[0];
      if (!brandMapping[model.brand].series.includes(seriesName)) {
        brandMapping[model.brand].series.push(seriesName);
      }
    });
    allBrochures.forEach((brochure) => {
      if (brandMapping[brochure.brand]) {
        brandMapping[brochure.brand].brochures.push(brochure);
      } else {
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
  async runMigrationReport() {
    const integrity = await this.verifyBrochureIntegrity();
    const linking = await this.linkBrochuresToModels();
    const seriesMapping = await this.generateSeriesMapping();
    const recommendations = [];
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
};
var dataMigration = new DataMigration();

// server/brochure-restoration.ts
init_ai_brochure_scanner();
import fs2 from "fs";
import path from "path";
var BrochureRestoration = class {
  async restoreAllBrochures() {
    const brochuresDir = path.join(process.cwd(), "uploads/brochures");
    const files = fs2.readdirSync(brochuresDir);
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));
    let restored = 0;
    let failed = 0;
    const errors = [];
    for (const filename of pdfFiles) {
      try {
        const filePath = path.join(brochuresDir, filename);
        const stats = fs2.statSync(filePath);
        const specs = await brochureScanner.scanBrochure(filePath, "Auto-detect", "Auto-detect");
        await storage.uploadBrochure({
          brand: specs.brand,
          model: specs.model,
          filename,
          originalName: `${specs.brand} ${specs.model} Brochure.pdf`,
          fileSize: stats.size,
          uploadedAt: stats.mtime.toISOString(),
          fileUrl: `/uploads/brochures/${filename}`
        });
        await storage.updateModelSpecificationsFromBrochure(specs.brand, specs.model, specs);
        restored++;
        console.log(`Restored: ${specs.brand} ${specs.model}`);
      } catch (error) {
        failed++;
        errors.push(`Failed to restore ${filename}: ${error.message}`);
        console.error(`Failed to restore ${filename}:`, error);
      }
    }
    return { restored, failed, errors };
  }
};
var brochureRestoration = new BrochureRestoration();

// shared/schema.ts
import { pgTable, text, serial, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var forkliftModels = pgTable("forklift_models", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  tier: text("tier").notNull(),
  // "ENTRY", "MID", "PREMIUM"
  loadCapacity: integer("load_capacity").notNull(),
  // in pounds
  liftHeight: integer("lift_height").notNull(),
  // in inches
  powerType: text("power_type").notNull(),
  // "Electric", "Propane", "Diesel", "Gas"
  operatingWeight: integer("operating_weight").notNull(),
  // in pounds
  turnRadius: integer("turn_radius").notNull(),
  // in inches
  travelSpeed: decimal("travel_speed", { precision: 3, scale: 1 }).notNull(),
  // in mph
  priceRangeMin: integer("price_range_min").notNull(),
  priceRangeMax: integer("price_range_max").notNull(),
  warranty: integer("warranty").notNull(),
  // in months
  availability: text("availability").notNull(),
  // "In Stock", "2-4 weeks", "8-12 weeks"
  overallScore: decimal("overall_score", { precision: 2, scale: 1 }).notNull(),
  capacityRange: text("capacity_range").notNull(),
  // "3,000-5,000 lbs", etc.
  brochureUrl: text("brochure_url")
  // URL to uploaded brochure PDF
});
var brochures = pgTable("brochures", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  fileUrl: text("file_url").notNull(),
  powerType: text("power_type"),
  status: text("status").default("uploaded")
});
var competitorQuotes = pgTable("competitor_quotes", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  // Which brand this quote is for
  model: text("model").notNull(),
  // Which model this quote is for
  competitorBrand: text("competitor_brand").notNull(),
  // e.g., "Clark"
  competitorModel: text("competitor_model").notNull(),
  // e.g., "LEP25"
  quoteRef: text("quote_ref"),
  // e.g., "QQ250217SK"
  quotedPrice: decimal("quoted_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("AUD").notNull(),
  capacity: text("capacity"),
  // e.g., "2,500kg"
  liftHeight: text("lift_height"),
  // e.g., "4,800mm"
  powerType: text("power_type"),
  // e.g., "Lithium-ION"
  specialFeatures: text("special_features"),
  // Key features from quote
  warranty: text("warranty"),
  // e.g., "3Yrs/3,000hrs battery, 1Yr/1000hrs machine"
  availability: text("availability"),
  // e.g., "In stock now"
  terms: text("terms"),
  // Payment terms
  validity: text("validity"),
  // Quote validity period
  supplierName: text("supplier_name"),
  // e.g., "Clark Equipment Sales Pty Ltd"
  supplierContact: text("supplier_contact"),
  // Contact details
  quoteDate: text("quote_date").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  filename: text("filename"),
  // PDF filename if uploaded
  fileUrl: text("file_url"),
  // URL to quote PDF
  notes: text("notes"),
  // Internal notes about the quote
  status: text("status").default("active").notNull()
  // active, expired, won, lost
});
var insertForkliftModelSchema = createInsertSchema(forkliftModels).omit({
  id: true
});
var insertBrochureSchema = createInsertSchema(brochures).omit({
  id: true
});
var insertCompetitorQuoteSchema = createInsertSchema(competitorQuotes).omit({
  id: true
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var distributorDetails = pgTable("distributor_details", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  region: text("region").notNull(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  businessType: text("business_type").default("distributor").notNull(),
  // distributor, importer, dealer
  services: text("services").array(),
  certifications: text("certifications").array(),
  yearsInBusiness: integer("years_in_business"),
  territorySize: text("territory_size"),
  stockLevels: text("stock_levels"),
  serviceCapability: text("service_capability"),
  aiInsights: text("ai_insights"),
  lastUpdated: text("last_updated").notNull(),
  status: text("status").default("active").notNull(),
  notes: text("notes")
});
var insertDistributorDetailsSchema = createInsertSchema(distributorDetails).omit({
  id: true
});

// server/routes.ts
import OpenAI2 from "openai";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY
});
async function extractQuoteData(filePath, expectedBrand) {
  try {
    const pdfParse = __require("pdf-parse");
    const pdfBuffer = fs3.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const text2 = pdfData.text;
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a quote document analyzer. Extract structured data from forklift competitor quotes. Return JSON format with keys: competitorBrand, competitorModel, quotedPrice, quoteDate, powerType, capacity, warranty, supplierName, notes. If information is not found, use null. Focus on forklift equipment quotes.`
        },
        {
          role: "user",
          content: `Extract quote information from this document:

${text2}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1e3
    });
    const extracted = JSON.parse(response.choices[0].message.content || "{}");
    return {
      competitorBrand: extracted.competitorBrand || expectedBrand || null,
      competitorModel: extracted.competitorModel || null,
      quotedPrice: extracted.quotedPrice || null,
      quoteDate: extracted.quoteDate || null,
      powerType: extracted.powerType || null,
      capacity: extracted.capacity || null,
      warranty: extracted.warranty || null,
      supplierName: extracted.supplierName || null,
      notes: extracted.notes || `AI extracted from ${path2.basename(filePath)}`
    };
  } catch (error) {
    console.error("Quote extraction error:", error);
    return {};
  }
}
var brochureDir = path2.join(process.cwd(), "uploads/brochures");
var quotesDir = path2.join(process.cwd(), "uploads/quotes");
if (!fs3.existsSync(brochureDir)) {
  fs3.mkdirSync(brochureDir, { recursive: true });
}
if (!fs3.existsSync(quotesDir)) {
  fs3.mkdirSync(quotesDir, { recursive: true });
}
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "quote") {
      cb(null, quotesDir);
    } else {
      cb(null, brochureDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path2.extname(file.originalname));
  }
});
var upload = multer({
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "quote") {
      if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF and image files are allowed for quotes"));
      }
    } else {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for brochures"));
      }
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
async function registerRoutes(app2) {
  app2.use("/uploads", express.static(path2.join(process.cwd(), "uploads")));
  app2.post("/api/test-ai-scan", async (req, res) => {
    try {
      console.log("Testing AI brochure scanning...");
      const { brochureScanner: brochureScanner2 } = await Promise.resolve().then(() => (init_ai_brochure_scanner(), ai_brochure_scanner_exports));
      const pdfPath = path2.join(process.cwd(), "uploads/brochures/brochure-1750071940153-841576755.pdf");
      const specs = await brochureScanner2.scanBrochure(pdfPath, "Toyota", "8FG FD Series", "anthropic");
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
  app2.get("/api/forklift-models", async (req, res) => {
    try {
      const models = await storage.getAllForkliftModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forklift models" });
    }
  });
  app2.post("/api/forklift-models", async (req, res) => {
    try {
      const modelData = req.body;
      const existingModels = await storage.getAllForkliftModels();
      const duplicate = existingModels.find(
        (m) => m.brand.toLowerCase() === modelData.brand.toLowerCase() && m.model.toLowerCase().trim() === modelData.model.toLowerCase().trim()
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
  app2.get("/api/forklift-models/brand/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      const models = await storage.getForkliftModelsByBrand(brand);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch models by brand" });
    }
  });
  app2.post("/api/forklift-models/compare", async (req, res) => {
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
  app2.get("/api/forklift-models/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      const models = await storage.searchForkliftModels(q);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to search forklift models" });
    }
  });
  app2.get("/api/forklift-models/filter", async (req, res) => {
    try {
      const { capacityRange, powerType } = req.query;
      const models = await storage.filterForkliftModels(
        capacityRange,
        powerType
      );
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter forklift models" });
    }
  });
  app2.get("/api/brochures", async (req, res) => {
    try {
      const brochures2 = await storage.getAllBrochures();
      res.json(brochures2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brochures" });
    }
  });
  app2.get("/api/brochures/brand/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      const brochures2 = await storage.getBrochuresByBrand(brand);
      res.json(brochures2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brochures by brand" });
    }
  });
  app2.get("/api/brochures/:brand/:model", async (req, res) => {
    try {
      const { brand, model } = req.params;
      const brochures2 = await storage.getBrochuresByModel(brand, model);
      res.json(brochures2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brochures by model" });
    }
  });
  app2.post("/api/brochures", upload.single("brochure"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { brand, model } = req.body;
      if (!brand || !model) {
        return res.status(400).json({ error: "Brand and model are required" });
      }
      const brochure = await storage.uploadBrochure({
        brand,
        model,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
  app2.get("/uploads/brochures/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path2.join(process.cwd(), "uploads", "brochures", filename);
    if (fs3.existsSync(filepath)) {
      res.download(filepath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });
  app2.delete("/api/brochures/:id", async (req, res) => {
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
  app2.delete("/api/forklift-models/:id", async (req, res) => {
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
  app2.patch("/api/forklift-models/:id", async (req, res) => {
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
  app2.put("/api/forklift-models/:id", async (req, res) => {
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
  app2.patch("/api/forklift-models/reorder", async (req, res) => {
    try {
      const { brand, orderUpdates } = req.body;
      for (const update of orderUpdates) {
        await storage.updateForkliftModel(update.id, { sortOrder: update.sortOrder });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating model order:", error);
      res.status(500).json({ error: "Failed to update model order" });
    }
  });
  app2.post("/api/fix-linde-series", async (req, res) => {
    try {
      const allModels = await storage.getAllForkliftModels();
      const lindeModels = allModels.filter((m) => m.brand === "Linde");
      for (const model of lindeModels) {
        await storage.deleteForkliftModel(model.id);
      }
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
          priceRangeMin: 28e3,
          priceRangeMax: 34e3,
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
          priceRangeMin: 36e3,
          priceRangeMax: 42e3,
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
          loadCapacity: 3e3,
          liftHeight: 190,
          powerType: "LPG/Diesel",
          operatingWeight: 3850,
          turnRadius: 82,
          travelSpeed: "12.0",
          priceRangeMin: 48e3,
          priceRangeMax: 54e3,
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
          priceRangeMin: 6e4,
          priceRangeMax: 7e4,
          warranty: 36,
          availability: "6-8 weeks",
          overallScore: "9.0",
          capacityRange: "2000-3500 kg",
          brochureUrl: null
        }
      ];
      for (const modelData of correctLindeSeries) {
        await storage.updateOrCreateModel(modelData);
      }
      res.json({ success: true, message: "Linde series fixed - now shows only 4 correct series" });
    } catch (error) {
      console.error("Error fixing Linde series:", error);
      res.status(500).json({ error: "Failed to fix Linde series" });
    }
  });
  app2.put("/api/forklift-models/:id/brochure", async (req, res) => {
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
  app2.post("/api/specifications/import", async (req, res) => {
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
  app2.put("/api/forklift-models/:id/specifications", async (req, res) => {
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
  app2.post("/api/brochures/smart-upload", upload.single("brochure"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      try {
        const specs = await brochureScanner.scanBrochure(
          req.file.path,
          "Auto-detect",
          // Let AI determine brand
          "Auto-detect"
          // Let AI determine model
        );
        const brochure = await storage.uploadBrochure({
          brand: specs.brand,
          model: specs.model,
          filename: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          fileUrl: `/uploads/brochures/${req.file.filename}`
        });
        await storage.updateModelSpecificationsFromBrochure(specs.brand, specs.model, specs);
        res.json({
          success: true,
          brand: specs.brand,
          model: specs.model,
          brochure,
          specifications: specs,
          message: `AI extracted and processed: ${specs.brand} ${specs.model}`
        });
      } catch (aiError) {
        console.error("AI processing failed:", aiError);
        res.status(500).json({ error: `AI processing failed: ${aiError.message}` });
      }
    } catch (error) {
      console.error("Smart upload error:", error);
      res.status(500).json({ error: "Failed to process brochure" });
    }
  });
  app2.get("/api/data/migration-status", async (req, res) => {
    try {
      const report = await dataMigration.runMigrationReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate migration report" });
    }
  });
  app2.post("/api/data/migrate", async (req, res) => {
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
  app2.post("/api/data/restore-brochures", async (req, res) => {
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
  app2.post("/api/competitor-quotes", upload.single("quote"), async (req, res) => {
    try {
      let quoteData;
      if (req.file) {
        const fileUrl = `/uploads/quotes/${req.file.filename}`;
        let extractedData = {};
        try {
          if (req.file.mimetype === "application/pdf") {
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
          status: req.body.status || "active",
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
          filename: req.file.filename,
          fileUrl,
          // Additional extracted fields
          ...extractedData
        };
      } else {
        quoteData = {
          ...req.body,
          uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
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
  app2.get("/api/competitor-quotes", async (req, res) => {
    try {
      const { brand, model } = req.query;
      if (brand && model) {
        const quotes = await storage.getCompetitorQuotesByModel(
          brand,
          model
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
  app2.put("/api/competitor-quotes/:id", async (req, res) => {
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
  app2.delete("/api/competitor-quotes/:id", async (req, res) => {
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
  app2.post("/api/brands", async (req, res) => {
    try {
      const { name, country, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }
      const newBrandModel = {
        brand: name,
        model: `${name} Series`,
        tier: "ENTRY",
        loadCapacity: 2500,
        liftHeight: 3e3,
        powerType: "LPG/Diesel",
        operatingWeight: 4e3,
        turnRadius: 2200,
        travelSpeed: "20 km/h",
        priceRangeMin: 45e3,
        priceRangeMax: 55e3,
        warranty: 12,
        overallScore: "B+",
        capacityRange: "2000-3500 kg",
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
  app2.post("/api/forklift-models/bulk-update", async (req, res) => {
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
  app2.get("/api/series/:brand", async (req, res) => {
    try {
      const { brand } = req.params;
      const models = await storage.getForkliftModelsByBrand(brand);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch series by brand" });
    }
  });
  app2.get("/api/series/:brand/:series", async (req, res) => {
    try {
      const { brand, series } = req.params;
      const decodedSeries = decodeURIComponent(series.replace(/-/g, " "));
      const allModels = await storage.getForkliftModelsByBrand(brand);
      const seriesModels = allModels.filter((model) => {
        const normalizedModelName = model.model.toLowerCase().replace(/[-\s]+/g, " ").trim();
        const normalizedSeriesName = decodedSeries.toLowerCase().replace(/[-\s]+/g, " ").trim();
        return normalizedModelName.includes(normalizedSeriesName) || normalizedSeriesName.includes(normalizedModelName) || model.series && model.series.toLowerCase().includes(normalizedSeriesName);
      });
      res.json(seriesModels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch series models" });
    }
  });
  app2.post("/api/generate-insights", async (req, res) => {
    try {
      const { models } = req.body;
      if (!models || models.length === 0) {
        return res.status(400).json({ error: "No models provided for comparison" });
      }
      const insights = [];
      for (const model of models) {
        const insight = {
          model: model.model,
          brand: model.brand,
          strengths: `${model.tier} tier positioning with ${model.loadCapacity}kg capacity and ${model.powerType} power options. Strong reliability with ${model.warranty}-month warranty.`,
          weaknesses: model.tier === "ENTRY" ? "Limited advanced features compared to premium models" : model.tier === "PREMIUM" ? "Higher price point may limit market reach" : "Mid-range positioning requires clear differentiation",
          competitiveAdvantage: `Proven performance in ${model.capacityRange} capacity range with excellent ${model.availability} availability`,
          talkTrack: `Emphasize ${model.warranty}-month warranty, proven reliability, and strong resale value. Highlight ${model.powerType} flexibility and ${model.overallScore} performance rating.`,
          pricePosition: `Competitive pricing at $${model.priceRangeMin?.toLocaleString()}-$${model.priceRangeMax?.toLocaleString()} delivers strong value in ${model.tier.toLowerCase()} segment`
        };
        insights.push(insight);
      }
      res.json({ insights, totalModels: models.length });
    } catch (error) {
      console.error("Error generating insights:", error);
      res.status(500).json({
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs4 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
