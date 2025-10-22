require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./src/config/db');
const app = express();

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Logs all incoming requests with timestamp
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// API Routes
// ============================================

const routes = require('./src/routes');
app.use('/api', routes);

// ============================================
// Error Handling Middleware
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// General error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Server error occurred' });
});

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`Web Apps Course Netflix Clone Server`);
      console.log(`Server running on port ${PORT}`);
      console.log(`✅ Database: Connected`);
      console.log(`Visit: http://localhost:${PORT}/login.html`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
