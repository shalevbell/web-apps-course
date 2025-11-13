const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const viewingHistoryController = require('../controllers/viewingHistoryController');
const contentController = require('../controllers/contentController');
const adminController = require('../controllers/adminController');
const omdbController = require('../controllers/omdbController');
const validateRequest = require('../middleware/validateRequest');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ============================================
// API Routes
// ============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get content data
router.get('/content', requireAuth, contentController.getAllContent);

// Get popular content (most liked)
router.get('/content/popular', requireAuth, contentController.getPopularContent);

// Get newest content by genre
router.get('/content/newest-by-genre', requireAuth, contentController.getNewestContentByGenre);

// Get all genres
router.get('/genres', requireAuth, contentController.getGenres);

// Get filtered content with pagination, sorting, and filters
router.get('/content/filter', requireAuth, contentController.getFilteredContent);

// Get content by genre with pagination
router.get('/genres/:genre/content', requireAuth, contentController.getContentByGenre);

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
    .isLength({ min: 5 })
    .withMessage('Password must be at least 5 characters long'),
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

// Current user session
router.get('/auth/me', authController.getCurrentUser);

// Logout
router.post('/auth/logout', authController.logout);

// ============================================
// Profile Routes
// ============================================

// Get user profiles
router.get('/users/:userId/profiles', requireAuth, profileController.getProfiles);

// Create new profile
router.post('/users/:userId/profiles', requireAuth, [
  body('name')
    .isLength({ min: 1, max: 20 })
    .withMessage('Profile name must be between 1 and 20 characters')
    .trim(),
  body('avatar')
    .isIn(['profile_pic_1.png', 'profile_pic_2.png', 'profile_pic_3.png', 'profile_pic_4.png'])
    .withMessage('Invalid avatar selection')
], validateRequest, profileController.createProfile);

// Update profile
router.put('/profiles/:profileId', requireAuth, [
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
router.delete('/profiles/:profileId', requireAuth, [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
], validateRequest, profileController.deleteProfile);

// Get profile likes
router.get('/profiles/:profileId/likes', requireAuth, profileController.getLikes);

// Like content
router.post('/profiles/:profileId/like', requireAuth, [
  body('contentId')
    .isNumeric()
    .withMessage('Content ID must be a number')
], validateRequest, profileController.likeContent);

// Unlike content
router.post('/profiles/:profileId/unlike', requireAuth, [
  body('contentId')
    .isNumeric()
    .withMessage('Content ID must be a number')
], validateRequest, profileController.unlikeContent);

// Get global like counts
router.get('/content/likes', requireAuth, profileController.getGlobalLikeCounts);

// Get similar content
router.get('/content/similar/:contentId', requireAuth, contentController.getSimilarContent);

// Get personalized recommendations for a profile
router.get('/profiles/:profileId/recommendations', requireAuth, contentController.getPersonalizedRecommendations);

// ============================================
// Viewing History Routes
// ============================================

// Get all viewing history for a profile
router.get('/profiles/:profileId/viewing-history', requireAuth, viewingHistoryController.getProfileHistory);

// Get viewing progress for specific content
router.get('/profiles/:profileId/viewing-history/:contentId', requireAuth, viewingHistoryController.getProgress);

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
], requireAuth, validateRequest, viewingHistoryController.saveProgress);

// Delete viewing history
router.delete('/profiles/:profileId/viewing-history/:contentId', requireAuth, viewingHistoryController.deleteProgress);

// Get user statistics
router.get('/users/:userId/statistics', requireAuth, viewingHistoryController.getStatistics);

// ============================================
// OMDB Integration Routes
// ============================================

// Search OMDB by title
router.get('/omdb/search', requireAuth, omdbController.searchOmdb);

// Get OMDB data by IMDB ID (without saving)
router.get('/omdb/:imdbId', requireAuth, omdbController.getOmdbData);

// Update single content with OMDB rating
router.post('/content/:contentId/omdb-rating', requireAdmin, [
  body('imdbId')
    .notEmpty()
    .withMessage('IMDB ID is required')
    .matches(/^tt\d+$/)
    .withMessage('IMDB ID must be in format tt1234567')
], validateRequest, omdbController.updateContentRating);

// Sync all content with existing IMDB IDs
router.post('/omdb/sync-all', requireAdmin, omdbController.syncAllRatings);

// Batch update multiple content items
router.post('/omdb/batch-update', requireAdmin, [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be a non-empty array')
], validateRequest, omdbController.batchUpdateRatings);

// ============================================
// Admin Routes
// ============================================

// Get all content for admin management
router.get('/admin/content', requireAdmin, adminController.getAllContentAdmin);

// Create new content (with file uploads)
router.post('/admin/content', requireAdmin, adminController.uploadFiles, [
  body('name')
    .isLength({ min: 1, max: 200 })
    .withMessage('Content name must be between 1 and 200 characters')
    .trim(),
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Year must be a valid year'),
  body('genre')
    .isLength({ min: 1, max: 100 })
    .withMessage('Genre is required and must be less than 100 characters')
    .trim(),
  body('type')
    .isIn(['movie', 'series'])
    .withMessage('Type must be either movie or series'),
  body('description')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('director')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Director name must be less than 100 characters')
    .trim(),
  body('actors')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Actors list must be less than 500 characters')
    .trim(),
  // Conditional validation for series
  body('episodes')
    .if(body('type').equals('series'))
    .isInt({ min: 1 })
    .withMessage('Episodes must be a positive number for series'),
  body('seasons')
    .if(body('type').equals('series'))
    .isInt({ min: 1 })
    .withMessage('Seasons must be a positive number for series'),
  // Conditional validation for movies
  body('duration')
    .if(body('type').equals('movie'))
    .isLength({ min: 1, max: 20 })
    .withMessage('Duration is required for movies and must be less than 20 characters')
    .trim()
], validateRequest, adminController.createContent);

// Update content (with file uploads)
router.put('/admin/content/:contentId', requireAdmin, adminController.uploadFiles, [
  body('name')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Content name must be between 1 and 200 characters')
    .trim(),
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage('Year must be a valid year'),
  body('genre')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Genre must be less than 100 characters')
    .trim(),
  body('type')
    .optional()
    .isIn(['movie', 'series'])
    .withMessage('Type must be either movie or series'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters')
    .trim(),
  body('director')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Director name must be less than 100 characters')
    .trim(),
  body('actors')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Actors list must be less than 500 characters')
    .trim(),
  body('rating')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Rating must be less than 10 characters')
    .trim(),
  // Conditional validation for series
  body('episodes')
    .if(body('type').equals('series'))
    .isInt({ min: 1 })
    .withMessage('Episodes must be a positive number for series'),
  body('seasons')
    .if(body('type').equals('series'))
    .isInt({ min: 1 })
    .withMessage('Seasons must be a positive number for series'),
  // Conditional validation for movies
  body('duration')
    .if(body('type').equals('movie'))
    .isLength({ min: 1, max: 20 })
    .withMessage('Duration must be less than 20 characters')
    .trim()
], validateRequest, adminController.updateContent);

// Delete content
router.delete('/admin/content/:contentId', requireAdmin, adminController.deleteContent);

module.exports = router;
