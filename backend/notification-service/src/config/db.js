const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGO_URI) => {
  if (!uri) {
    throw new Error('MONGO_URI is required for Notification Service');
  }

  await mongoose.connect(uri);
  console.log('✅ Notification MongoDB connected');
};

module.exports = connectDB;
