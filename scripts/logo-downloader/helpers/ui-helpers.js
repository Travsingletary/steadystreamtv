
/**
 * UI and output helpers for the TV Logo Downloader
 */
const logger = require('../utils/logger');

/**
 * Displays a summary of the download results
 * @param {Object} stats - The download statistics
 */
const displaySummary = (stats) => {
  const { totalAttempted, totalSuccessful, totalFailed, categoryStats } = stats;
  
  logger.section('Download Summary');
  logger.info(`Total attempted: ${totalAttempted}`);
  logger.info(`Successfully downloaded: ${totalSuccessful}`);
  logger.info(`Failed downloads: ${totalFailed}`);
  logger.info(`Success rate: ${((totalSuccessful / totalAttempted) * 100).toFixed(2)}%`);
  
  logger.section('Category Details');
  for (const [category, stats] of Object.entries(categoryStats)) {
    logger.info(`${category}: ${stats.successful}/${stats.total} (${stats.failed} failed)`);
  }
  
  logger.section('How to use these logos');
  logger.info('The logos are now available in your application at:');
  logger.info('/public/logos/{category}/{channel-name}.png');
  logger.info('Example: /public/logos/sports/espn.png');
};

/**
 * Displays instructions on how to run the script
 */
const showRunningInstructions = () => {
  logger.section('HOW TO RUN THIS SCRIPT');
  logger.info("If you're getting 'module not found' errors, try one of these approaches:");
  logger.info("1. Make the script executable:");
  logger.info("   chmod +x scripts/download-logos.js");
  logger.info("   ./scripts/download-logos.js");
  logger.info("\n2. Use the full path:");
  logger.info("   node /absolute/path/to/scripts/logo-downloader/index.js");
  logger.info("\n3. Run from project root:");
  logger.info("   cd /path/to/your/project");
  logger.info("   node scripts/logo-downloader/index.js");
};

module.exports = {
  displaySummary,
  showRunningInstructions
};
