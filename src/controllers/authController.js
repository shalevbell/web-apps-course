const mongoose = require('mongoose');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responses');
const logger = require('../utils/logger');

const register = async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      logger.warn(`[AUTH] Registration failed for ${email} - Passwords do not match`);
      return sendError(res, 'Passwords do not match', 400);
    }

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      logger.error('[AUTH] Registration failed - Database not available');
      return sendError(res, 'Database not available. Please try again later.', 503);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        logger.warn(`[AUTH] Registration failed - Email already exists: ${email}`);
        return sendError(res, 'Email already exists', 409);
      } else {
        logger.warn(`[AUTH] Registration failed - Username already exists: ${username}`);
        return sendError(res, 'Username already exists', 409);
      }
    }

    // Create new user
    const user = new User({
      email,
      username,
      password
    });

    await user.save();

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username
    };

    logger.info(`[AUTH] User registered successfully: ${email} (${username})`);
    sendSuccess(res, userData, 'User registered successfully', 201);
  } catch (error) {
    logger.error(`[AUTH] Registration error: ${error.message}`);
    console.error('Registration error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      sendError(res, 'Database connection error. Please try again later.', 503);
    } else {
      sendError(res, 'Server error during registration', 500);
    }
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      logger.error('[AUTH] Login failed - Database not available');
      return sendError(res, 'Database not available. Please try again later.', 503);
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`[AUTH] Login failed - User not found: ${email}`);
      return sendError(res, 'User not found', 404);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`[AUTH] Login failed - Incorrect password for: ${email}`);
      return sendError(res, 'Incorrect password', 401);
    }

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username
    };

    logger.info(`[AUTH] User logged in successfully: ${email}`);
    sendSuccess(res, userData, 'Login successful', 200);
  } catch (error) {
    logger.error(`[AUTH] Login error: ${error.message}`);
    console.error('Login error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      sendError(res, 'Database connection error. Please try again later.', 503);
    } else {
      sendError(res, 'Server error during login', 500);
    }
  }
};

module.exports = {
  register,
  login
};
