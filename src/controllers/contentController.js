const Content = require('../models/Content');
const Profile = require('../models/Profile');
const ViewingHistory = require('../models/ViewingHistory');
const { sendSuccess, sendError } = require('../utils/responses');
const mongoose = require('mongoose');

// Get all content (existing functionality)
const getAllContent = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Content data requires database connection'
      });
    }

    // Fetch all content from MongoDB, sorted by id
    const contentData = await Content.find({}).sort({ id: 1 }).select('-__v -createdAt -updatedAt');
    res.json(contentData);
  } catch (error) {
    console.error('Error fetching content from database:', error);
    res.status(500).json({ error: 'Failed to load content data' });
  }
};

// Get most popular content using MongoDB aggregation
const getPopularContent = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Popular content requires database connection'
      });
    }

    // Aggregate likes from all profiles to find most popular content
    const popularContent = await Profile.aggregate([
      // Unwind the likes array to get individual like documents
      { $unwind: '$likes' },

      // Group by content ID and count likes
      {
        $group: {
          _id: '$likes',
          totalLikes: { $sum: 1 }
        }
      },

      // Sort by total likes in descending order
      { $sort: { totalLikes: -1 } },

      // Limit to top 10 most popular
      { $limit: 10 },

      // Lookup content details from Content collection
      {
        $lookup: {
          from: 'contents',
          localField: '_id',
          foreignField: 'id',
          as: 'contentDetails'
        }
      },

      // Unwind content details
      { $unwind: '$contentDetails' },

      // Project the final structure
      {
        $project: {
          _id: 0,
          contentId: '$_id',
          totalLikes: 1,
          id: '$contentDetails.id',
          name: '$contentDetails.name',
          year: '$contentDetails.year',
          genre: '$contentDetails.genre',
          type: '$contentDetails.type',
          episodes: '$contentDetails.episodes',
          seasons: '$contentDetails.seasons',
          duration: '$contentDetails.duration',
          rating: '$contentDetails.rating',
          description: '$contentDetails.description',
          image: '$contentDetails.image',
          videoUrl: '$contentDetails.videoUrl'
        }
      }
    ]);

    res.json({
      success: true,
      data: popularContent,
      count: popularContent.length
    });
  } catch (error) {
    console.error('Error fetching popular content:', error);
    res.status(500).json({ error: 'Failed to load popular content' });
  }
};

// Get top 10 newest content per genre
const getNewestContentByGenre = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Newest content requires database connection'
      });
    }

    // Get all unique genres from the database
    const genres = await Content.distinct('genre');

    const newestByGenre = {};

    // For each genre, get the top 10 newest content
    for (const genre of genres) {
      const newestContent = await Content.find({ genre })
        .sort({ year: -1, createdAt: -1 }) // Sort by year descending, then creation date
        .limit(10)
        .select('-__v -createdAt -updatedAt');

      newestByGenre[genre] = newestContent;
    }

    res.json({
      success: true,
      data: newestByGenre,
      genres: genres
    });
  } catch (error) {
    console.error('Error fetching newest content by genre:', error);
    res.status(500).json({ error: 'Failed to load newest content by genre' });
  }
};

// Get similar content (existing functionality)
const getSimilarContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Similar content requires database connection'
      });
    }

    // Find the current content
    const currentContent = await Content.findOne({ id: parseInt(contentId) });
    if (!currentContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get the first genre from the genre string
    const primaryGenre = currentContent.genre.split(',')[0].trim();

    // Find similar content with same primary genre, excluding current content
    const similarContent = await Content.find({
      id: { $ne: parseInt(contentId) },
      genre: { $regex: primaryGenre, $options: 'i' }
    }).limit(6).select('-__v -createdAt -updatedAt');

    res.json({ success: true, data: similarContent });
  } catch (error) {
    console.error('Error fetching similar content:', error);
    res.status(500).json({ error: 'Failed to load similar content' });
  }
};

