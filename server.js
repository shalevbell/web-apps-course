require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const selfsigned = require('selfsigned');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { seedContent, seedAdminUser } = require('./src/utils/seedContent');
const { seedUsers } = require('./src/utils/seedUsers');
const app = express();

// Database & session configuration
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/netflix-clone';
const sessionSecret = process.env.SESSION_SECRET || 'dev_session_secret';
const NODE_ENV = process.env.NODE_ENV || 'production';
process.env.NODE_ENV = NODE_ENV;
const isProduction = NODE_ENV === 'production';
const sessionCookieSecure = typeof process.env.SESSION_COOKIE_SECURE === 'string'
  ? process.env.SESSION_COOKIE_SECURE === 'true'
  : isProduction;
const sessionCookieSameSite = sessionCookieSecure ? 'none' : 'lax';

logger.info(`=======================================`);

if (!process.env.SESSION_SECRET) {
  logger.warn('[SERVER] SESSION_SECRET not set. Falling back to development secret.');
}

if (isProduction) {
  app.set('trust proxy', 1);
}

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

// Session management
app.use(session({
  name: 'sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7 // 7 days
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: sessionCookieSameSite,
    secure: sessionCookieSecure
  }
}));

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
const SSL_DAYS_VALID = parseInt(process.env.SSL_DAYS_VALID || '365', 10);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    const dbConnected = await connectDB();

    // Seed content and admin user into database if connected
    // Seed data into database if connected
    if (dbConnected) {
      await seedUsers();
      await seedContent();
      await seedAdminUser();
    }

    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, {
      days: SSL_DAYS_VALID,
      keySize: 2048,
      algorithm: 'sha256',
      extensions: [
        {
          name: 'basicConstraints',
          cA: true
        },
        {
          name: 'subjectAltName',
          altNames: [
            { type: 2, value: 'localhost' },
            { type: 7, ip: '127.0.0.1' }
          ]
        }
      ]
    });

    const server = https.createServer({
      key: pems.private,
      cert: pems.cert
    }, app);

    server.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`Web Apps Course Netflix Clone Server (HTTPS)`);
      console.log(`Server running on https://localhost:${PORT}`);
      console.log(`Database: ${dbConnected ? 'Connected' : 'Not Connected'}`);
      console.log(`Visit: https://localhost:${PORT}/login.html`);
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
        console.error(`\n   To find and kill the process:`);
        console.error(`   - macOS/Linux: lsof -ti :${PORT} | xargs kill -9`);
        console.error(`   - Linux (alternative): sudo fuser -k ${PORT}/tcp`);
        console.error(`   - Windows: netstat -ano | findstr :${PORT}, then taskkill /PID <PID> /F\n`);
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
