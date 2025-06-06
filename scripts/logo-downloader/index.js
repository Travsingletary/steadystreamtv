
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
const logger = require('./utils/logger');

// Set log level from environment variable if present
if (process.env.LOG_LEVEL) {
  logger.setLogLevel(process.env.LOG_LEVEL);
}

async function main() {
  try {
    // Find project root
    const projectRoot = findProjectRoot();
    logger.info(`Project root detected at: ${projectRoot}`);
    
    // Initialize logos directory
    const baseDir = initLogosDirectory(projectRoot);
    
    // Download all logos
    const stats = await downloadAllLogos(baseDir);
    
    // Display summary
    displaySummary(stats);
    
    // Check if any logos were actually found
    const anyLogosExist = stats.totalSuccessful > 0;
    
    if (!anyLogosExist) {
      logger.warn("No logos were found after download!");
      showRunningInstructions();
    } else {
      logger.success('Script finished successfully');
    }
  } catch (err) {
    logger.error('Script error:', err);
    showRunningInstructions();
  }
}

// Run the main function
main();

// For ES module compatibility
module.exports = main;
