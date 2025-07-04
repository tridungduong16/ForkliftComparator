import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Initialize Anthropic client only if API key is available
let anthropic: Anthropic | null = null;
if (process.env.ANTHROPIC_API_KEY) {
  // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

export interface ExtractedSpecifications {
  brand: string;
  model: string;
  series: string;
  capacityRange: string;
  capacityOptions: string[];
  powerTypes: string[];
  engineSpecs: {
    model: string;
    power: string;
    tier: string;
    displacement?: string;
  };
  transmission: string;
  brakes: string;
  liftHeightRange: string;
  operatingWeightRange: string;
  fuelCapacity?: string;
  loadCenter: string;
  turningRadius: string;
  travelSpeed?: string;
  features: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  warranty: {
    period: string;
    coverage: string;
    region: string;
    terms: string;
  };
  tier: 'entry' | 'mid' | 'premium';
  sourceDocument: string;
  extractionDate: string;
}

export class BrochureScanner {
  
  // Detect fuel type from model name patterns based on industry standards
  private detectFuelTypeFromModel(modelName: string, brand?: string): string[] {
    const model = modelName.toUpperCase();
    const brandUpper = brand?.toUpperCase() || '';
    const fuelTypes: string[] = [];
    
    // Brand-specific patterns
    if (brandUpper === 'BOBCAT') {
      // Bobcat often has separate brochures: NXP25D vs NXP25G
      if (model.endsWith('D') || model.includes('-D')) {
        fuelTypes.push('Diesel');
      } else if (model.endsWith('G') || model.includes('-G')) {
        fuelTypes.push('LPG');
      }
    } else if (brandUpper === 'TOYOTA') {
      // Toyota uses FD/FG prefixes: 8FD25 vs 8FG25
      if (model.includes('FD')) {
        fuelTypes.push('Diesel');
      } else if (model.includes('FG')) {
        fuelTypes.push('LPG');
      }
    } else if (brandUpper === 'CATERPILLAR') {
      // Caterpillar uses suffix letters: GP25D vs GP25G
      if (model.endsWith('D') || model.includes('-D')) {
        fuelTypes.push('Diesel');
      } else if (model.endsWith('G') || model.includes('-G')) {
        fuelTypes.push('LPG');
      }
    }
    
    // General patterns for all brands
    if (fuelTypes.length === 0) {
      if (model.includes('FD') || model.match(/\bD$/)) {
        fuelTypes.push('Diesel');
      }
      if (model.includes('FG') || model.includes('G') || model.includes('LPG') || model.includes('GAS')) {
        fuelTypes.push('LPG');
      }
      if (model.includes('FE') || model.includes('ELECTRIC') || model.includes('BATTERY')) {
        fuelTypes.push('Electric');
      }
    }
    
    // If still no specific indicators found, check if it's a dual-fuel series
    if (fuelTypes.length === 0) {
      fuelTypes.push('LPG/Diesel');
    }
    
    return fuelTypes;
  }
  
  // Extract series name from model (remove fuel type suffixes)
  private extractSeriesFromModel(modelName: string): string {
    return modelName
      .replace(/FD/gi, '')
      .replace(/FG/gi, '')
      .replace(/FE/gi, '')
      .replace(/-[DG]$/gi, '')
      .replace(/[DG]$/gi, '')
      .trim();
  }

  async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      // For demonstration, extract filename and basic info
      const filename = filePath.split('/').pop() || '';
      const fileSize = fs.statSync(filePath).size;
      
      // Simulate text extraction based on filename patterns
      let extractedText = `PDF Document: ${filename}\nFile Size: ${fileSize} bytes\n\n`;
      
      // Extract brand and model hints from filename
      const lowerFilename = filename.toLowerCase();
      if (lowerFilename.includes('toyota')) {
        extractedText += 'Brand: Toyota\nModel: 8FG Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n';
      } else if (lowerFilename.includes('hyster')) {
        extractedText += 'Brand: Hyster\nModel: H Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n';
      } else if (lowerFilename.includes('linde')) {
        extractedText += 'Brand: Linde\nModel: HT/H/P Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\nTier: HT=Entry, H=Mid, P=Premium\n';
      } else if (lowerFilename.includes('tcm')) {
        extractedText += 'Brand: TCM\nModel: F Series\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n';
      } else {
        extractedText += 'Generic forklift specifications\nCapacity: 2000-3500 kg\nPower: LPG/Diesel\n';
      }
      
      return extractedText;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error}`);
    }
  }

  async scanBrochureWithOpenAI(text: string, brand: string, model: string): Promise<ExtractedSpecifications> {
    if (!openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    const isAutoDetect = brand === "Auto-detect" || model === "Auto-detect";
    
    const prompt = `
You are a forklift specification extraction expert. ${isAutoDetect ? 'First identify the actual brand and model from the document, then extract' : 'Extract'} specifications from this brochure text.

${isAutoDetect ? `
STEP 1 - BRAND & MODEL DETECTION:
Look for the manufacturer brand name in the text: Toyota, Caterpillar, Hyster, Yale, Crown, Linde, Mitsubishi, TCM, Bobcat, Hyundai, etc.
Look for specific model designations like: 8FG25, GP25N, H2.5FT, GLP25VX, C-5 2500, H25T, FG25N, etc.
The brand should appear prominently in headers, logos, or model designations.
Model numbers typically follow patterns: [Letters][Numbers][Letters] (e.g., 8FG25, GP30N, H35T)
` : ''}

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
${text}

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
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as ExtractedSpecifications;
    } catch (error) {
      throw new Error(`OpenAI extraction failed: ${error}`);
    }
  }

  async scanBrochureWithAnthropic(text: string, brand: string, model: string): Promise<ExtractedSpecifications> {
    if (!anthropic) {
      throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.');
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
${text}

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const result = JSON.parse(content.text);
        return result as ExtractedSpecifications;
      } else {
        throw new Error('Unexpected response format from Anthropic');
      }
    } catch (error) {
      throw new Error(`Anthropic extraction failed: ${error}`);
    }
  }

  async scanBrochure(filePath: string, brand: string, model: string, preferredProvider: 'openai' | 'anthropic' = 'openai'): Promise<ExtractedSpecifications> {
    try {
      // Check if any AI provider is available
      if (!openai && !anthropic) {
        throw new Error('No AI providers configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.');
      }

      // Extract text from PDF
      const text = await this.extractTextFromPDF(filePath);
      
      if (text.length < 100) {
        throw new Error('PDF contains insufficient text for analysis');
      }

      // Try primary provider first, with fallback to available provider
      if (preferredProvider === 'openai' && openai) {
        try {
          return await this.scanBrochureWithOpenAI(text, brand, model);
        } catch (error) {
          console.log('OpenAI failed, trying Anthropic:', error);
          if (anthropic) {
            return await this.scanBrochureWithAnthropic(text, brand, model);
          }
          throw error;
        }
      } else if (preferredProvider === 'anthropic' && anthropic) {
        try {
          return await this.scanBrochureWithAnthropic(text, brand, model);
        } catch (error) {
          console.log('Anthropic failed, trying OpenAI:', error);
          if (openai) {
            return await this.scanBrochureWithOpenAI(text, brand, model);
          }
          throw error;
        }
      } else {
        // Use whatever provider is available
        if (openai) {
          return await this.scanBrochureWithOpenAI(text, brand, model);
        } else if (anthropic) {
          return await this.scanBrochureWithAnthropic(text, brand, model);
        }
      }
    } catch (error) {
      throw new Error(`Brochure scanning failed: ${error}`);
    }
  }

  async validateAndEnhanceSpecs(specs: ExtractedSpecifications): Promise<ExtractedSpecifications> {
    // Validate and clean up extracted specifications
    const enhanced: ExtractedSpecifications = {
      ...specs,
      // Ensure capacity range format is consistent
      capacityRange: specs.capacityRange.replace(/tonnes?/gi, 't').replace(/tons?/gi, 't'),
      // Normalize power types
      powerTypes: specs.powerTypes.map(type => {
        const normalized = type.toUpperCase();
        if (normalized.includes('LPG') || normalized.includes('GAS')) return 'LPG';
        if (normalized.includes('DIESEL')) return 'Diesel';
        if (normalized.includes('ELECTRIC') || normalized.includes('BATTERY')) return 'Electric';
        return type;
      }),
      // Ensure tier is normalized
      tier: specs.tier.toLowerCase() as 'entry' | 'mid' | 'premium'
    };

    return enhanced;
  }
}

export const brochureScanner = new BrochureScanner();