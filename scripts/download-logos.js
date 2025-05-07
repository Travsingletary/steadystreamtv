
#!/usr/bin/env node

/**
 * TV Logo Downloader Script
 * 
 * This utility downloads TV channel logos from the tv-logo/tv-logos GitHub repository
 * and organizes them by category in your project's public/logos folder.
 * 
 * How to use:
 * 1. Make sure you're in the project root directory
 * 2. Run: node ./scripts/download-logos.js
 *    OR npm run download-logos (if you add this script to package.json)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Print the current execution directory to help with debugging
console.log(`Current directory: ${process.cwd()}`);

// Find the project root - this is the directory that contains package.json
const findProjectRoot = () => {
  let currentDir = process.cwd();
  
  // First check if we're already in the project root
  if (fs.existsSync(path.join(currentDir, 'package.json'))) {
    return currentDir;
  }
  
  // If running from scripts directory
  if (fs.existsSync(path.join(currentDir, '..', 'package.json'))) {
    return path.join(currentDir, '..');
  }
  
  // Check if running from node_modules/.bin
  if (fs.existsSync(path.join(currentDir, '..', '..', 'package.json'))) {
    return path.join(currentDir, '..', '..');
  }

  // Try to locate by traversing up
  const maxLevelsUp = 5;
  for (let i = 0; i < maxLevelsUp; i++) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // We've reached the root of the file system
    }
    
    currentDir = parentDir;
  }
  
  // Use script location as fallback
  if (__dirname) {
    const scriptDir = __dirname;
    console.log(`Script directory detected as: ${scriptDir}`);
    
    if (fs.existsSync(path.join(scriptDir, 'package.json'))) {
      return scriptDir;
    }
    
    if (fs.existsSync(path.join(scriptDir, '..', 'package.json'))) {
      return path.join(scriptDir, '..');
    }
  }
  
  // Emergency fallback - use current directory but warn the user
  console.warn('⚠️ WARNING: Could not find project root with package.json!');
  console.warn('Creating logos directory in current working directory instead.');
  return process.cwd();
};

// Try to determine project root
let projectRoot;
try {
  projectRoot = findProjectRoot();
  console.log(`Project root detected at: ${projectRoot}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  console.log('Falling back to current directory...');
  projectRoot = process.cwd();
}

// Define logos directory path
const baseDir = path.join(projectRoot, 'public', 'logos');

// Create base logos directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
  try {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`Created logos directory at: ${baseDir}`);
  } catch (error) {
    console.error(`Failed to create directory: ${baseDir}`);
    console.error(error);
    process.exit(1);
  }
}

// Define categories and their corresponding logos
const categories = {
  entertainment: [
    'hbo', 'amc', 'fx', 'tnt', 'usa', 'paramount', 'showtime', 'abc', 'nbc', 'cbs',
    'bet', 'comedy-central', 'tbs', 'syfy', 'bravo', 'ae', 'tlc', 'history'
  ],
  sports: [
    'espn', 'fox-sports', 'nbc-sports', 'mlb-network', 'nfl-network', 'nba-tv', 
    'cbs-sports', 'golf', 'sky-sports', 'bein-sports', 'dazn', 'eurosport'
  ],
  movies: [
    'hbo', 'showtime', 'starz', 'cinemax', 'tmc', 'sony-movies', 'action-max', 
    'ifc', 'sundance', 'tcm', 'film4', 'mgm'
  ],
  news: [
    'cnn', 'fox-news', 'msnbc', 'bbc-world', 'al-jazeera', 'bloomberg', 'cnbc', 
    'sky-news', 'euronews', 'rt', 'france24', 'cbs-news'
  ],
  kids: [
    'disney-channel', 'nickelodeon', 'cartoon-network', 'pbs-kids', 'boomerang', 
    'discovery-kids', 'baby-tv', 'nick-jr', 'disney-junior', 'universal-kids'
  ],
  international: [
    'star-plus', 'zee-tv', 'univision', 'telemundo', 'tv5-monde', 'rai', 
    'deutsche-welle', 'globo', 'tve', 'nhk-world', 'tvn', 'canal+'
  ]
};

// GitHub repository base URL
const baseUrl = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/';

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
          resolve();
        });
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

// Main function to download all logos
async function downloadAllLogos() {
  // Create summary counters
  let totalAttempted = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  
  console.log('\n====== TV LOGO DOWNLOADER ======');
  console.log('Starting logo download process...');
  console.log(`Base directory: ${baseDir}`);
  
  for (const [category, logos] of Object.entries(categories)) {
    console.log(`\nDownloading ${category} logos...`);
    
    // Create category directory
    const categoryDir = path.join(baseDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
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
    console.log(`  Category progress: ${categorySuccessful}/${logos.length} logos downloaded`);
  }
  
  console.log('\n=== Download Summary ===');
  console.log(`Total attempted: ${totalAttempted}`);
  console.log(`Successfully downloaded: ${totalSuccessful}`);
  console.log(`Failed downloads: ${totalFailed}`);
  console.log(`Success rate: ${((totalSuccessful / totalAttempted) * 100).toFixed(2)}%`);
  console.log('\nDownload completed!');
  
  console.log('\n=== How to use these logos ===');
  console.log('The logos are now available in your application at:');
  console.log('/public/logos/{category}/{channel-name}.png');
  console.log('Example: /public/logos/sports/espn.png\n');
}

// Run the download function
downloadAllLogos()
  .then(() => console.log('Script finished successfully'))
  .catch((err) => console.error('Script error:', err));
