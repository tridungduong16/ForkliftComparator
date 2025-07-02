# Complete Forklift Comparison Application Code

## Overview
This is a comprehensive forklift comparison platform with AI-powered brochure scanning, drag-and-drop tier management, competitor pricing intelligence, and advanced search capabilities.

## Tech Stack
- **Frontend**: React 18, TypeScript, TailwindCSS, Wouter (routing)
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o, Anthropic Claude Sonnet 4
- **File Upload**: Multer
- **PDF Processing**: pdf-parse
- **Drag & Drop**: react-beautiful-dnd

## Key Features
- ✅ AI-powered brochure scanning with fuel type detection
- ✅ Capacity range input (From/To fields)
- ✅ Drag-and-drop tier management (visual reordering only)
- ✅ Data persistence across application restarts
- ✅ Competitor quote management
- ✅ Brand and series management
- ✅ Advanced search and filtering
- ✅ Comprehensive help system

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── brand-grid.tsx          # Main brand/series grid with drag-drop
│   │   │   ├── comparison-modal.tsx    # Model comparison interface
│   │   │   ├── help-menu.tsx          # Help navigation
│   │   │   ├── model-details-modal.tsx # Model details popup
│   │   │   ├── user-manual.tsx        # User documentation
│   │   │   └── ui/                    # Shadcn/ui components
│   │   ├── pages/
│   │   │   ├── home.tsx               # Landing page
│   │   │   ├── series-info.tsx        # Series details page
│   │   │   └── series-brochures.tsx   # Brochure management
│   │   ├── lib/
│   │   │   └── queryClient.ts         # React Query setup
│   │   ├── App.tsx                    # Main app component
│   │   └── index.css                  # Global styles
│   └── index.html
├── server/
│   ├── ai-brochure-scanner.ts         # AI document processing
│   ├── brochure-restoration.ts        # Data restoration utilities
│   ├── data-migration.ts              # Migration tools
│   ├── data-persistence.ts            # Backup/restore system
│   ├── db.ts                          # Database connection
│   ├── index.ts                       # Express server setup
│   ├── routes.ts                      # API endpoints
│   ├── storage.ts                     # Data access layer
│   └── vite.ts                        # Vite dev server integration
├── shared/
│   └── schema.ts                      # Database schema & types
├── uploads/                           # File storage directory
├── package.json                       # Dependencies
├── drizzle.config.ts                  # Database configuration
├── tailwind.config.ts                 # Tailwind configuration
└── vite.config.ts                     # Vite configuration
```

## Installation & Setup

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
# Required environment variables
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

3. **Push database schema**:
```bash
npm run db:push
```

4. **Start development server**:
```bash
npm run dev
```

5. **Access application**:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

## Database Schema

### Core Tables

**forklift_models**: Main product data
- id, brand, model, tier, loadCapacity, liftHeight
- powerType, operatingWeight, turnRadius, travelSpeed
- priceRangeMin, priceRangeMax, warranty, availability
- overallScore, capacityRange, brochureUrl

**brochures**: Document management
- id, filename, originalName, brand, model
- fileSize, uploadedAt, fileUrl, powerType, status

**competitorQuotes**: Pricing intelligence
- id, brand, model, competitorBrand, competitorModel
- quotedPrice, currency, capacity, liftHeight, powerType
- warranty, availability, quoteDate, supplierName

**distributorDetails**: Partner management
- id, brand, region, companyName, contactPerson
- services, certifications, territorySize, aiInsights

## API Endpoints

### Forklift Models
- `GET /api/forklift-models` - List all models
- `GET /api/forklift-models/brand/:brand` - Models by brand
- `POST /api/forklift-models` - Create new model
- `PUT /api/forklift-models/:id` - Update model
- `DELETE /api/forklift-models/:id` - Delete model

### Brochures
- `GET /api/brochures` - List all brochures
- `GET /api/brochures/brand/:brand` - Brochures by brand
- `POST /api/brochures/upload` - Upload brochure
- `DELETE /api/brochures/:id` - Delete brochure
- `POST /api/brochures/scan` - AI scan brochure

### Competitor Quotes
- `GET /api/competitor-quotes` - List all quotes
- `POST /api/competitor-quotes` - Add quote
- `PUT /api/competitor-quotes/:id` - Update quote
- `DELETE /api/competitor-quotes/:id` - Delete quote

### Distributors
- `GET /api/distributors` - List distributors
- `POST /api/distributors` - Add distributor
- `PUT /api/distributors/:id` - Update distributor

## Key Components

### BrandGrid Component
Main interface for managing forklift models with:
- Tier-based organization (ENTRY/MID/PREMIUM/SUPERHEAVY)
- Drag-and-drop reordering within tiers
- Capacity range input (From/To fields)
- Brand and series management dialogs

### AI Brochure Scanner
Processes PDF brochures to extract:
- Model specifications
- Fuel type detection (FD=Diesel, FG=LPG, etc.)
- Capacity ranges and technical details
- Pricing information when available

### Data Persistence System
Ensures data integrity with:
- Automatic backups on changes
- File integrity validation
- Restoration capabilities
- Migration tools for schema updates

## Capacity Range Implementation

The application now supports proper capacity range input:

```typescript
// Form state includes both individual values and combined range
const [newSeriesForm, setNewSeriesForm] = useState({
  capacityFrom: 2000,
  capacityTo: 3500,
  capacityRange: '2000-3500 kg'
});

