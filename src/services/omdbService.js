const axios = require('axios');

const OMDB_API_URL = 'http://www.omdbapi.com/';
const OMDB_API_KEY = process.env.OMDB_API_KEY;

/**
 * Fetch movie/series data from OMDB API by IMDB ID
 * @param {string} imdbId - IMDB ID (e.g., 'tt3896198')
 * @returns {Promise<Object>} OMDB data
 */
async function getMovieByImdbId(imdbId) {
  try {
    if (!OMDB_API_KEY) {
      throw new Error('OMDB_API_KEY environment variable is not set');
    }

    const response = await axios.get(OMDB_API_URL, {
      params: {
        i: imdbId,
        apikey: OMDB_API_KEY,
        plot: 'full'
      }
    });

    if (response.data.Response === 'False') {
      throw new Error(response.data.Error || 'Movie not found');
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching OMDB data for ${imdbId}:`, error.message);
    throw error;
  }
}

/**
 * Search for movies/series by title
 * @param {string} title - Movie/series title
 * @param {string} year - Optional year
 * @returns {Promise<Object>} OMDB search results
 */
async function searchByTitle(title, year = null) {
  try {
    if (!OMDB_API_KEY) {
      throw new Error('OMDB_API_KEY environment variable is not set');
    }

    const params = {
      s: title,
      apikey: OMDB_API_KEY
    };

    if (year) {
      params.y = year;
    }

    const response = await axios.get(OMDB_API_URL, { params });

    if (response.data.Response === 'False') {
      throw new Error(response.data.Error || 'No results found');
    }

    return response.data.Search || [];
  } catch (error) {
    console.error(`Error searching OMDB for "${title}":`, error.message);
    throw error;
  }
}

/**
 * Extract rating information from OMDB data
 * @param {Object} omdbData - OMDB API response
 * @returns {Object} Formatted rating data
 */
function extractRatings(omdbData) {
  const ratings = {
    imdbRating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : null,
    imdbVotes: omdbData.imdbVotes !== 'N/A' ? omdbData.imdbVotes : null,
    metascore: omdbData.Metascore !== 'N/A' ? parseInt(omdbData.Metascore) : null,
    rottenTomatoes: null,
    awards: omdbData.Awards !== 'N/A' ? omdbData.Awards : null
  };

  // Extract Rotten Tomatoes score if available
  if (omdbData.Ratings && Array.isArray(omdbData.Ratings)) {
    const rtRating = omdbData.Ratings.find(r => r.Source === 'Rotten Tomatoes');
    if (rtRating) {
      ratings.rottenTomatoes = rtRating.Value;
    }
  }

  return ratings;
}

/**
 * Update content with OMDB data
 * @param {Object} content - Content document
 * @param {string} imdbId - IMDB ID
 * @returns {Promise<Object>} Updated rating data
 */
async function updateContentWithOmdbData(content, imdbId) {
  try {
    const omdbData = await getMovieByImdbId(imdbId);
    const ratings = extractRatings(omdbData);

    // Return the data to be saved
    return {
      imdbId,
      omdbRatings: ratings,
      omdbUpdatedAt: new Date()
    };
  } catch (error) {
    console.error(`Failed to update content with OMDB data:`, error.message);
    throw error;
  }
}

module.exports = {
  getMovieByImdbId,
  searchByTitle,
  extractRatings,
  updateContentWithOmdbData
};