// Get all content with filtering, sorting, and pagination
const getFilteredContent = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available', 503);
    }

    const {
      genre = '',
      type = '',
      page = 1,
      limit = process.env.ITEMS_PER_PAGE || 12,
      sort = 'name-asc',
      watched = 'all',
      profileId = ''
    } = req.query;

    // Build query
    const query = {};
    if (genre) {
      // Use regex to match genre within comma-separated string
      // This will match "Action" in "Action, Adventure, Drama"
      query.genre = { $regex: new RegExp(`(^|,\\s*)${genre}(\\s*,|$)`, 'i') };
    }
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object based on sort parameter
    let sortObject = {};
    switch (sort) {
      case 'name-asc':
        sortObject.name = 1;
        break;
      case 'name-desc':
        sortObject.name = -1;
        break;
      case 'year-desc':
        sortObject.year = -1;
        break;
      case 'year-asc':
        sortObject.year = 1;
        break;
      case 'rating':
        sortObject.rating = -1;
        break;
      default:
        sortObject.name = 1;
    }

    // Get watched content IDs if filtering is needed
    let watchedContentIds = [];
    if (profileId && watched !== 'all') {
      const viewingHistory = await ViewingHistory.find({
        profileId: profileId
      }).select('contentId').lean();
      watchedContentIds = viewingHistory.map(vh => vh.contentId);
    }

    // Fetch content with initial filters
    let content = await Content.find(query)
      .sort(sortObject)
      .select('-__v -createdAt -updatedAt')
      .lean();

    // Apply watched filter
    if (profileId && watched !== 'all') {
      if (watched === 'watched') {
        content = content.filter(c => watchedContentIds.includes(c.id));
      } else if (watched === 'unwatched') {
        content = content.filter(c => !watchedContentIds.includes(c.id));
      }
    }

    // Get total count after filtering
    const totalCount = content.length;

    // Apply pagination
    const paginatedContent = content.slice(skip, skip + limitNum);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasMore = parseInt(page) < totalPages;

    sendSuccess(res, {
      content: paginatedContent,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore
      }
    });

  } catch (error) {
    console.error('Error fetching filtered content:', error);
    sendError(res, 'Failed to fetch content', 500);
  }
};

// Get content by genre with pagination, sorting, and filtering (kept for backward compatibility)
const getContentByGenre = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available', 503);
    }

    const { genre } = req.params;
    const {
      page = 1,
      limit = process.env.ITEMS_PER_PAGE || 12,
      sortBy = 'rating', // 'rating', 'name', 'year'
      order = 'desc', // 'asc' or 'desc'
      watched = 'all' // 'all', 'watched', 'unwatched'
    } = req.query;

    const profileId = req.query.profileId;

    // Build query with regex to match genre within comma-separated string
    const query = {
      genre: { $regex: new RegExp(`(^|,\\s*)${genre}(\\s*,|$)`, 'i') }
    };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object
    let sortObject = {};
    if (sortBy === 'rating') {
      sortObject.rating = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sortObject.name = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'year') {
      sortObject.year = order === 'asc' ? 1 : -1;
    }

    // Get total count
    const totalCount = await Content.countDocuments(query);

    // Fetch content
    let content = await Content.find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(limitNum)
      .select('-__v -createdAt -updatedAt')
      .lean();

    // Filter by watched/unwatched if profileId provided
    if (profileId && watched !== 'all') {
      const viewingHistory = await ViewingHistory.find({
        profileId: profileId
      }).select('contentId').lean();

      const watchedContentIds = viewingHistory.map(vh => vh.contentId);

      if (watched === 'watched') {
        content = content.filter(c => watchedContentIds.includes(c.id));
      } else if (watched === 'unwatched') {
        content = content.filter(c => !watchedContentIds.includes(c.id));
      }
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasMore = page < totalPages;

    sendSuccess(res, {
      content,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore
      }
    });

  } catch (error) {
    console.error('Error fetching content by genre:', error);
    sendError(res, 'Failed to fetch content', 500);
  }
};

// Get all unique genres (split comma-separated genres into individual ones)
const getGenres = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return sendError(res, 'Database not available', 503);
    }

    // Get all genre strings from content
    const genreStrings = await Content.distinct('genre');

    // Split comma-separated genres and create a unique set
    const genreSet = new Set();
    genreStrings.forEach(genreString => {
      const genres = genreString.split(',').map(g => g.trim());
      genres.forEach(genre => genreSet.add(genre));
    });

    // Convert set to sorted array
    const genres = Array.from(genreSet).sort();
    sendSuccess(res, genres);

  } catch (error) {
    console.error('Error fetching genres:', error);
    sendError(res, 'Failed to fetch genres', 500);
  }
};

module.exports = {
  getAllContent,
  getPopularContent,
  getNewestContentByGenre,
  getSimilarContent,
  getFilteredContent,
  getContentByGenre,
  getGenres
};
