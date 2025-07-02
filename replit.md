# Forklift Comparison Application

## Overview

This is a comprehensive forklift comparison platform built to assist sales professionals in analyzing competitive equipment, managing pricing intelligence, and making data-driven sales decisions. The application features AI-powered brochure scanning, drag-and-drop tier management, competitor quote management, and advanced search capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Styling**: TailwindCSS with Shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom theming
- **Drag & Drop**: @dnd-kit for modern drag-and-drop interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with structured JSON responses
- **File Processing**: Multer for multipart file uploads
- **PDF Processing**: pdf-parse for document text extraction

### Database Layer
- **Database**: PostgreSQL (configured for future use)
- **ORM**: Drizzle ORM with schema-first approach
- **Migration**: Drizzle Kit for database migrations
- **Data Storage**: Currently using file-based persistence with planned PostgreSQL migration

## Key Components

### AI Integration
- **Primary AI**: OpenAI GPT-4o for document analysis and specification extraction
- **Secondary AI**: Anthropic Claude Sonnet 4 for alternative processing
- **Use Cases**: 
  - Automatic brochure content extraction
  - Fuel type detection
  - Specification parsing and standardization
  - Competitive analysis insights

### Data Models
- **Forklift Models**: Core equipment specifications with tier classification (ENTRY/MID/PREMIUM)
- **Brochures**: Document management with AI-extracted metadata
- **Competitor Quotes**: Pricing intelligence with quote tracking
- **Distributor Details**: Partner and supplier information management

### User Interface Features
- **Brand Grid**: Visual organization of equipment by manufacturer
- **Drag-and-Drop**: Tier reordering with react-beautiful-dnd
- **Comparison Modal**: Side-by-side specification analysis
- **Advanced Search**: Multi-criteria filtering and search
- **Help System**: Comprehensive user documentation and guides

## Data Flow

### Document Processing Workflow
1. User uploads PDF brochure via file input
2. AI scanner extracts text content using pdf-parse
3. OpenAI/Anthropic processes text for structured data
4. System validates and stores extracted specifications
5. Equipment database is updated with new information
6. UI reflects changes in real-time via React Query cache invalidation

### Comparison Workflow
1. User selects multiple equipment models from brand grid
2. Selection state managed in React component state
3. Comparison modal displays side-by-side specifications
4. Data fetched from backend API with caching
5. Visual indicators highlight best values per category

### Pricing Intelligence Flow
1. Competitor quotes uploaded and processed
2. AI extracts pricing and specification data
3. Historical pricing trends calculated
4. Market intelligence insights generated
5. Sales recommendations provided based on competitive analysis

## External Dependencies

### Core Libraries
- **React Ecosystem**: React 18, TypeScript, Wouter routing
- **UI Framework**: TailwindCSS, Radix UI, Shadcn/ui components
- **State Management**: TanStack Query for server state
- **File Processing**: Multer, pdf-parse for document handling

### AI Services
- **OpenAI**: GPT-4o model for document analysis (primary)
- **Anthropic**: Claude Sonnet 4 for document analysis (secondary)
- **API Keys**: Environment variables for service authentication

### Database
- **Current**: File-based JSON storage for development
- **Planned**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with TypeScript schema definitions

## Deployment Strategy

### Development Environment
- **Build Tool**: Vite with React plugin for fast development
- **Development Server**: Express with Vite middleware integration
- **Hot Reload**: Full-stack hot reloading with Vite HMR
- **TypeScript**: Shared types between client and server

### Production Considerations
- **Build Process**: Vite production build with code splitting
- **Static Assets**: Served via Express static middleware
- **Environment Variables**: Separate configs for development/production
- **Error Handling**: Comprehensive error boundaries and API error handling

### File Storage
- **Uploads Directory**: Structured file organization (brochures/, quotes/)
- **Static Serving**: Express middleware for uploaded file access
- **Backup Strategy**: Data persistence layer with JSON backup system

## Changelog

- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.