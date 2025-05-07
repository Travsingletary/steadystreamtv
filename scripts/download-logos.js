
/**
 * This is a utility script to download TV logos from the tv-logo/tv-logos GitHub repository
 * 
 * How to use:
 * 1. Create a 'public/logos' folder in your project root (this script will do it for you)
 * 2. Run this script with Node.js from the project root: node scripts/download-logos.js
 * 3. Logos will be downloaded to their respective category folders
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Determine project root directory - will work regardless of where the script is called from
const findProjectRoot = () => {
  let currentDir = process.cwd();
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error('Could not find project root directory (no package.json found)');
    }
    currentDir = parentDir;
  }
  return currentDir;
};

const projectRoot = findProjectRoot();
console.log(`Project root detected at: ${projectRoot}`);

// Create base logos directory if it doesn't exist
const baseDir = path.join(projectRoot, 'public/logos');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log(`Created logos directory at: ${baseDir}`);
}

// Define categories and their corresponding GitHub folders
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
}

// Run the download function
downloadAllLogos()
  .then(() => console.log('Script finished successfully'))
  .catch((err) => console.error('Script error:', err));

