
/**
 * Category loader for the TV Logo Downloader
 * Loads category configurations from JSON files
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Load base configuration
 * @returns {Object} Base configuration object
 */
const loadBaseConfig = () => {
  try {
    const configPath = path.join(__dirname, 'categories.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    logger.error('Failed to load base config:', error);
    return { baseUrl: 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/' };
  }
};

/**
 * Load all category configurations
 * @returns {Object} Categories object with all loaded categories
 */
const loadAllCategories = () => {
  const categoriesDir = path.join(__dirname, 'categories');
  const categories = {};
  
  try {
    if (!fs.existsSync(categoriesDir)) {
      logger.error(`Categories directory not found: ${categoriesDir}`);
      return {};
    }
    
    const files = fs.readdirSync(categoriesDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(categoriesDir, file);
          const fileData = fs.readFileSync(filePath, 'utf8');
          const categoryData = JSON.parse(fileData);
          
          if (categoryData.name && Array.isArray(categoryData.logos)) {
            categories[categoryData.name] = categoryData.logos;
            logger.debug(`Loaded category: ${categoryData.name} (${categoryData.logos.length} logos)`);
          }
        } catch (err) {
          logger.warn(`Failed to load category file ${file}:`, err);
        }
      }
    }
    
    logger.info(`Loaded ${Object.keys(categories).length} categories`);
    return categories;
  } catch (error) {
    logger.error('Failed to load categories:', error);
    return {};
  }
};

/**
 * Get the complete configuration
 * @returns {Object} The complete configuration object
 */
const getConfig = () => {
  const baseConfig = loadBaseConfig();
  const categories = loadAllCategories();
  
  return {
    ...baseConfig,
    categories
  };
};

module.exports = {
  getConfig,
  loadBaseConfig,
  loadAllCategories
};
