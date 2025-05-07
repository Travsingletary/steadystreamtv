
/**
 * Download utilities for the TV Logo Downloader
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Downloads a file from URL to a specific path
 * @param {string} url - The URL to download from
 * @param {string} filePath - The local path to save the file
 * @returns {Promise} A promise that resolves when the file is downloaded
 */
const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filePath);
    
    logger.debug(`Downloading: ${url} to ${filePath}`);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          logger.success(`Downloaded: ${path.basename(filePath)}`);
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
};

module.exports = {
  downloadFile
};