// Auto-generates range string and average capacity
const capacityRange = `${seriesData.capacityFrom}-${seriesData.capacityTo} kg`;
const loadCapacity = Math.round((from + to) / 2);
```

### Form UI:
```jsx
<div className="grid grid-cols-2 gap-2">
  <div>
    <Label className="text-xs text-gray-600">From</Label>
    <Input type="number" value={capacityFrom} onChange={handleFromChange} />
  </div>
  <div>
    <Label className="text-xs text-gray-600">To</Label>
    <Input type="number" value={capacityTo} onChange={handleToChange} />
  </div>
</div>
<div className="text-xs text-gray-500 mt-1">
  Range: {capacityFrom}-{capacityTo} kg
</div>
```

## Build & Deployment

**Development**:
```bash
npm run dev
```

**Production Build**:
```bash
npm run build
npm start
```

**Type Checking**:
```bash
npm run check
```

**Database Operations**:
```bash
npm run db:push  # Push schema changes
```

## Configuration Files

### package.json
Contains all dependencies and scripts for the application.

### tailwind.config.ts
Tailwind CSS configuration with custom design system.

### drizzle.config.ts
Database configuration for schema management.

### vite.config.ts
Vite build tool configuration with React and TypeScript support.

## Security & Environment

The application requires these environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: For AI brochure scanning
- `ANTHROPIC_API_KEY`: Alternative AI provider
- `NODE_ENV`: development/production mode

## Recent Updates

### Capacity Range Input (Latest)
- ✅ Replaced single capacity field with From/To inputs
- ✅ Auto-generates capacity range string (e.g., "2000-3500 kg")
- ✅ Updates load capacity to average of range
- ✅ Applied to both new series and edit series forms
- ✅ Shows live preview of capacity range

### Drag & Drop Functionality
- ✅ Visual-only reordering within same tier
- ✅ Prevents cross-tier moves (use Edit button for tier changes)
- ✅ Maintains data integrity
- ✅ Clear user feedback for invalid operations

### AI Integration
- ✅ Fuel type pattern recognition (FD=Diesel, FG=LPG/Gas)
- ✅ Automatic specification extraction
- ✅ Model naming convention detection
- ✅ Comprehensive error handling

This application provides a complete solution for forklift comparison and management with modern web technologies and AI-powered features.