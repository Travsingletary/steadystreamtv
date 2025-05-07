
/**
 * Categories and channel configurations for the TV Logo Downloader
 */

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

module.exports = {
  categories,
  baseUrl
};
