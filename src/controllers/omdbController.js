const Content = require('../models/Content');
const omdbService = require('../services/omdbService');
const { sendSuccess, sendError } = require('../utils/responses');
const mongoose = require('mongoose');

/**
 * Update a single content item with OMDB data by IMDB ID
 */
exports.updateContentRating = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available', 503);
    }

    const { contentId } = req.params;
    const { imdbId } = req.body;

    if (!imdbId) {
      return sendError(res, 'IMDB ID is required', 400);
    }

    // Find content by ID
    const content = await Content.findOne({ id: parseInt(contentId) });
    if (!content) {
      return sendError(res, 'Content not found', 404);
    }

    // Fetch OMDB data
    const omdbData = await omdbService.updateContentWithOmdbData(content, imdbId);

    // Update content with OMDB data
    content.imdbId = omdbData.imdbId;
    content.omdbRatings = omdbData.omdbRatings;
    content.omdbUpdatedAt = omdbData.omdbUpdatedAt;

    await content.save();

    sendSuccess(res, {
      message: 'Content updated with OMDB ratings',
      content: {
        id: content.id,
        name: content.name,
        imdbId: content.imdbId,
        omdbRatings: content.omdbRatings,
        omdbUpdatedAt: content.omdbUpdatedAt
      }
    });

  } catch (error) {
    console.error('Error updating content with OMDB data:', error);
    sendError(res, error.message || 'Failed to update content with OMDB data', 500);
  }
};

/**
 * Sync all content items that have IMDB IDs
 */
exports.syncAllRatings = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available', 503);
    }

    // Find all content with IMDB IDs
    const contents = await Content.find({ imdbId: { $exists: true, $ne: null } });

    if (contents.length === 0) {
      return sendSuccess(res, {
        message: 'No content with IMDB IDs found',
        updated: 0,
        failed: 0
      });
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    // Update each content item
    for (const content of contents) {
      try {
        const omdbData = await omdbService.updateContentWithOmdbData(content, content.imdbId);

        content.omdbRatings = omdbData.omdbRatings;
        content.omdbUpdatedAt = omdbData.omdbUpdatedAt;

        await content.save();
        results.updated++;

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.failed++;
        results.errors.push({
          contentId: content.id,
          name: content.name,
          error: error.message
        });
      }
    }

    sendSuccess(res, {
      message: 'Sync completed',
      ...results
    });

  } catch (error) {
    console.error('Error syncing all ratings:', error);
    sendError(res, 'Failed to sync ratings', 500);
  }
};

/**
 * Search OMDB by title and get suggestions
 */
exports.searchOmdb = async (req, res) => {
  try {
    const { title, year } = req.query;

    if (!title) {
      return sendError(res, 'Title is required', 400);
    }

    const results = await omdbService.searchByTitle(title, year);

    sendSuccess(res, {
      results,
      count: results.length
    });

  } catch (error) {
    console.error('Error searching OMDB:', error);
    sendError(res, error.message || 'Failed to search OMDB', 500);
  }
};

/**
 * Get OMDB data by IMDB ID without saving
 */
exports.getOmdbData = async (req, res) => {
  try {
    const { imdbId } = req.params;

    if (!imdbId) {
      return sendError(res, 'IMDB ID is required', 400);
    }

    const omdbData = await omdbService.getMovieByImdbId(imdbId);
    const ratings = omdbService.extractRatings(omdbData);

    sendSuccess(res, {
      imdbId,
      title: omdbData.Title,
      year: omdbData.Year,
      type: omdbData.Type,
      ratings,
      plot: omdbData.Plot,
      poster: omdbData.Poster
    });

  } catch (error) {
    console.error('Error fetching OMDB data:', error);
    sendError(res, error.message || 'Failed to fetch OMDB data', 500);
  }
};

/**
 * Batch update multiple content items with IMDB IDs
 */
exports.batchUpdateRatings = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available', 503);
    }

    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
      return sendError(res, 'Updates array is required', 400);
    }

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const update of updates) {
      const { contentId, imdbId } = update;

      if (!contentId || !imdbId) {
        results.failed++;
        results.errors.push({
          contentId,
          error: 'Missing contentId or imdbId'
        });
        continue;
      }

      try {
        const content = await Content.findOne({ id: parseInt(contentId) });

        if (!content) {
          results.failed++;
          results.errors.push({
            contentId,
            error: 'Content not found'
          });
          continue;
        }

        const omdbData = await omdbService.updateContentWithOmdbData(content, imdbId);

        content.imdbId = omdbData.imdbId;
        content.omdbRatings = omdbData.omdbRatings;
        content.omdbUpdatedAt = omdbData.omdbUpdatedAt;

        await content.save();
        results.updated++;

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        results.failed++;
        results.errors.push({
          contentId,
          error: error.message
        });
      }
    }

    sendSuccess(res, {
      message: 'Batch update completed',
      ...results
    });

  } catch (error) {
    console.error('Error batch updating ratings:', error);
    sendError(res, 'Failed to batch update ratings', 500);
  }
};
