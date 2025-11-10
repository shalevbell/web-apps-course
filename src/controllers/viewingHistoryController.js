const mongoose = require('mongoose');
const ViewingHistory = require('../models/ViewingHistory');
const Profile = require('../models/Profile');
const Content = require('../models/Content');
const { sendSuccess, sendError } = require('../utils/responses');
const logger = require('../utils/logger');

/**
 * Save or update viewing progress for a profile
 * POST /api/profiles/:profileId/viewing-history
 */
exports.saveProgress = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database connection unavailable', 503);
    }

    const { profileId } = req.params;
    const { contentId, currentTime, duration, completed } = req.body;

    // Validate profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Validate content exists
    const content = await Content.findOne({ id: contentId });
    if (!content) {
      return sendError(res, 'Content not found', 404);
    }

    // Update or create viewing history
    const viewingHistory = await ViewingHistory.findOneAndUpdate(
      { profileId, contentId },
      {
        currentTime,
        duration,
        completed: completed || false,
        lastWatched: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    logger.info(`Viewing progress saved for profile ${profileId}, content ${contentId}`);
    return sendSuccess(res, viewingHistory, 'Progress saved successfully');

  } catch (error) {
    logger.error('Error saving viewing progress:', error);
    return sendError(res, 'Failed to save viewing progress', 500);
  }
};

/**
 * Get viewing progress for specific content and profile
 * GET /api/profiles/:profileId/viewing-history/:contentId
 */
exports.getProgress = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database connection unavailable', 503);
    }

    const { profileId, contentId } = req.params;

    // Validate profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Get viewing history
    const viewingHistory = await ViewingHistory.findOne({
      profileId,
      contentId: parseInt(contentId)
    });

    if (!viewingHistory) {
      return sendSuccess(res, { currentTime: 0, completed: false }, 'No viewing history found');
    }

    return sendSuccess(res, viewingHistory, 'Progress retrieved successfully');

  } catch (error) {
    logger.error('Error retrieving viewing progress:', error);
    return sendError(res, 'Failed to retrieve viewing progress', 500);
  }
};

/**
 * Get all viewing history for a profile (recent watches)
 * GET /api/profiles/:profileId/viewing-history
 */
exports.getProfileHistory = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database connection unavailable', 503);
    }

    const { profileId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    // Validate profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Get viewing history sorted by most recent
    const viewingHistory = await ViewingHistory.find({ profileId })
      .sort({ lastWatched: -1 })
      .limit(limit);

    // Get content details for each history entry
    const historyWithContent = await Promise.all(
      viewingHistory.map(async (history) => {
        const content = await Content.findOne({ id: history.contentId });
        return {
          ...history.toObject(),
          content: content || null
        };
      })
    );

    return sendSuccess(res, historyWithContent, 'Viewing history retrieved successfully');

  } catch (error) {
    logger.error('Error retrieving profile viewing history:', error);
    return sendError(res, 'Failed to retrieve viewing history', 500);
  }
};

/**
 * Delete viewing history for specific content
 * DELETE /api/profiles/:profileId/viewing-history/:contentId
 */
exports.deleteProgress = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database connection unavailable', 503);
    }

    const { profileId, contentId } = req.params;

    // Validate profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    // Delete viewing history
    const result = await ViewingHistory.findOneAndDelete({
      profileId,
      contentId: parseInt(contentId)
    });

    if (!result) {
      return sendError(res, 'Viewing history not found', 404);
    }

    logger.info(`Viewing history deleted for profile ${profileId}, content ${contentId}`);
    return sendSuccess(res, null, 'Viewing history deleted successfully');

  } catch (error) {
    logger.error('Error deleting viewing history:', error);
    return sendError(res, 'Failed to delete viewing history', 500);
  }
};
