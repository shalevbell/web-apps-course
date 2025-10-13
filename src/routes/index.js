const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// ============================================
// API Routes
// ============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get content data
router.get('/content', (req, res) => {
  try {
    const contentPath = path.join(__dirname, '../data/content.json');
    const contentData = fs.readFileSync(contentPath, 'utf8');
    res.json(JSON.parse(contentData));
  } catch (error) {
    console.error('Error reading content.json:', error);
    res.status(500).json({ error: 'Failed to load content data' });
  }
});

module.exports = router;
