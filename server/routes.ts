import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import multer from 'multer';
import { db } from './db';
import { forkliftModels, brochures, quotes } from '../shared/schema';
import { eq, like, and, or, sql, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import { extractTextFromPDF } from './ai-brochure-scanner';

const app = new Hono();

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
    console.warn('   Please set OPENAI_API_KEY in your .env file to enable AI functionality.');
  } else {
    openai = new OpenAI({ apiKey });
    console.log('✅ OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error);
  console.warn('   AI features will be disabled.');
}

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Serve static files
app.use('/uploads/*', serveStatic({ root: './' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.fieldname === 'quote' ? 'uploads/quotes' : 'uploads/brochures';
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    cb(null, `${file.fieldname}-${timestamp}-${random}.pdf`);
  }
});

const upload = multer({ storage });

// API Routes
app.get('/api/models', async (c) => {
  try {
    const models = await db.select().from(forkliftModels);
    return c.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return c.json({ error: 'Failed to fetch models' }, 500);
  }
});

app.get('/api/models/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const brand = c.req.query('brand');
    const fuelType = c.req.query('fuelType');
    const minCapacity = c.req.query('minCapacity');
    const maxCapacity = c.req.query('maxCapacity');

    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          like(forkliftModels.model, `%${query}%`),
          like(forkliftModels.brand, `%${query}%`),
          like(forkliftModels.series, `%${query}%`)
        )
      );
    }

    if (brand) {
      whereConditions.push(eq(forkliftModels.brand, brand));
    }

    if (fuelType) {
      whereConditions.push(eq(forkliftModels.fuelType, fuelType));
    }

    if (minCapacity) {
      whereConditions.push(sql`${forkliftModels.capacity} >= ${parseFloat(minCapacity)}`);
    }

    if (maxCapacity) {
      whereConditions.push(sql`${forkliftModels.capacity} <= ${parseFloat(maxCapacity)}`);
    }

    const models = await db.select().from(forkliftModels)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .limit(100);

    return c.json(models);
  } catch (error) {
    console.error('Error searching models:', error);
    return c.json({ error: 'Failed to search models' }, 500);
  }
});

app.get('/api/brands', async (c) => {
  try {
    const brands = await db.select({ brand: forkliftModels.brand })
      .from(forkliftModels)
      .groupBy(forkliftModels.brand)
      .orderBy(forkliftModels.brand);
    
    return c.json(brands.map(b => b.brand));
  } catch (error) {
    console.error('Error fetching brands:', error);
    return c.json({ error: 'Failed to fetch brands' }, 500);
  }
});

app.get('/api/fuel-types', async (c) => {
  try {
    const fuelTypes = await db.select({ fuelType: forkliftModels.fuelType })
      .from(forkliftModels)
      .groupBy(forkliftModels.fuelType)
      .orderBy(forkliftModels.fuelType);
    
    return c.json(fuelTypes.map(f => f.fuelType));
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    return c.json({ error: 'Failed to fetch fuel types' }, 500);
  }
});

app.get('/api/series', async (c) => {
  try {
    const brand = c.req.query('brand');
    let query = db.select({ 
      series: forkliftModels.series,
      brand: forkliftModels.brand 
    }).from(forkliftModels);

    if (brand) {
      query = query.where(eq(forkliftModels.brand, brand));
    }

    const series = await query
      .groupBy(forkliftModels.series, forkliftModels.brand)
      .orderBy(forkliftModels.brand, forkliftModels.series);
    
    return c.json(series);
  } catch (error) {
    console.error('Error fetching series:', error);
    return c.json({ error: 'Failed to fetch series' }, 500);
  }
});

