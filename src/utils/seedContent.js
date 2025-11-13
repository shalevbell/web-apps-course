const fs = require('fs');
const path = require('path');
const Content = require('../models/Content');
const User = require('../models/User');

async function seedContent() {
  try {
    // Check if content already exists
    const contentCount = await Content.countDocuments();

    if (contentCount > 0) {
      console.log(`[${new Date().toISOString()}] Content already seeded (${contentCount} items found). Skipping seed.`);
      return { success: true, seeded: false, count: contentCount };
    }

    // Read content.json
    const contentJsonPath = path.join(__dirname, '../data/content.json');
    const contentData = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));

    // Insert all content into the database
    const result = await Content.insertMany(contentData);

    console.log(`[${new Date().toISOString()}] Successfully seeded ${result.length} content items to database.`);
    return { success: true, seeded: true, count: result.length };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error seeding content:`, error.message);
    throw error;
  }
}

async function reseedContent() {
  try {
    // Delete all existing content
    await Content.deleteMany({});
    console.log(`[${new Date().toISOString()}] Cleared existing content from database.`);

    // Read content.json
    const contentJsonPath = path.join(__dirname, '../data/content.json');
    const contentData = JSON.parse(fs.readFileSync(contentJsonPath, 'utf8'));

    // Insert all content into the database
    const result = await Content.insertMany(contentData);

    console.log(`[${new Date().toISOString()}] Successfully reseeded ${result.length} content items to database.`);
    return { success: true, count: result.length };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error reseeding content:`, error.message);
    throw error;
  }
}

async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const adminUser = await User.findOne({ username: 'admin' });

    if (adminUser) {
      console.log(`[${new Date().toISOString()}] Admin user already exists. Skipping admin seed.`);
      return { success: true, seeded: false };
    }

    // Create admin user
    const admin = new User({
      email: 'admin@netflix-clone.com',
      username: 'admin',
      password: 'admin',
      isAdmin: true
    });

    await admin.save();
    console.log(`[${new Date().toISOString()}] Successfully created admin user.`);
    return { success: true, seeded: true };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error seeding admin user:`, error.message);
    throw error;
  }
}

module.exports = { seedContent, reseedContent, seedAdminUser };
