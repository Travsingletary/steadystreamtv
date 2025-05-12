
#!/usr/bin/env node

/**
 * Simple TV Logo Downloader Script
 * 
 * This utility downloads TV channel logos from the tv-logo/tv-logos GitHub repository
 * and organizes them by category in your project's public/logos folder.
 * 
 * How to use:
 * 1. Make sure you're in the project root directory
 * 2. Run: node download-logos.cjs
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Configuration
const config = {
  baseUrl: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/world-wide/',
  categories: {
    entertainment: [
      "hbo", "amc", "fx", "tnt", "usa", "paramount", "showtime", "abc", "nbc", "cbs",
      "bet", "comedy-central", "tbs", "syfy", "bravo", "ae", "tlc", "history"
    ],
    sports: [
      "espn", "fox-sports", "nbc-sports", "mlb-network", "nfl-network", "nba-tv", 
      "cbs-sports", "golf", "sky-sports", "bein-sports", "dazn", "eurosport"
    ],
    movies: [
      "hbo", "showtime", "starz", "cinemax", "tmc", "sony-movies", "action-max", 
      "ifc", "sundance", "tcm", "film4", "mgm"
    ],
    news: [
      "cnn", "fox-news", "msnbc", "bbc-world", "al-jazeera", "bloomberg", "cnbc", 
      "sky-news", "euronews", "rt", "france24", "cbs-news"
    ],
    kids: [
      "disney-channel", "nickelodeon", "cartoon-network", "pbs-kids", "boomerang", 
      "discovery-kids", "baby-tv", "nick-jr", "disney-junior", "universal-kids"
    ],
    international: [
      "star-plus", "zee-tv", "univision", "telemundo", "tv5-monde", "rai", 
      "deutsche-welle", "globo", "tve", "nhk-world", "tvn", "canal+"
    ]
  }
};

// Logger with color support
const logger = {
  info: (message) => console.log('\x1b[36m%s\x1b[0m', message),
  success: (message) => console.log('\x1b[32m%s\x1b[0m', message),
  error: (message) => console.log('\x1b[31m%s\x1b[0m', message),
  warn: (message) => console.log('\x1b[33m%s\x1b[0m', message)
};

// Initialize and create the base logos directory
function initLogosDirectory() {
  const baseDir = path.join(process.cwd(), 'public', 'logos');
  logger.info(`Logos will be saved to: ${baseDir}`);

  // Create base logos directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    try {
      fs.mkdirSync(baseDir, { recursive: true });
      logger.info(`Created logos directory at: ${baseDir}`);
    } catch (error) {
      logger.error(`Failed to create directory: ${baseDir}`);
      process.exit(1);
    }
  }
  
  return baseDir;
}

// Create category directory if it doesn't exist
function createCategoryDirectory(baseDir, category) {
  const categoryDir = path.join(baseDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
    logger.info(`Created category directory: ${category}`);
  }
  return categoryDir;
}

// Download a file from URL to a specific path
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          logger.success(`Downloaded: ${path.basename(filePath)}`);
          resolve();
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlink(filePath, () => {});
        reject(`Logo not found at ${url}: 404 Not Found`);
      } else {
        file.close();
        fs.unlink(filePath, () => {}); // Delete the file
        reject(`Failed to download ${url}: ${response.statusCode}`);
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {}); // Delete the file
      reject(`Failed to download ${url}: ${err.message}`);
    });
  });
}

// Download all logos for a specific category
async function downloadCategoryLogos(baseDir, category, logos) {
  logger.info(`\nDownloading ${category} logos...`);
  
  // Create category directory
  const categoryDir = createCategoryDirectory(baseDir, category);
  
  let successful = 0;
  let failed = 0;
  
  // Download each logo
  for (const logo of logos) {
    const url = `${config.baseUrl}${logo}.png`;
    const filePath = path.join(categoryDir, `${logo}.png`);
    
    try {
      await downloadFile(url, filePath);
      successful++;
    } catch (error) {
      logger.error(`Failed to download ${logo}: ${error}`);
      failed++;
    }
  }
  
  return { successful, failed };
}

// Main function
async function main() {
  logger.info('Starting TV Logo Downloader...');
  
  try {
    // Initialize logos directory
    const baseDir = initLogosDirectory();
    
    let totalAttempted = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    // Download logos for each category
    for (const [category, logos] of Object.entries(config.categories)) {
      totalAttempted += logos.length;
      
      const result = await downloadCategoryLogos(baseDir, category, logos);
      totalSuccessful += result.successful;
      totalFailed += result.failed;
    }
    
    // Display summary
    logger.info('\n=== DOWNLOAD SUMMARY ===');
    logger.info(`Total logos attempted: ${totalAttempted}`);
    logger.success(`Successfully downloaded: ${totalSuccessful}`);
    
    if (totalFailed > 0) {
      logger.error(`Failed to download: ${totalFailed}`);
    }
    
    logger.success('\nScript finished successfully');
    logger.info('Logos have been downloaded to public/logos/');
    
  } catch (err) {
    logger.error('Script error:', err);
    process.exit(1);
  }
}

// Run the main function
main();
