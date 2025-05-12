
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
console.log('The actual implementation is now in scripts/logo-downloader/');

// You can set the log level with an environment variable:
// LOG_LEVEL=DEBUG node scripts/download-logos.js
if (!process.env.LOG_LEVEL) {
  // Setting to DEBUG for more verbose output
  process.env.LOG_LEVEL = 'DEBUG';
}

// Import and execute the module implementation
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Forward the execution to the modular implementation
const logoDownloader = require('./logo-downloader/index.js');
