
/**
 * This is a utility script to download TV logos from the tv-logo/tv-logos GitHub repository
 * 
 * How to use:
 * 1. Create a 'public/logos' folder in your project root
 * 2. Run this script with Node.js: node scripts/download-logos.js
 * 3. Logos will be downloaded to their respective category folders
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Create base logos directory if it doesn't exist
const baseDir = path.join(__dirname, '../public/logos');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
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
  for (const [category, logos] of Object.entries(categories)) {
    console.log(`Downloading ${category} logos...`);
    
    // Create category directory
    const categoryDir = path.join(baseDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    // Download each logo
    for (const logo of logos) {
      const url = `${baseUrl}${logo}.png`;
      const filePath = path.join(categoryDir, `${logo}.png`);
      
      try {
        await downloadFile(url, filePath);
        console.log(`  Downloaded: ${logo}.png`);
      } catch (error) {
        console.error(`  Error: ${error}`);
      }
    }
  }
  
  console.log('Download completed!');
}

// Run the download function
downloadAllLogos();
