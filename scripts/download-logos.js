
#!/usr/bin/env node

/**
 * TV Logo Downloader Script
 * 
 * This utility downloads TV channel logos from the tv-logo/tv-logos GitHub repository
 * and organizes them by category in your project's public/logos folder.
 * 
 * How to use:
 * 1. Make sure you're in the project root directory
 * 2. Run: node scripts/download-logos.js
 *    OR with npx: npx @iptv/download-logos
 */

// This file serves as a compatibility wrapper around the modular version
console.log('Starting TV Logo Downloader...');
console.log('Note: This script has been refactored into a modular structure.');

// You can set the log level with an environment variable:
// LOG_LEVEL=DEBUG node scripts/download-logos.js
if (!process.env.LOG_LEVEL) {
  // Setting to DEBUG for more verbose output
  process.env.LOG_LEVEL = 'DEBUG';
}

// Import and execute the CommonJS module implementation directly
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Forward the execution to the CommonJS implementation
try {
  const logoDownloader = require('./download-logos.cjs');
  // If the CJS module exports a function, execute it
  if (typeof logoDownloader === 'function') {
    logoDownloader();
  }
} catch (error) {
  console.error('Failed to load logo downloader:', error);
  console.log('\nTrying alternative approach...');
  
  try {
    // Alternative: Try to run the logo-downloader module directly
    const altDownloader = require('./logo-downloader/index.js');
    if (typeof altDownloader === 'function') {
      altDownloader();
    }
  } catch (secondError) {
    console.error('All approaches failed. Error details:');
    console.error(secondError);
    
    console.log('\nManual instructions:');
    console.log('1. Run the CommonJS version directly:');
    console.log('   node scripts/download-logos.cjs');
    console.log('2. Or try the modular implementation:');
    console.log('   node scripts/logo-downloader/index.js');
  }
}
