const Content = require('../models/Content');
const Profile = require('../models/Profile');
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

module.exports = {
  getAllContent,
  getPopularContent,
  getNewestContentByGenre,
  getSimilarContent
};