app.get('/api/stats', async (c) => {
  try {
    const totalModels = await db.select({ count: sql`count(*)` }).from(forkliftModels);
    const totalBrands = await db.select({ count: sql`count(distinct brand)` }).from(forkliftModels);
    const totalBrochures = await db.select({ count: sql`count(*)` }).from(brochures);
    const totalQuotes = await db.select({ count: sql`count(*)` }).from(quotes);

    return c.json({
      totalModels: totalModels[0].count,
      totalBrands: totalBrands[0].count,
      totalBrochures: totalBrochures[0].count,
      totalQuotes: totalQuotes[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Brochure management routes
app.get('/api/brochures', async (c) => {
  try {
    const allBrochures = await db.select().from(brochures).orderBy(desc(brochures.uploadedAt));
    return c.json(allBrochures);
  } catch (error) {
    console.error('Error fetching brochures:', error);
    return c.json({ error: 'Failed to fetch brochures' }, 500);
  }
});

app.post('/api/brochures/upload', upload.single('brochure'), async (c) => {
  try {
    const file = c.req.file;
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const brochure = await db.insert(brochures).values({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      uploadedAt: new Date()
    }).returning();

    return c.json(brochure[0]);
  } catch (error) {
    console.error('Error uploading brochure:', error);
    return c.json({ error: 'Failed to upload brochure' }, 500);
  }
});

app.post('/api/brochures/:id/scan', async (c) => {
  try {
    if (!openai) {
      return c.json({ error: 'AI functionality is not available. Please configure OPENAI_API_KEY.' }, 503);
    }

    const brochureId = parseInt(c.req.param('id'));
    const brochure = await db.select().from(brochures).where(eq(brochures.id, brochureId)).limit(1);
    
    if (!brochure.length) {
      return c.json({ error: 'Brochure not found' }, 404);
    }

    const extractedData = await extractTextFromPDF(brochure[0].filePath, openai);
    
    // Update brochure with extracted data
    await db.update(brochures)
      .set({ 
        extractedData: JSON.stringify(extractedData),
        processedAt: new Date()
      })
      .where(eq(brochures.id, brochureId));

    return c.json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Error scanning brochure:', error);
    return c.json({ error: 'Failed to scan brochure' }, 500);
  }
});

app.delete('/api/brochures/:id', async (c) => {
  try {
    const brochureId = parseInt(c.req.param('id'));
    await db.delete(brochures).where(eq(brochures.id, brochureId));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting brochure:', error);
    return c.json({ error: 'Failed to delete brochure' }, 500);
  }
});

// Quote management routes
app.get('/api/quotes', async (c) => {
  try {
    const allQuotes = await db.select().from(quotes).orderBy(desc(quotes.uploadedAt));
    return c.json(allQuotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return c.json({ error: 'Failed to fetch quotes' }, 500);
  }
});

app.post('/api/quotes/upload', upload.single('quote'), async (c) => {
  try {
    const file = c.req.file;
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const quote = await db.insert(quotes).values({
      filename: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      uploadedAt: new Date()
    }).returning();

    return c.json(quote[0]);
  } catch (error) {
    console.error('Error uploading quote:', error);
    return c.json({ error: 'Failed to upload quote' }, 500);
  }
});

app.delete('/api/quotes/:id', async (c) => {
  try {
    const quoteId = parseInt(c.req.param('id'));
    await db.delete(quotes).where(eq(quotes.id, quoteId));
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return c.json({ error: 'Failed to delete quote' }, 500);
  }
});

// Bulk data import
app.post('/api/models/bulk-import', async (c) => {
  try {
    const data = await c.req.json();
    
    if (!Array.isArray(data)) {
      return c.json({ error: 'Data must be an array' }, 400);
    }

    const results = [];
    for (const item of data) {
      try {
        const model = await db.insert(forkliftModels).values({
          brand: item.brand,
          model: item.model,
          series: item.series || '',
          capacity: parseFloat(item.capacity) || 0,
          fuelType: item.fuelType || 'Electric',
          liftHeight: parseFloat(item.liftHeight) || 0,
          price: parseFloat(item.price) || 0,
          year: parseInt(item.year) || new Date().getFullYear(),
          specifications: item.specifications || {}
        }).returning();
        
        results.push({ success: true, model: model[0] });
      } catch (error) {
        results.push({ success: false, error: error.message, item });
      }
    }

    return c.json({ results });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return c.json({ error: 'Failed to import data' }, 500);
  }
});

export default app;