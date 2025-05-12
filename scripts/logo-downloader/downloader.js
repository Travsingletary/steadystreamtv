
/**
 * Core downloader functionality for the TV Logo Downloader
 */
const path = require('path');
const { downloadFile } = require('./utils/download-utils');
const { createCategoryDirectory } = require('./utils/path-utils');
const { getConfig } = require('./config/categories-loader');
const logger = require('./utils/logger');

/**
 * Downloads all logos for all categories
 * @param {string} baseDir - The base directory for logos
 * @returns {Promise} A promise that resolves with download statistics
 */
async function downloadAllLogos(baseDir) {
  // Load configuration
  const config = getConfig();
  const { baseUrl, categories } = config;
  
  if (!categories || Object.keys(categories).length === 0) {
    logger.error('No categories found to download');
    return {
      totalAttempted: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      categoryStats: {}
    };
  }
  
  // Create summary counters
  let totalAttempted = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  let categoryStats = {};
  
  logger.section('TV LOGO DOWNLOADER');
  logger.info('Starting logo download process...');
  logger.info(`Base directory: ${baseDir}`);
  
  for (const [category, logos] of Object.entries(categories)) {
    logger.info(`\nDownloading ${category} logos...`);
    
    // Create category directory
    const categoryDir = createCategoryDirectory(baseDir, category);
    
    // Download each logo
    let categorySuccessful = 0;
    for (const logo of logos) {
      totalAttempted++;
      const url = `${baseUrl}${logo}.png`;
      const filePath = path.join(categoryDir, `${logo}.png`);
      
      try {
        await downloadFile(url, filePath);
        categorySuccessful++;
        totalSuccessful++;
      } catch (error) {
        logger.error(error);
        totalFailed++;
      }
    }
    
    categoryStats[category] = {
      total: logos.length,
      successful: categorySuccessful,
      failed: logos.length - categorySuccessful
    };
    
    logger.progress(`Category progress for ${category}`, categorySuccessful, logos.length);
  }
  
  return {
    totalAttempted,
    totalSuccessful,
    totalFailed,
    categoryStats
  };
}

module.exports = {
  downloadAllLogos
};node scripts/download-logos.js

