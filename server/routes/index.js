const express = require('express');
const router = express.Router();

// ============================================
// API Routes
// ============================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports = router;
