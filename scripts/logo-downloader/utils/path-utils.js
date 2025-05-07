
/**
 * Path detection utilities for the TV Logo Downloader
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Finds the project root directory using multiple detection strategies
 * @returns {string} The absolute path to the project root
 */
const findProjectRoot = () => {
  logger.debug(`Current working directory: ${process.cwd()}`);
  
  // Try using the current script path first
  const scriptPath = module.filename;
  logger.debug(`Script is located at: ${scriptPath}`);
  
  if (scriptPath) {
    const scriptDir = path.dirname(scriptPath);
    logger.debug(`Script directory: ${scriptDir}`);
    
    // Check if script dir is project root
    if (fs.existsSync(path.join(scriptDir, '..', 'package.json'))) {
      return path.resolve(scriptDir, '..');
    }
    
    // Check if script dir's parent is project root
    if (fs.existsSync(path.join(scriptDir, '..', '..', 'package.json'))) {
      return path.resolve(scriptDir, '..', '..');
    }
  }
  
  // If the script path approach fails, try from current working directory
  let currentDir = process.cwd();
  logger.debug(`Searching for project root from: ${currentDir}`);
  
  // First check if we're already in the project root
  if (fs.existsSync(path.join(currentDir, 'package.json'))) {
    logger.debug("Found package.json in current directory");
    return currentDir;
  }
  
  // Try to locate by traversing up
  const maxLevelsUp = 5;
  for (let i = 0; i < maxLevelsUp; i++) {
    const packagePath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      logger.debug(`Found package.json at ${packagePath}`);
      return currentDir;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // We've reached the root of the file system
    }
    
    currentDir = parentDir;
  }
  
  // Last resort: use a hardcoded path for the public directory
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    logger.debug(`Using found public directory at: ${publicDir}`);
    return path.dirname(publicDir);
  }
  
  logger.warn('Could not find project root!');
  logger.warn('Using current directory as fallback.');
  return process.cwd();
};

/**
 * Initializes the logos directory
 * @param {string} projectRoot - The project root path
 * @returns {string} The path to the logos directory
 */
const initLogosDirectory = (projectRoot) => {
  const baseDir = path.join(projectRoot, 'public', 'logos');
  logger.info(`Logos will be saved to: ${baseDir}`);

  // Create base logos directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    try {
      fs.mkdirSync(baseDir, { recursive: true });
      logger.info(`Created logos directory at: ${baseDir}`);
    } catch (error) {
      logger.error(`Failed to create directory: ${baseDir}`, error);
      process.exit(1);
    }
  }
  
  return baseDir;
};

/**
 * Creates a category directory if it doesn't exist
 * @param {string} baseDir - The base logos directory
 * @param {string} category - The category name
 * @returns {string} The path to the category directory
 */
const createCategoryDirectory = (baseDir, category) => {
  const categoryDir = path.join(baseDir, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
    logger.debug(`Created category directory: ${category}`);
  }
  return categoryDir;
};

module.exports = {
  findProjectRoot,
  initLogosDirectory,
  createCategoryDirectory
};
