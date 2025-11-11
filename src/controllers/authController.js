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

    const isAdmin = process.env.ADMIN_EMAIL
      ? user.email === process.env.ADMIN_EMAIL
      : false;

    // Auto-login user after registration
    req.session.authenticated = true;
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isAdmin
    };

    // Return user data (without password)
    const userData = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isAdmin
    };

    logger.info(`[AUTH] User registered and auto-logged in successfully: ${email} (${username})`);
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

    const isAdmin = process.env.ADMIN_EMAIL
      ? user.email === process.env.ADMIN_EMAIL
      : false;

    // Store user data in session (without password)
    req.session.authenticated = true;
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      isAdmin
    };

    logger.info(`[AUTH] User logged in successfully: ${email}`);
    sendSuccess(res, req.session.user, 'Login successful', 200);
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

const logout = (req, res) => {
  if (!req.session) {
    return sendSuccess(res, null, 'Logout successful', 200);
  }

  req.session.destroy((err) => {
    if (err) {
      logger.error(`[AUTH] Logout error: ${err.message}`);
      return sendError(res, 'Failed to logout. Please try again.', 500);
    }

    res.clearCookie('sid');
    logger.info('[AUTH] User logged out successfully');
    sendSuccess(res, null, 'Logout successful', 200);
  });
};

const getCurrentUser = (req, res) => {
  if (req.session?.authenticated && req.session?.user) {
    return sendSuccess(res, req.session.user, 'User session active', 200);
  }

  sendError(res, 'Not authenticated', 401);
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
