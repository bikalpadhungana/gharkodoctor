const mongoose = require('mongoose');

const LOCAL_FALLBACK = 'mongodb://127.0.0.1:27017/gharkodoctor';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // In production, silently switching to an unauthenticated local DB would hide a real outage
    // and split data across two databases. Only fall back in development.
    if (process.env.NODE_ENV === 'production') {
      console.error(`❌ MongoDB connection failed: ${error.message}`);
      process.exit(1);
    }
    console.warn(`⚠️ MongoDB primary connection failed (${error.message}). Falling back to ${LOCAL_FALLBACK} (development only)...`);
    try {
      const connFallback = await mongoose.connect(LOCAL_FALLBACK);
      console.log(`✅ MongoDB Connected (Fallback): ${connFallback.connection.host}`);
    } catch (fallbackErr) {
      console.error(`❌ MongoDB Fallback Connection Error: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
