
#!/usr/bin/env node

/**
 * TV Logo Downloader Script
 * 
 * This utility downloads TV channel logos from the tv-logo/tv-logos GitHub repository
 * and organizes them by category in your project's public/logos folder.
 * 
 * How to use:
 * 1. Make sure you're in the project root directory
 * 2. Run: node scripts/logo-downloader/index.js
 */

const { findProjectRoot, initLogosDirectory } = require('./utils/path-utils');
const { downloadAllLogos } = require('./downloader');
const { displaySummary, showRunningInstructions } = require('./helpers/ui-helpers');

async function main() {
  try {
    // Find project root
    const projectRoot = findProjectRoot();
    console.log(`Project root detected at: ${projectRoot}`);
    
    // Initialize logos directory
    const baseDir = initLogosDirectory(projectRoot);
    
    // Download all logos
    const stats = await downloadAllLogos(baseDir);
    
    // Display summary
    displaySummary(stats);
    
    // Check if any logos were actually found
    const anyLogosExist = stats.totalSuccessful > 0;
    
    if (!anyLogosExist) {
      console.warn("\n⚠️ WARNING: No logos were found after download!");
      showRunningInstructions();
    } else {
      console.log('Script finished successfully');
    }
  } catch (err) {
    console.error('Script error:', err);
    showRunningInstructions();
  }
}

// Run the main function
main();
