const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB primary connection failed (${error.message}). Attempting fallback to local mongodb://127.0.0.1:27017/gharkodoctor...`);
    try {
      const connFallback = await mongoose.connect('mongodb://127.0.0.1:27017/gharkodoctor');
      console.log(`✅ MongoDB Connected (Fallback): ${connFallback.connection.host}`);
    } catch (fallbackErr) {
      console.error(`❌ MongoDB Fallback Connection Error: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
