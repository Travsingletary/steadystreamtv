
/**
 * UI and output helpers for the TV Logo Downloader
 */

/**
 * Displays a summary of the download results
 * @param {Object} stats - The download statistics
 */
const displaySummary = (stats) => {
  const { totalAttempted, totalSuccessful, totalFailed, categoryStats } = stats;
  
  console.log('\n=== Download Summary ===');
  console.log(`Total attempted: ${totalAttempted}`);
  console.log(`Successfully downloaded: ${totalSuccessful}`);
  console.log(`Failed downloads: ${totalFailed}`);
  console.log(`Success rate: ${((totalSuccessful / totalAttempted) * 100).toFixed(2)}%`);
  
  console.log('\n=== Category Details ===');
  for (const [category, stats] of Object.entries(categoryStats)) {
    console.log(`${category}: ${stats.successful}/${stats.total} (${stats.failed} failed)`);
  }
  
  console.log('\n=== How to use these logos ===');
  console.log('The logos are now available in your application at:');
  console.log('/public/logos/{category}/{channel-name}.png');
  console.log('Example: /public/logos/sports/espn.png\n');
};

/**
 * Displays instructions on how to run the script
 */
const showRunningInstructions = () => {
  console.log("\n=== HOW TO RUN THIS SCRIPT ===");
  console.log("If you're getting 'module not found' errors, try one of these approaches:");
  console.log("1. Make the script executable:");
  console.log("   chmod +x scripts/download-logos.js");
  console.log("   ./scripts/download-logos.js");
  console.log("\n2. Use the full path:");
  console.log("   node /absolute/path/to/scripts/logo-downloader/index.js");
  console.log("\n3. Run from project root:");
  console.log("   cd /path/to/your/project");
  console.log("   node scripts/logo-downloader/index.js");
};

module.exports = {
  displaySummary,
  showRunningInstructions
};
