const Content = require('../models/Content');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadDir;
    if (file.fieldname === 'video') {
      uploadDir = path.join(__dirname, '../../public/videos');
    } else if (file.fieldname === 'thumbnail') {
      uploadDir = path.join(__dirname, '../../public/_images');
    } else {
      return cb(new Error('Invalid field name'));
    }

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video field'), false);
    }
  } else if (file.fieldname === 'thumbnail') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnail field'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
    files: 2 // Maximum 2 files (video + thumbnail)
  }
});

// Middleware for handling file uploads
const uploadFiles = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Function to fetch IMDB ratings
const fetchIMDBRating = async (title, year) => {
  return new Promise((resolve) => {
    try {
      // Using OMDb API (requires API key - for demo purposes, we'll return a placeholder)
      // In production, you would use: http://www.omdbapi.com/?t=${encodeURIComponent(title)}&y=${year}&apikey=${API_KEY}

      // For now, return a mock rating since we don't have an API key configured
      const mockRatings = ['8.1', '7.9', '8.5', '7.6', '8.3', '7.8', '8.7', '7.4', '8.0', '7.7'];
      const randomRating = mockRatings[Math.floor(Math.random() * mockRatings.length)];

      resolve({
        imdbRating: randomRating,
        source: 'Mock Data (Replace with real API)'
      });
    } catch (error) {
      console.error('Error fetching IMDB rating:', error);
      resolve({
        imdbRating: 'N/A',
        source: 'Error fetching rating'
      });
    }
  });
};

// Get next available content ID
const getNextContentId = async () => {
  try {
    const lastContent = await Content.findOne().sort({ id: -1 });
    return lastContent ? lastContent.id + 1 : 1;
  } catch (error) {
    console.error('Error getting next content ID:', error);
    return Date.now(); // Fallback to timestamp
  }
};

// Create new content
const createContent = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Content creation requires database connection'
      });
    }

    const {
      name,
      year,
      genre,
      type,
      episodes,
      seasons,
      duration,
      description,
      director,
      actors
    } = req.body;

    // Generate next content ID
    const contentId = await getNextContentId();

    // Handle file uploads
    let videoUrl = null;
    let imageUrl = null;

    if (req.files) {
      if (req.files.video && req.files.video[0]) {
        videoUrl = `/videos/${req.files.video[0].filename}`;
      }
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        imageUrl = `/_images/${req.files.thumbnail[0].filename}`;
      }
    }

    // If no thumbnail uploaded, use a default image
    if (!imageUrl) {
      imageUrl = '/_images/default-content.svg';
    }

    // Fetch external rating
    const ratingData = await fetchIMDBRating(name, year);

    // Create new content object
    const newContent = new Content({
      id: contentId,
      name: name.trim(),
      year: parseInt(year),
      genre: genre.trim(),
      type,
      episodes: type === 'series' ? parseInt(episodes) : undefined,
      seasons: type === 'series' ? parseInt(seasons) : undefined,
      duration: type === 'movie' ? duration.trim() : undefined,
      rating: ratingData.imdbRating,
      description: description.trim(),
      image: imageUrl,
      videoUrl,
      // Additional metadata
      director: director ? director.trim() : undefined,
      actors: actors ? actors.trim() : undefined,
      ratingSource: ratingData.source
    });

    // Save to database
    const savedContent = await newContent.save();

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: savedContent
    });

  } catch (error) {
    console.error('Error creating content:', error);

    // Clean up uploaded files if database save failed
    if (req.files) {
      try {
        if (req.files.video && req.files.video[0]) {
          await fs.unlink(req.files.video[0].path);
        }
        if (req.files.thumbnail && req.files.thumbnail[0]) {
          await fs.unlink(req.files.thumbnail[0].path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      error: 'Failed to create content',
      message: error.message
    });
  }
};

// Get all content for admin (includes additional metadata)
const getAllContentAdmin = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Admin content requires database connection'
      });
    }

    const contentData = await Content.find({})
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: contentData,
      count: contentData.length
    });
  } catch (error) {
    console.error('Error fetching admin content:', error);
    res.status(500).json({ error: 'Failed to load admin content' });
  }
};

// Delete content
const deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Content deletion requires database connection'
      });
    }

    const content = await Content.findOne({ id: parseInt(contentId) });
    if (!content) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    // Delete associated files
    try {
      if (content.videoUrl) {
        const videoPath = path.join(__dirname, '../../public', content.videoUrl);
        await fs.unlink(videoPath);
      }
      if (content.image && !content.image.includes('default-content.svg')) {
        const imagePath = path.join(__dirname, '../../public', content.image);
        await fs.unlink(imagePath);
      }
    } catch (fileError) {
      console.warn('Warning: Could not delete associated files:', fileError.message);
    }

    await Content.deleteOne({ id: parseInt(contentId) });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      error: 'Failed to delete content',
      message: error.message
    });
  }
};

module.exports = {
  uploadFiles,
  createContent,
  getAllContentAdmin,
  deleteContent
};