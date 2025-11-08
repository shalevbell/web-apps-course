const Profile = require('../models/Profile');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responses');
const logger = require('../utils/logger');

const getProfiles = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const profiles = await Profile.find({ userId }).select('-userId -__v');

    // Transform profiles to include 'id' field instead of '_id'
    const transformedProfiles = profiles.map(profile => ({
      id: profile._id,
      name: profile.name,
      avatar: profile.avatar,
      likes: profile.likes
    }));

    sendSuccess(res, transformedProfiles, 'Profiles retrieved successfully');
  } catch (error) {
    console.error('Get profiles error:', error);
    sendError(res, 'Server error retrieving profiles', 500);
  }
};

const createProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, avatar } = req.body;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[PROFILE] Create profile failed - User not found: ${userId}`);
      return sendError(res, 'User not found', 404);
    }

    // Check if user already has 5 profiles
    const existingProfileCount = await Profile.countDocuments({ userId });
    if (existingProfileCount >= 5) {
      logger.warn(`[PROFILE] Create profile failed - Maximum profiles reached for user: ${userId}`);
      return sendError(res, 'Maximum of 5 profiles allowed per user', 400);
    }

    // Create new profile
    const profile = new Profile({
      userId,
      name,
      avatar,
      likes: []
    });

    await profile.save();

    // Return profile data (without userId)
    const profileData = {
      id: profile._id,
      name: profile.name,
      avatar: profile.avatar,
      likes: profile.likes
    };

    logger.info(`[PROFILE] Profile created: ${name} for user ${user.email}`);
    sendSuccess(res, profileData, 'Profile created successfully', 201);
  } catch (error) {
    logger.error(`[PROFILE] Create profile error: ${error.message}`);
    console.error('Create profile error:', error);

    if (error.code === 11000) {
      return sendError(res, 'Profile name already exists for this user', 409);
    }

    sendError(res, 'Server error creating profile', 500);
  }
};

const getLikes = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return sendError(res, 'Profile not found', 404);
    }

    sendSuccess(res, { likes: profile.likes }, 'Likes retrieved successfully');
  } catch (error) {
    console.error('Get likes error:', error);
    sendError(res, 'Server error retrieving likes', 500);
  }
};

const likeContent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { contentId } = req.body;

    if (!contentId || typeof contentId !== 'number') {
      return sendError(res, 'Valid content ID is required', 400);
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      logger.warn(`[PROFILE] Like content failed - Profile not found: ${profileId}`);
      return sendError(res, 'Profile not found', 404);
    }

    // Add like if not already liked (idempotent)
    if (!profile.likes.includes(contentId)) {
      profile.likes.push(contentId);
      await profile.save();
      logger.info(`[PROFILE] Content liked: contentId=${contentId}, profile=${profile.name}`);
    }

    sendSuccess(res, { likes: profile.likes }, 'Content liked successfully');
  } catch (error) {
    logger.error(`[PROFILE] Like content error: ${error.message}`);
    console.error('Like content error:', error);
    sendError(res, 'Server error liking content', 500);
  }
};

const unlikeContent = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { contentId } = req.body;

    if (!contentId || typeof contentId !== 'number') {
      return sendError(res, 'Valid content ID is required', 400);
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      logger.warn(`[PROFILE] Unlike content failed - Profile not found: ${profileId}`);
      return sendError(res, 'Profile not found', 404);
    }

    // Remove like if exists
    const hadLike = profile.likes.includes(contentId);
    profile.likes = profile.likes.filter(id => id !== contentId);
    await profile.save();

    if (hadLike) {
      logger.info(`[PROFILE] Content unliked: contentId=${contentId}, profile=${profile.name}`);
    }

    sendSuccess(res, { likes: profile.likes }, 'Content unliked successfully');
  } catch (error) {
    logger.error(`[PROFILE] Unlike content error: ${error.message}`);
    console.error('Unlike content error:', error);
    sendError(res, 'Server error unliking content', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { name, avatar } = req.body;

    const profile = await Profile.findById(profileId);
    if (!profile) {
      logger.warn(`[PROFILE] Update profile failed - Profile not found: ${profileId}`);
      return sendError(res, 'Profile not found', 404);
    }

    // Update fields if provided
    if (name !== undefined) {
      profile.name = name;
    }
    if (avatar !== undefined) {
      profile.avatar = avatar;
    }

    await profile.save();

    // Return updated profile data
    const profileData = {
      id: profile._id,
      name: profile.name,
      avatar: profile.avatar,
      likes: profile.likes
    };

    logger.info(`[PROFILE] Profile updated: ${profile.name} (${profileId})`);
    sendSuccess(res, profileData, 'Profile updated successfully');
  } catch (error) {
    logger.error(`[PROFILE] Update profile error: ${error.message}`);
    console.error('Update profile error:', error);

    if (error.code === 11000) {
      return sendError(res, 'Profile name already exists for this user', 409);
    }

    sendError(res, 'Server error updating profile', 500);
  }
};

const deleteProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    const profile = await Profile.findById(profileId);
    if (!profile) {
      logger.warn(`[PROFILE] Delete profile failed - Profile not found: ${profileId}`);
      return sendError(res, 'Profile not found', 404);
    }

    const profileName = profile.name;
    await Profile.findByIdAndDelete(profileId);

    logger.info(`[PROFILE] Profile deleted: ${profileName} (${profileId})`);
    sendSuccess(res, { id: profileId }, 'Profile deleted successfully');
  } catch (error) {
    logger.error(`[PROFILE] Delete profile error: ${error.message}`);
    console.error('Delete profile error:', error);
    sendError(res, 'Server error deleting profile', 500);
  }
};

const getGlobalLikeCounts = async (req, res) => {
  try {
    const likeCounts = await Profile.aggregate([
      { $unwind: '$likes' },
      { $group: { _id: '$likes', count: { $sum: 1 } } }
    ]);

    // Convert to object format { contentId: count }
    const counts = {};
    likeCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    sendSuccess(res, counts, 'Global like counts retrieved successfully');
  } catch (error) {
    logger.error(`[PROFILE] Get global like counts error: ${error.message}`);
    console.error('Get global like counts error:', error);
    sendError(res, 'Server error retrieving like counts', 500);
  }
};

module.exports = {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  getLikes,
  likeContent,
  unlikeContent,
  getGlobalLikeCounts
};
