
/**
 * Logger module for the TV Logo Downloader
 * Provides consistent logging functionality throughout the application
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Default to INFO level
let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Set the current log level
 * @param {string} level - The log level (DEBUG, INFO, WARN, ERROR)
 */
const setLogLevel = (level) => {
  const upperLevel = level.toUpperCase();
  if (LOG_LEVELS[upperLevel] !== undefined) {
    currentLogLevel = LOG_LEVELS[upperLevel];
  } else {
    console.warn(`Invalid log level: ${level}. Using default INFO level.`);
  }
};

/**
 * Check if a log level should be displayed
 * @param {number} level - The level to check
 * @returns {boolean} - Whether to display the log
 */
const shouldLog = (level) => {
  return level >= currentLogLevel;
};

/**
 * Log a debug message
 * @param {...any} args - Arguments to log
 */
const debug = (...args) => {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.log('🔍 DEBUG:', ...args);
  }
};

/**
 * Log an info message
 * @param {...any} args - Arguments to log
 */
const info = (...args) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log('ℹ️ INFO:', ...args);
  }
};

/**
 * Log a success message
 * @param {...any} args - Arguments to log
 */
const success = (...args) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log('✅ SUCCESS:', ...args);
  }
};

/**
 * Log a warning message
 * @param {...any} args - Arguments to log
 */
const warn = (...args) => {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn('⚠️ WARNING:', ...args);
  }
};

/**
 * Log an error message
 * @param {...any} args - Arguments to log
 */
const error = (...args) => {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error('❌ ERROR:', ...args);
  }
};

/**
 * Log a section header
 * @param {string} title - The section title
 */
const section = (title) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log(`\n=== ${title} ===`);
  }
};

/**
 * Log progress for a task
 * @param {string} message - Progress message
 * @param {number} current - Current progress
 * @param {number} total - Total items
 */
const progress = (message, current, total) => {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.log(`  ${message}: ${current}/${total}`);
  }
};

module.exports = {
  setLogLevel,
  debug,
  info,
  success,
  warn,
  error,
  section,
  progress,
  LOG_LEVELS
};
