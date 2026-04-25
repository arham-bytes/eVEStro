const mongoose = require('mongoose');

// Cache variable for the database connection
let cachedConnection = null;

const connectDB = async () => {
  // If we already have a connection, use it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
    };

    // Store the connection in the cache
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, opts);
    console.log(`✅ MongoDB Connected: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    // Don't exit process in serverless, just throw error so Vercel can retry the function
    throw error;
  }
};

module.exports = connectDB;
