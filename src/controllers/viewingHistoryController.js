const mongoose = require('mongoose');
const ViewingHistory = require('../models/ViewingHistory');
const Profile = require('../models/Profile');
const Content = require('../models/Content');
const User = require('../models/User');
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

/**
 * Get statistics for a user: daily views per profile and content popularity by genre
 * GET /api/users/:userId/statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database connection unavailable', 503);
    }

    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Get all profiles for the user
    const profiles = await Profile.find({ userId }).select('_id name');
    if (profiles.length === 0) {
      return sendSuccess(res, {
        dailyViews: [],
        genrePopularity: []
      }, 'No profiles found');
    }

    const profileIds = profiles.map(p => p._id);
    const profileMap = new Map(profiles.map(p => [p._id.toString(), p.name]));

    // Calculate date range (last 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // 1. Daily Views Per Profile
    // Aggregate viewing history by profile and date
    const dailyViewsAggregation = await ViewingHistory.aggregate([
      {
        $match: {
          profileId: { $in: profileIds },
          lastWatched: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            profileId: '$profileId',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$lastWatched'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Generate all dates in the last 30 days
    const allDates = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      allDates.push(date.toISOString().split('T')[0]);
    }

    // Organize daily views by profile
    const dailyViewsMap = new Map();
    profileIds.forEach(profileId => {
      dailyViewsMap.set(profileId.toString(), {
        profileId: profileId.toString(),
        profileName: profileMap.get(profileId.toString()),
        dates: allDates.map(date => ({ date, count: 0 }))
      });
    });

    // Fill in actual counts
    dailyViewsAggregation.forEach(item => {
      const profileIdStr = item._id.profileId.toString();
      const dateStr = item._id.date;
      const profileData = dailyViewsMap.get(profileIdStr);
      if (profileData) {
        const dateIndex = profileData.dates.findIndex(d => d.date === dateStr);
        if (dateIndex !== -1) {
          profileData.dates[dateIndex].count = item.count;
        }
      }
    });

    const dailyViews = Array.from(dailyViewsMap.values());

    // 2. Content Popularity by Genre
    // Get all viewing history for user's profiles
    const viewingHistory = await ViewingHistory.find({
      profileId: { $in: profileIds }
    }).select('contentId');

    if (viewingHistory.length === 0) {
      return sendSuccess(res, {
        dailyViews,
        genrePopularity: []
      }, 'Statistics retrieved successfully');
    }

    // Get unique content IDs
    const contentIds = [...new Set(viewingHistory.map(vh => vh.contentId))];

    // Get content with genres
    const content = await Content.find({ id: { $in: contentIds } }).select('id genre');

    // Create content ID to genres map (split comma-separated genres)
    const contentGenresMap = new Map();
    content.forEach(c => {
      // Split comma-separated genres and trim each one
      const genres = c.genre.split(',').map(g => g.trim()).filter(g => g.length > 0);
      contentGenresMap.set(c.id, genres);
    });

    // Count views by individual genre
    // If content has "Comedy, Family, Mystery" and was viewed once,
    // count 1 for Comedy, 1 for Family, and 1 for Mystery
    const genreCounts = new Map();
    viewingHistory.forEach(vh => {
      const genres = contentGenresMap.get(vh.contentId);
      if (genres && genres.length > 0) {
        // Count each individual genre separately
        genres.forEach(genre => {
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        });
      }
    });

    // Convert to array format and sort by count (descending)
    const genrePopularity = Array.from(genreCounts.entries()).map(([genre, count]) => ({
      genre,
      count
    })).sort((a, b) => b.count - a.count);

    logger.info(`Statistics retrieved for user ${userId}`);
    return sendSuccess(res, {
      dailyViews,
      genrePopularity
    }, 'Statistics retrieved successfully');

  } catch (error) {
    logger.error('Error retrieving statistics:', error);
    return sendError(res, 'Failed to retrieve statistics', 500);
  }
};