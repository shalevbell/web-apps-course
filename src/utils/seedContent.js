const fs = require('fs');
const path = require('path');
const Content = require('../models/Content');

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

module.exports = { seedContent, reseedContent };
