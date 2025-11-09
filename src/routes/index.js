const express = require('express');
const { body } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const viewingHistoryController = require('../controllers/viewingHistoryController');
const validateRequest = require('../middleware/validateRequest');

// Import models
const Content = require('../models/Content');

// ============================================
// API Routes
// ============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get content data
router.get('/content', async (req, res) => {
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
});

// ============================================
// Authentication Routes
// ============================================

// Register
router.post('/auth/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], validateRequest, authController.register);

// Login
router.post('/auth/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], validateRequest, authController.login);

// ============================================
// Profile Routes
// ============================================

// Get user profiles
router.get('/users/:userId/profiles', profileController.getProfiles);

// Create new profile
router.post('/users/:userId/profiles', [
  body('name')
    .isLength({ min: 1, max: 20 })
    .withMessage('Profile name must be between 1 and 20 characters')
    .trim(),
  body('avatar')
    .isIn(['profile_pic_1.png', 'profile_pic_2.png', 'profile_pic_3.png', 'profile_pic_4.png'])
    .withMessage('Invalid avatar selection')
], validateRequest, profileController.createProfile);

// Update profile
router.put('/profiles/:profileId', [
  body('name')
    .isLength({ min: 1, max: 20 })
    .withMessage('Profile name must be between 1 and 20 characters')
    .trim()
    .optional(),
  body('avatar')
    .isIn(['profile_pic_1.png', 'profile_pic_2.png', 'profile_pic_3.png', 'profile_pic_4.png'])
    .withMessage('Invalid avatar selection')
    .optional(),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
], validateRequest, profileController.updateProfile);

// Delete profile
router.delete('/profiles/:profileId', [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
], validateRequest, profileController.deleteProfile);

// Get profile likes
router.get('/profiles/:profileId/likes', profileController.getLikes);

// Like content
router.post('/profiles/:profileId/like', [
  body('contentId')
    .isNumeric()
    .withMessage('Content ID must be a number')
], validateRequest, profileController.likeContent);

// Unlike content
router.post('/profiles/:profileId/unlike', [
  body('contentId')
    .isNumeric()
    .withMessage('Content ID must be a number')
], validateRequest, profileController.unlikeContent);

// Get global like counts
router.get('/content/likes', profileController.getGlobalLikeCounts);

// ============================================
// Viewing History Routes
// ============================================

// Get all viewing history for a profile
router.get('/profiles/:profileId/viewing-history', viewingHistoryController.getProfileHistory);

// Get viewing progress for specific content
router.get('/profiles/:profileId/viewing-history/:contentId', viewingHistoryController.getProgress);

// Save viewing progress
router.post('/profiles/:profileId/viewing-history', [
  body('contentId')
    .isNumeric()
    .withMessage('Content ID must be a number'),
  body('currentTime')
    .isNumeric()
    .withMessage('Current time must be a number'),
  body('duration')
    .isNumeric()
    .withMessage('Duration must be a number'),
  body('completed')
    .isBoolean()
    .optional()
    .withMessage('Completed must be a boolean')
], validateRequest, viewingHistoryController.saveProgress);

// Delete viewing history
router.delete('/profiles/:profileId/viewing-history/:contentId', viewingHistoryController.deleteProgress);

module.exports = router;
