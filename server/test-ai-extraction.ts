import { brochureScanner } from './ai-brochure-scanner.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAIExtraction() {
  try {
    console.log('Starting AI brochure scanning test...');
    
    // Test with Toyota brochure
    const pdfPath = path.join(__dirname, '../uploads/brochures/brochure-1750071940153-841576755.pdf');
    console.log('Processing:', pdfPath);
    
    const specs = await brochureScanner.scanBrochure(pdfPath, 'Toyota', '8FG FD Series', 'anthropic');
    
    console.log('\n=== EXTRACTED SPECIFICATIONS ===');
    console.log('Brand:', specs.brand);
    console.log('Model:', specs.model);
    console.log('Series:', specs.series);
    console.log('Capacity Range:', specs.capacityRange);
    console.log('Capacity Options:', specs.capacityOptions);
    console.log('Power Types:', specs.powerTypes);
    console.log('Engine:', specs.engineSpecs);
    console.log('Transmission:', specs.transmission);
    console.log('Lift Height Range:', specs.liftHeightRange);
    console.log('Operating Weight Range:', specs.operatingWeightRange);
    console.log('Load Center:', specs.loadCenter);
    console.log('Turning Radius:', specs.turningRadius);
    console.log('Travel Speed:', specs.travelSpeed);
    console.log('Warranty:', specs.warranty);
    console.log('Tier:', specs.tier);
    console.log('Features:', specs.features.slice(0, 5)); // First 5 features
    
    return specs;
  } catch (error) {
    console.error('AI Extraction Error:', error.message);
    return null;
  }
}

// Export for use in routes
export { testAIExtraction };