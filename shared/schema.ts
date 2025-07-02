import { pgTable, text, serial, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const forkliftModels = pgTable("forklift_models", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  tier: text("tier").notNull(), // "ENTRY", "MID", "PREMIUM"
  loadCapacity: integer("load_capacity").notNull(), // in pounds
  liftHeight: integer("lift_height").notNull(), // in inches
  powerType: text("power_type").notNull(), // "Electric", "Propane", "Diesel", "Gas"
  operatingWeight: integer("operating_weight").notNull(), // in pounds
  turnRadius: integer("turn_radius").notNull(), // in inches
  travelSpeed: decimal("travel_speed", { precision: 3, scale: 1 }).notNull(), // in mph
  priceRangeMin: integer("price_range_min").notNull(),
  priceRangeMax: integer("price_range_max").notNull(),
  warranty: integer("warranty").notNull(), // in months
  availability: text("availability").notNull(), // "In Stock", "2-4 weeks", "8-12 weeks"
  overallScore: decimal("overall_score", { precision: 2, scale: 1 }).notNull(),
  capacityRange: text("capacity_range").notNull(), // "3,000-5,000 lbs", etc.
  brochureUrl: text("brochure_url"), // URL to uploaded brochure PDF
});

export const brochures = pgTable("brochures", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  fileUrl: text("file_url").notNull(),
  powerType: text("power_type"),
  status: text("status").default("uploaded"),
});

export const competitorQuotes = pgTable("competitor_quotes", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(), // Which brand this quote is for
  model: text("model").notNull(), // Which model this quote is for
  competitorBrand: text("competitor_brand").notNull(), // e.g., "Clark"
  competitorModel: text("competitor_model").notNull(), // e.g., "LEP25"
  quoteRef: text("quote_ref"), // e.g., "QQ250217SK"
  quotedPrice: decimal("quoted_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("AUD").notNull(),
  capacity: text("capacity"), // e.g., "2,500kg"
  liftHeight: text("lift_height"), // e.g., "4,800mm"
  powerType: text("power_type"), // e.g., "Lithium-ION"
  specialFeatures: text("special_features"), // Key features from quote
  warranty: text("warranty"), // e.g., "3Yrs/3,000hrs battery, 1Yr/1000hrs machine"
  availability: text("availability"), // e.g., "In stock now"
  terms: text("terms"), // Payment terms
  validity: text("validity"), // Quote validity period
  supplierName: text("supplier_name"), // e.g., "Clark Equipment Sales Pty Ltd"
  supplierContact: text("supplier_contact"), // Contact details
  quoteDate: text("quote_date").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  filename: text("filename"), // PDF filename if uploaded
  fileUrl: text("file_url"), // URL to quote PDF
  notes: text("notes"), // Internal notes about the quote
  status: text("status").default("active").notNull(), // active, expired, won, lost
});

export const insertForkliftModelSchema = createInsertSchema(forkliftModels).omit({
  id: true,
});

export const insertBrochureSchema = createInsertSchema(brochures).omit({
  id: true,
});

export const insertCompetitorQuoteSchema = createInsertSchema(competitorQuotes).omit({
  id: true,
});

export type InsertForkliftModel = z.infer<typeof insertForkliftModelSchema>;
export type ForkliftModel = typeof forkliftModels.$inferSelect;
export type InsertBrochure = z.infer<typeof insertBrochureSchema>;
export type Brochure = typeof brochures.$inferSelect;
export type InsertCompetitorQuote = z.infer<typeof insertCompetitorQuoteSchema>;
export type CompetitorQuote = typeof competitorQuotes.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const distributorDetails = pgTable("distributor_details", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  region: text("region").notNull(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  businessType: text("business_type").default("distributor").notNull(), // distributor, importer, dealer
  services: text("services").array(),
  certifications: text("certifications").array(),
  yearsInBusiness: integer("years_in_business"),
  territorySize: text("territory_size"),
  stockLevels: text("stock_levels"),
  serviceCapability: text("service_capability"),
  aiInsights: text("ai_insights"),
  lastUpdated: text("last_updated").notNull(),
  status: text("status").default("active").notNull(),
  notes: text("notes"),
});

export const insertDistributorDetailsSchema = createInsertSchema(distributorDetails).omit({
  id: true,
});

export type InsertDistributorDetails = z.infer<typeof insertDistributorDetailsSchema>;
export type DistributorDetails = typeof distributorDetails.$inferSelect;
