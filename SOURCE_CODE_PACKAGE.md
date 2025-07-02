# Complete Source Code Package - Forklift Comparison Application

## Main Application Files

### 1. Server Entry Point (`server/index.ts`)
```typescript
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
```

### 2. Database Schema (`shared/schema.ts`)
```typescript
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
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  competitorBrand: text("competitor_brand").notNull(),
  competitorModel: text("competitor_model").notNull(),
  quoteRef: text("quote_ref"),
  quotedPrice: decimal("quoted_price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("AUD").notNull(),
  capacity: text("capacity"),
  liftHeight: text("lift_height"),
  powerType: text("power_type"),
  specialFeatures: text("special_features"),
  warranty: text("warranty"),
  availability: text("availability"),
  terms: text("terms"),
  validity: text("validity"),
  supplierName: text("supplier_name"),
  supplierContact: text("supplier_contact"),
  quoteDate: text("quote_date").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  filename: text("filename"),
  fileUrl: text("file_url"),
  notes: text("notes"),
  status: text("status").default("active").notNull(),
});

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
  businessType: text("business_type").default("distributor").notNull(),
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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Type exports
export const insertForkliftModelSchema = createInsertSchema(forkliftModels).omit({ id: true });
export const insertBrochureSchema = createInsertSchema(brochures).omit({ id: true });
export const insertCompetitorQuoteSchema = createInsertSchema(competitorQuotes).omit({ id: true });
export const insertDistributorDetailsSchema = createInsertSchema(distributorDetails).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });

export type InsertForkliftModel = z.infer<typeof insertForkliftModelSchema>;
export type ForkliftModel = typeof forkliftModels.$inferSelect;
export type InsertBrochure = z.infer<typeof insertBrochureSchema>;
export type Brochure = typeof brochures.$inferSelect;
export type InsertCompetitorQuote = z.infer<typeof insertCompetitorQuoteSchema>;
export type CompetitorQuote = typeof competitorQuotes.$inferSelect;
export type InsertDistributorDetails = z.infer<typeof insertDistributorDetailsSchema>;
export type DistributorDetails = typeof distributorDetails.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
```

### 3. Database Connection (`server/db.ts`)
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### 4. Main App Component (`client/src/App.tsx`)
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import LPGComparison from "@/pages/lpg-comparison";
import DieselComparison from "@/pages/diesel-comparison";
import Admin from "@/pages/admin";
import DataImport from "@/pages/data-import";
import BrochureManager from "@/pages/brochure-manager";
import SeriesManager from "@/pages/series-manager";
import SeriesInfo from "@/pages/series-info";
import PricingIntelligence from "@/pages/pricing-intelligence";
import BulkDataImport from "@/pages/bulk-data-import";
import AdvancedComparison from "@/components/advanced-comparison";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lpg" component={LPGComparison} />
      <Route path="/diesel" component={DieselComparison} />
      <Route path="/admin" component={Admin} />
      <Route path="/brochure-manager" component={BrochureManager} />
      <Route path="/data-import" component={DataImport} />
      <Route path="/bulk-import" component={BulkDataImport} />
      <Route path="/pricing-intelligence" component={PricingIntelligence} />
      <Route path="/series/:brand/:series/manage" component={SeriesManager} />
      <Route path="/series/:brand/:series/info" component={SeriesInfo} />
      <Route path="/advanced-comparison" component={AdvancedComparison} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### 5. Configuration Files

#### package.json
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.10.0",
    "@jridgewell/trace-mapping": "^0.3.25",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.60.5",
    "@types/multer": "^1.4.13",
    "@types/pdf-parse": "^1.1.5",
    "@types/react-beautiful-dnd": "^13.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "embla-carousel-react": "^8.6.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.453.0",
    "memorystore": "^1.6.7",
    "multer": "^2.0.1",
    "next-themes": "^0.4.6",
    "openai": "^5.3.0",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pdf-parse": "^1.1.1",
    "react": "^18.3.1",
    "react-beautiful-dnd": "^13.1.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.2.5",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@replit/vite-plugin-cartographer": "^0.2.7",
    "@replit/vite-plugin-runtime-error-modal": "^0.0.3",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.1.3",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  },
  "optionalDependencies": {
    "bufferutil": "^4.0.8"
  }
}
```

## Key Features Implemented

### Capacity Range Input System
The application now includes sophisticated capacity range input with:
- Separate "From" and "To" input fields
- Auto-generation of capacity range strings (e.g., "2000-3500 kg")
- Automatic calculation of average load capacity
- Live preview of the capacity range
- Parsing of existing ranges for editing

### AI Brochure Scanner
- Fuel type detection (FD=Diesel, FG=LPG/Gas, G=Gas, D=Diesel)
- Automatic specification extraction
- Model naming convention recognition
- Comprehensive error handling

### Drag & Drop Interface
- Visual-only reordering within same tier
- Prevention of cross-tier moves (Edit button required for tier changes)
- Maintains data integrity
- Clear user feedback for invalid operations

### Data Persistence
- Automatic backups on changes
- File integrity validation
- Restoration capabilities
- Migration tools for schema updates

## Environment Setup

Required environment variables:
```bash
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=development
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Push database schema
npm run db:push
```

The application runs on port 5000 and serves both the API and frontend from the same server.