const fs = require('fs');
const path = require('path');

// Simple test to check if PDF exists and API keys work
async function testAIScanning() {
  console.log('=== AI Brochure Scanning Test ===');
  
  // Check if PDF exists
  const pdfPath = path.join('uploads/brochures/brochure-1750071940153-841576755.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.log('PDF file not found at:', pdfPath);
    return;
  }
  
  console.log('✓ PDF file found:', pdfPath);
  
  // Check API keys
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  
  console.log('✓ Anthropic API Key:', hasAnthropic ? 'Available' : 'Missing');
  console.log('✓ OpenAI API Key:', hasOpenAI ? 'Available' : 'Missing');
  
  if (hasAnthropic && hasOpenAI) {
    console.log('\n✓ All requirements met for AI brochure scanning');
    console.log('✓ Ready to extract real specifications from PDF brochures');
  }
}

testAIScanning();