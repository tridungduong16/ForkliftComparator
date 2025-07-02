// Convert all forklift weights from pounds to kilograms
// This script will help standardize all measurements

const conversions = {
  // Load capacity conversions (from lbs to kg)
  4400: 2000,  // 2 tonne
  5500: 2500,  // 2.5 tonne  
  6600: 3000,  // 3 tonne
  7700: 3500,  // 3.5 tonne
  
  // Operating weight conversions (from lbs to kg)
  8200: 3720,
  8400: 3810,
  8600: 3900,
  8800: 3990,
  9000: 4080,
  9200: 4170,
  9400: 4260,
  9600: 4350,
  9800: 4440,
  10000: 4540,
  10200: 4630,
  10400: 4720,
  10600: 4810,
  10800: 4900
};

console.log('Weight conversion reference:', conversions);