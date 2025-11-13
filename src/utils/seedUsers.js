const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Profile = require('../models/Profile');

async function seedUsers() {
  try {
    // Check if users already exist
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      console.log(`[${new Date().toISOString()}] Users already seeded (${userCount} users found). Skipping seed.`);
      return { success: true, seeded: false, userCount, profileCount: await Profile.countDocuments() };
    }

    // Read users.json
    const usersJsonPath = path.join(__dirname, '../data/users.json');
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));

    let totalUsersCreated = 0;
    let totalProfilesCreated = 0;

    // Insert users and their profiles
    for (const userData of usersData) {
      // Create user (password will be hashed by the pre-save hook)
      const user = await User.create({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        isAdmin: userData.isAdmin || false
      });

      totalUsersCreated++;

      // Create profiles for this user
      if (userData.profiles && userData.profiles.length > 0) {
        for (const profileData of userData.profiles) {
          await Profile.create({
            userId: user._id,
            name: profileData.name,
            avatar: profileData.avatar,
            likes: profileData.likes || []
          });
          totalProfilesCreated++;
        }
      }
    }

    console.log(`[${new Date().toISOString()}] Successfully seeded ${totalUsersCreated} users and ${totalProfilesCreated} profiles to database.`);
    return { success: true, seeded: true, userCount: totalUsersCreated, profileCount: totalProfilesCreated };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error seeding users:`, error.message);
    throw error;
  }
}

async function reseedUsers() {
  try {
    // Delete all existing profiles first (due to foreign key constraint)
    const deletedProfiles = await Profile.deleteMany({});
    console.log(`[${new Date().toISOString()}] Cleared ${deletedProfiles.deletedCount} existing profiles from database.`);

    // Delete all existing users
    const deletedUsers = await User.deleteMany({});
    console.log(`[${new Date().toISOString()}] Cleared ${deletedUsers.deletedCount} existing users from database.`);

    // Read users.json
    const usersJsonPath = path.join(__dirname, '../data/users.json');
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));

    let totalUsersCreated = 0;
    let totalProfilesCreated = 0;

    // Insert users and their profiles
    for (const userData of usersData) {
      // Create user (password will be hashed by the pre-save hook)
      const user = await User.create({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        isAdmin: userData.isAdmin || false
      });

      totalUsersCreated++;

      // Create profiles for this user
      if (userData.profiles && userData.profiles.length > 0) {
        for (const profileData of userData.profiles) {
          await Profile.create({
            userId: user._id,
            name: profileData.name,
            avatar: profileData.avatar,
            likes: profileData.likes || []
          });
          totalProfilesCreated++;
        }
      }
    }

    console.log(`[${new Date().toISOString()}] Successfully reseeded ${totalUsersCreated} users and ${totalProfilesCreated} profiles to database.`);
    return { success: true, userCount: totalUsersCreated, profileCount: totalProfilesCreated };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error reseeding users:`, error.message);
    throw error;
  }
}

module.exports = { seedUsers, reseedUsers };
