
/**
 * Core downloader functionality for the TV Logo Downloader
 */
const { categories, baseUrl } = require('./config/categories');
const { downloadFile } = require('./utils/download-utils');
const { createCategoryDirectory } = require('./utils/path-utils');
const path = require('path');

/**
 * Downloads all logos for all categories
 * @param {string} baseDir - The base directory for logos
 * @returns {Promise} A promise that resolves with download statistics
 */
async function downloadAllLogos(baseDir) {
  // Create summary counters
  let totalAttempted = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  let categoryStats = {};
  
  console.log('\n====== TV LOGO DOWNLOADER ======');
  console.log('Starting logo download process...');
  console.log(`Base directory: ${baseDir}`);
  
  for (const [category, logos] of Object.entries(categories)) {
    console.log(`\nDownloading ${category} logos...`);
    
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
        console.log(`  ✅ Downloaded: ${logo}.png`);
        categorySuccessful++;
        totalSuccessful++;
      } catch (error) {
        console.error(`  ❌ Error: ${error}`);
        totalFailed++;
      }
    }
    
    categoryStats[category] = {
      total: logos.length,
      successful: categorySuccessful,
      failed: logos.length - categorySuccessful
    };
    
    console.log(`  Category progress: ${categorySuccessful}/${logos.length} logos downloaded`);
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
};
