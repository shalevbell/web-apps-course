const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netflix-clone';
  console.log(`Connecting to MongoDB: ${mongoURI}`);

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`[DATABASE] MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`MongoDB connection failed: ${error.message}`);
    console.warn('Server will start without database connection. Some features may not work.');
    logger.warn(`[DATABASE] MongoDB connection failed: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
