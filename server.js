require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { seedContent } = require('./src/utils/seedContent');
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
  logger.error(`[SERVER] Error: ${err.message}`);
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
    logger.info(`=======================================`);
    const dbConnected = await connectDB();

    // Seed content into database if connected
    if (dbConnected) {
      await seedContent();
    }

    const server = app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`Web Apps Course Netflix Clone Server`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${dbConnected ? '✅' : '⚠️'}`);
      console.log(`Visit: http://localhost:${PORT}/login.html`);
      console.log('='.repeat(50));

      logger.info(`[SERVER] Server started on port ${PORT}`);
      logger.info(`[SERVER] Database connection: ${dbConnected ? 'connected' : 'not connected'}`);
    });

    // Handle server errors (e.g., port already in use)
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`[SERVER] Port ${PORT} is already in use. Please stop the other process or use a different port.`);
        console.error(`\nError: Port ${PORT} is already in use.`);
        console.error(`   Please stop the process using port ${PORT} or set a different PORT in your .env file.`);
        console.error(`   On Windows, you can find the process with: netstat -ano | findstr :${PORT}`);
        console.error(`   Then kill it with: taskkill /PID <PID> /F\n`);
        process.exit(1);
      } else {
        logger.error(`[SERVER] Server error: ${err.message}`);
        console.error(`Server error: ${err.message}`);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error(`[SERVER] Failed to start server: ${error.message}`);
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
