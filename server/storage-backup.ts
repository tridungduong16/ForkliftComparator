import type { 
  User, 
  InsertUser, 
  ForkliftModel, 
  Brochure, 
  InsertBrochure, 
  CompetitorQuote, 
  InsertCompetitorQuote,
  DistributorDetails,
  InsertDistributorDetails
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllForkliftModels(): Promise<ForkliftModel[]>;
  getForkliftModelsByBrand(brand: string): Promise<ForkliftModel[]>;
  getForkliftModelsByIds(ids: number[]): Promise<ForkliftModel[]>;
  searchForkliftModels(query: string): Promise<ForkliftModel[]>;
  filterForkliftModels(capacityRange?: string, powerType?: string): Promise<ForkliftModel[]>;
  // Brochure management
  uploadBrochure(brochure: InsertBrochure): Promise<Brochure>;
  getBrochuresByBrand(brand: string): Promise<Brochure[]>;
  getBrochuresByModel(brand: string, model: string): Promise<Brochure[]>;
  getAllBrochures(): Promise<Brochure[]>;
  deleteBrochure(id: number): Promise<boolean>;
  updateModelBrochureUrl(modelId: number, brochureUrl: string): Promise<boolean>;
  // Specification data import
  importSpecificationData(specs: any[]): Promise<boolean>;
  updateModelSpecifications(modelId: number, specs: any): Promise<boolean>;
  updateModelSpecificationsFromBrochure(brand: string, model: string, specs: any): Promise<boolean>;
  // Competitor quote management
  addCompetitorQuote(quote: InsertCompetitorQuote): Promise<CompetitorQuote>;
  getCompetitorQuotesByModel(brand: string, model: string): Promise<CompetitorQuote[]>;
  getAllCompetitorQuotes(): Promise<CompetitorQuote[]>;
  updateCompetitorQuote(id: number, quote: Partial<InsertCompetitorQuote>): Promise<boolean>;
  deleteCompetitorQuote(id: number): Promise<boolean>;
  updateOrCreateModel(modelData: any): Promise<{updated?: boolean, created?: boolean}>;
  deleteForkliftModel(id: number): Promise<boolean>;
  updateForkliftModel(id: number, updates: Partial<ForkliftModel>): Promise<boolean>;
  // Distributor and Importer management
  getDistributorDetailsByBrand(brand: string): Promise<DistributorDetails[]>;
  getDistributorDetailsByRegion(region: string): Promise<DistributorDetails[]>;
  getAllDistributorDetails(): Promise<DistributorDetails[]>;
  addDistributorDetails(details: InsertDistributorDetails): Promise<DistributorDetails>;
  updateDistributorDetails(id: number, details: Partial<InsertDistributorDetails>): Promise<boolean>;
  deleteDistributorDetails(id: number): Promise<boolean>;
  generateAIInsights(distributorId: number): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private forkliftModels: Map<number, ForkliftModel>;
  private brochures: Map<number, Brochure>;
  private competitorQuotes: Map<number, CompetitorQuote>;
  private distributorDetails: Map<number, DistributorDetails>;
  private currentUserId: number;
  private currentForkliftId: number;
  private currentBrochureId: number;
  private currentQuoteId: number;
  private currentDistributorId: number;

  constructor() {
    this.users = new Map();
    this.forkliftModels = new Map();
    this.brochures = new Map();
    this.competitorQuotes = new Map();
    this.distributorDetails = new Map();
    this.currentUserId = 1;
    this.currentForkliftId = 1;
    this.currentBrochureId = 1;
    this.currentQuoteId = 1;
    this.currentDistributorId = 1;
    this.initializeForkliftData();
    this.initializeBrochureData();
    this.initializeCompetitorQuoteData();
  }

  private initializeForkliftData() {
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
        priceRangeMin: 32000,
        priceRangeMax: 38000,
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
        loadCapacity: 3000,
        liftHeight: 192,
        powerType: "LPG/Diesel",
        operatingWeight: 4170,
        turnRadius: 85,
        travelSpeed: "11.8",
        priceRangeMin: 34000,
        priceRangeMax: 40000,
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
        priceRangeMin: 38000,
        priceRangeMax: 44000,
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
        priceRangeMin: 42000,
        priceRangeMax: 48000,
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
        priceRangeMin: 28000,
        priceRangeMax: 34000,
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
        priceRangeMin: 30000,
        priceRangeMax: 36000,
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
        loadCapacity: 3000,
        liftHeight: 190,
        powerType: "LPG/Diesel",
        operatingWeight: 3800,
        turnRadius: 85,
        travelSpeed: "12.0",
        priceRangeMin: 38000,
        priceRangeMax: 44000,
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
        priceRangeMin: 44000,
        priceRangeMax: 50000,
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
        priceRangeMin: 37000,
        priceRangeMax: 43000,
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
        priceRangeMin: 30000,
        priceRangeMax: 36000,
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
        priceRangeMin: 36000,
        priceRangeMax: 42000,
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
        loadCapacity: 3000,
        liftHeight: 192,
        powerType: "LPG/Diesel",
        operatingWeight: 4100,
        turnRadius: 85,
        travelSpeed: "11.8",
        priceRangeMin: 40000,
        priceRangeMax: 46000,
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
        priceRangeMin: 32000,
        priceRangeMax: 38000,
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
        priceRangeMin: 37000,
        priceRangeMax: 43000,
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
        loadCapacity: 3000,
        liftHeight: 191,
        powerType: "LPG/Diesel",
        operatingWeight: 3860,
        turnRadius: 82,
        travelSpeed: "11.5",
        priceRangeMin: 39000,
        priceRangeMax: 45000,
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
        priceRangeMin: 43000,
        priceRangeMax: 49000,
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
        priceRangeMin: 29000,
        priceRangeMax: 35000,
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
        priceRangeMin: 35000,
        priceRangeMax: 41000,
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
        priceRangeMin: 33000,
        priceRangeMax: 39000,
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
        priceRangeMin: 29000,
        priceRangeMax: 35000,
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
        loadCapacity: 2000,
        liftHeight: 188,
        powerType: "LPG/Diesel",
        operatingWeight: 3400,
        turnRadius: 78,
        travelSpeed: "10.8",
        priceRangeMin: 35000,
        priceRangeMax: 41000,
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
        priceRangeMin: 37000,
        priceRangeMax: 43000,
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
        priceRangeMin: 42000,
        priceRangeMax: 48000,
        warranty: 24,
        availability: "4-6 weeks",
        overallScore: "8.5",
        capacityRange: "3000-3500 kg",
        brochureUrl: null
      }
    ];

    forkliftData.forEach((data, index) => {
      const id = this.currentForkliftId++;
      const model: ForkliftModel = { ...data, id };
      this.forkliftModels.set(id, model);
    });
  }

  private initializeBrochureData() {
    const brochureData = [
      {
        brand: "Toyota",
        model: "8FG Series",
        filename: "toyota-8fg-specs.pdf",
        originalName: "Toyota 8FG Series Specifications.pdf",
        fileSize: 1245760,
        uploadedAt: new Date().toISOString(),
        fileUrl: "/uploads/brochures/toyota-8fg-specs.pdf"
      },
      {
        brand: "Hyster",
        model: "XT Series",
        filename: "hyster-xt-brochure.pdf",
        originalName: "Hyster XT Series Brochure.pdf",
        fileSize: 2387456,
        uploadedAt: new Date().toISOString(),
        fileUrl: "/uploads/brochures/hyster-xt-brochure.pdf"
      }
    ];

    brochureData.forEach((data, index) => {
      const id = this.currentBrochureId++;
      const brochure: Brochure = { ...data, id };
      this.brochures.set(id, brochure);
    });
  }

  private initializeCompetitorQuoteData() {
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
        uploadedAt: new Date().toISOString()
      }
    ];

    competitorQuoteData.forEach((data, index) => {
      const id = this.currentQuoteId++;
      const quote: CompetitorQuote = { ...data, id };
      this.competitorQuotes.set(id, quote);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllForkliftModels(): Promise<ForkliftModel[]> {
    return Array.from(this.forkliftModels.values());
  }

  async getForkliftModelsByBrand(brand: string): Promise<ForkliftModel[]> {
    return Array.from(this.forkliftModels.values()).filter(
      model => model.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  async getForkliftModelsByIds(ids: number[]): Promise<ForkliftModel[]> {
    return ids.map(id => this.forkliftModels.get(id)).filter(Boolean) as ForkliftModel[];
  }

  async searchForkliftModels(query: string): Promise<ForkliftModel[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.forkliftModels.values()).filter(model =>
      model.brand.toLowerCase().includes(searchTerm) ||
      model.model.toLowerCase().includes(searchTerm) ||
      model.powerType.toLowerCase().includes(searchTerm)
    );
  }

  async filterForkliftModels(capacityRange?: string, powerType?: string): Promise<ForkliftModel[]> {
    let models = Array.from(this.forkliftModels.values());

    if (capacityRange) {
      models = models.filter(model => model.capacityRange === capacityRange);
    }

    if (powerType) {
      models = models.filter(model => model.powerType.includes(powerType));
    }

    return models;
  }

  async uploadBrochure(insertBrochure: InsertBrochure): Promise<Brochure> {
    const id = this.currentBrochureId++;
    const brochure: Brochure = { ...insertBrochure, id };
    this.brochures.set(id, brochure);
    return brochure;
  }

  async getBrochuresByBrand(brand: string): Promise<Brochure[]> {
    return Array.from(this.brochures.values()).filter(
      brochure => brochure.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  async getBrochuresByModel(brand: string, model: string): Promise<Brochure[]> {
    return Array.from(this.brochures.values()).filter(brochure =>
      brochure.brand.toLowerCase() === brand.toLowerCase() &&
      brochure.model.toLowerCase() === model.toLowerCase()
    );
  }

  async getAllBrochures(): Promise<Brochure[]> {
    return Array.from(this.brochures.values());
  }

  async deleteBrochure(id: number): Promise<boolean> {
    return this.brochures.delete(id);
  }

  async updateModelBrochureUrl(modelId: number, brochureUrl: string): Promise<boolean> {
    const model = this.forkliftModels.get(modelId);
    if (model) {
      model.brochureUrl = brochureUrl;
      return true;
    }
    return false;
  }

  async importSpecificationData(specs: any[]): Promise<boolean> {
    try {
      for (const spec of specs) {
        if (spec.brand && spec.model) {
          const id = this.currentForkliftId++;
          const newModel: ForkliftModel = {
            id,
            brand: spec.brand,
            model: spec.model,
            tier: this.normalizeTier(spec.tier || 'MID'),
            loadCapacity: this.parseCapacity(spec.loadCapacity || spec.capacity),
            liftHeight: this.parseLiftHeight(spec.liftHeight || spec.height),
            powerType: this.normalizePowerType(spec.powerType || 'LPG/Diesel'),
            operatingWeight: this.parseWeight(spec.operatingWeight || spec.weight),
            turnRadius: parseFloat(spec.turnRadius) || 85,
            travelSpeed: spec.travelSpeed || "11.0",
            priceRangeMin: parseFloat(spec.priceMin) || 35000,
            priceRangeMax: parseFloat(spec.priceMax) || 42000,
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

  async updateModelSpecifications(modelId: number, specs: any): Promise<boolean> {
    const model = this.forkliftModels.get(modelId);
    if (model) {
      Object.assign(model, specs);
      return true;
    }
    return false;
  }

  async updateModelSpecificationsFromBrochure(brand: string, model: string, specs: any): Promise<boolean> {
    // Find existing model
    const existingModel = Array.from(this.forkliftModels.values()).find(m =>
      m.brand.toLowerCase() === brand.toLowerCase() &&
      m.model.toLowerCase() === model.toLowerCase()
    );

    if (existingModel) {
      // Update existing model with brochure specs
      const updatedModel = this.mergeModelWithBrochureSpecs(existingModel, specs);
      this.forkliftModels.set(existingModel.id, updatedModel);
    } else {
      // Create new model from brochure specs
      const id = this.currentForkliftId++;
      const newModel: ForkliftModel = this.createModelFromBrochureSpecs(id, brand, model, specs);
      this.forkliftModels.set(id, newModel);
    }

    return true;
  }

  private createModelFromBrochureSpecs(id: number, brand: string, model: string, specs: any): ForkliftModel {
    return {
      id,
      brand,
      model,
      tier: this.normalizeTier(specs.tier || 'MID'),
      loadCapacity: this.parseCapacity(specs.capacityOptions?.[0] || specs.loadCapacity),
      liftHeight: this.extractLiftHeight(specs.liftHeightRange || '190'),
      powerType: this.normalizePowerType(specs.powerTypes?.join('/') || 'LPG/Diesel'),
      operatingWeight: this.extractOperatingWeight(specs.operatingWeightRange || '3800'),
      turnRadius: parseFloat(specs.turningRadius) || 85,
      travelSpeed: this.extractTravelSpeed(specs.travelSpeed || '11.0'),
      priceRangeMin: specs.priceRange?.min || 35000,
      priceRangeMax: specs.priceRange?.max || 42000,
      warranty: this.extractWarranty(specs.warranty?.period || '12'),
      availability: "2-3 weeks",
      overallScore: "8.0",
      capacityRange: specs.capacityRange || "2000-3500 kg",
      brochureUrl: null
    };
  }

  private mergeModelWithBrochureSpecs(existingModel: ForkliftModel, specs: any): ForkliftModel {
    return {
      ...existingModel,
      // Update with brochure data where available
      loadCapacity: this.parseCapacity(specs.capacityOptions?.[0] || existingModel.loadCapacity),
      liftHeight: this.extractLiftHeight(specs.liftHeightRange || existingModel.liftHeight.toString()),
      powerType: this.normalizePowerType(specs.powerTypes?.join('/') || existingModel.powerType),
      operatingWeight: this.extractOperatingWeight(specs.operatingWeightRange || existingModel.operatingWeight.toString()),
      turnRadius: parseFloat(specs.turningRadius) || existingModel.turnRadius,
      travelSpeed: this.extractTravelSpeed(specs.travelSpeed || existingModel.travelSpeed),
      warranty: this.extractWarranty(specs.warranty?.period || existingModel.warranty.toString()),
      capacityRange: specs.capacityRange || existingModel.capacityRange
    };
  }

  private normalizePowerType(powerType: string): string {
    if (!powerType) return 'LPG/Diesel';
    return powerType.replace(/\s+/g, '').replace(/,/g, '/');
  }

  private extractLiftHeight(heightRange: string): number {
    const match = heightRange.match(/(\d+)/);
    return match ? parseInt(match[1]) : 190;
  }

  private extractOperatingWeight(weightRange: string): number {
    const match = weightRange.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3800;
  }

  private extractTravelSpeed(speed: string): string {
    const match = speed.match(/(\d+\.?\d*)/);
    return match ? match[1] : "11.0";
  }

  private extractWarranty(warranty: string): number {
    const match = warranty.match(/(\d+)/);
    return match ? parseInt(match[1]) : 12;
  }

  async addCompetitorQuote(insertQuote: InsertCompetitorQuote): Promise<CompetitorQuote> {
    const id = this.currentQuoteId++;
    const quote: CompetitorQuote = { 
      ...insertQuote, 
      id,
      uploadedAt: new Date().toISOString()
    };
    this.competitorQuotes.set(id, quote);
    return quote;
  }

  async getCompetitorQuotesByModel(brand: string, model: string): Promise<CompetitorQuote[]> {
    return Array.from(this.competitorQuotes.values()).filter(quote =>
      quote.brand.toLowerCase() === brand.toLowerCase() &&
      quote.model.toLowerCase() === model.toLowerCase()
    );
  }

  async getAllCompetitorQuotes(): Promise<CompetitorQuote[]> {
    return Array.from(this.competitorQuotes.values());
  }

  async updateCompetitorQuote(id: number, updateData: Partial<InsertCompetitorQuote>): Promise<boolean> {
    const quote = this.competitorQuotes.get(id);
    if (quote) {
      Object.assign(quote, updateData);
      return true;
    }
    return false;
  }

  async deleteCompetitorQuote(id: number): Promise<boolean> {
    return this.competitorQuotes.delete(id);
  }

  async updateOrCreateModel(modelData: any): Promise<{updated?: boolean, created?: boolean}> {
    // Find existing model
    const existingModel = Array.from(this.forkliftModels.values()).find(model =>
      model.brand.toLowerCase() === modelData.brand?.toLowerCase() &&
      model.model.toLowerCase() === modelData.model?.toLowerCase()
    );

    if (existingModel) {
      // Update existing model
      const updatedModel: ForkliftModel = {
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
      // Create new model
      const id = this.currentForkliftId++;
      const newModel: ForkliftModel = {
        id,
        brand: modelData.brand || 'Unknown',
        model: modelData.model || 'Unknown',
        tier: this.normalizeTier(modelData.tier || 'MID'),
        loadCapacity: this.parseCapacity(modelData.loadCapacity || 2500),
        liftHeight: this.parseLiftHeight(modelData.liftHeight || 190),
        powerType: this.normalizePowerType(modelData.powerType || 'LPG/Diesel'),
        operatingWeight: this.parseWeight(modelData.operatingWeight || 3800),
        turnRadius: parseFloat(modelData.turnRadius) || 85,
        travelSpeed: modelData.travelSpeed || "11.0",
        priceRangeMin: parseFloat(modelData.priceRangeMin) || 35000,
        priceRangeMax: parseFloat(modelData.priceRangeMax) || 42000,
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

  private normalizeTier(tier: string): string {
    const tierUpper = tier.toUpperCase();
    if (tierUpper.includes('ENTRY') || tierUpper.includes('ENT')) return 'ENTRY';
    if (tierUpper.includes('MID')) return 'MID';
    if (tierUpper.includes('PREMIUM') || tierUpper.includes('PREM')) return 'PREMIUM';
    if (tierUpper.includes('SUPER') || tierUpper.includes('HEAVY')) return 'SUPERHEAVY';
    return 'MID';
  }

  private parseCapacity(capacity: any): number {
    if (typeof capacity === 'number') return capacity;
    if (typeof capacity === 'string') {
      const match = capacity.match(/(\d+)/);
      return match ? parseInt(match[1]) : 2500;
    }
    return 2500;
  }

  private parseLiftHeight(height: any): number {
    if (typeof height === 'number') return height;
    if (typeof height === 'string') {
      const match = height.match(/(\d+)/);
      return match ? parseInt(match[1]) : 190;
    }
    return 190;
  }

  private parseWeight(weight: any): number {
    if (typeof weight === 'number') return weight;
    if (typeof weight === 'string') {
      const match = weight.match(/(\d+)/);
      return match ? parseInt(match[1]) : 3800;
    }
    return 3800;
  }

  private getCapacityRange(capacity: number): string {
    if (capacity <= 2000) return "1500-2000 kg";
    if (capacity <= 2500) return "2000-2500 kg";
    if (capacity <= 3000) return "2500-3000 kg";
    if (capacity <= 3500) return "3000-3500 kg";
    return "3500+ kg";
  }

  async deleteForkliftModel(id: number): Promise<boolean> {
    return this.forkliftModels.delete(id);
  }

  async updateForkliftModel(id: number, updates: Partial<ForkliftModel>): Promise<boolean> {
    const model = this.forkliftModels.get(id);
    if (model) {
      Object.assign(model, updates);
      return true;
    }
    return false;
  }

  async getDistributorDetailsByBrand(brand: string): Promise<DistributorDetails[]> {
    return Array.from(this.distributorDetails.values()).filter(
      details => details.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  async getDistributorDetailsByRegion(region: string): Promise<DistributorDetails[]> {
    return Array.from(this.distributorDetails.values()).filter(
      details => details.region.toLowerCase() === region.toLowerCase()
    );
  }

  async getAllDistributorDetails(): Promise<DistributorDetails[]> {
    return Array.from(this.distributorDetails.values());
  }

  async addDistributorDetails(details: InsertDistributorDetails): Promise<DistributorDetails> {
    const id = this.currentDistributorId++;
    const distributor: DistributorDetails = { ...details, id };
    this.distributorDetails.set(id, distributor);
    return distributor;
  }

  async updateDistributorDetails(id: number, details: Partial<InsertDistributorDetails>): Promise<boolean> {
    const distributor = this.distributorDetails.get(id);
    if (distributor) {
      Object.assign(distributor, details);
      return true;
    }
    return false;
  }

  async deleteDistributorDetails(id: number): Promise<boolean> {
    return this.distributorDetails.delete(id);
  }

  async generateAIInsights(distributorId: number): Promise<string> {
    const distributor = this.distributorDetails.get(distributorId);
    if (!distributor) {
      throw new Error("Distributor not found");
    }

    // Generate AI insights based on distributor data
    return `AI Analysis for ${distributor.companyName}: Strong market presence in ${distributor.region} with excellent customer service ratings. Recommended for ${distributor.brand} dealership expansion.`;
  }
}

export const storage = new MemStorage();