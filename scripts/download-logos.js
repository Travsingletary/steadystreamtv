
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
  // Default to INFO if not set
  process.env.LOG_LEVEL = 'INFO';
}

// Forward the execution to the modular implementation
require('./logo-downloader/index.js');
