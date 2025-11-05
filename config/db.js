import mongoose from 'mongoose';

const connectDB = async () => {
  const mongo_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    process.env.DB_URI;

  // Temporary verification log (remove after validation)
  console.log('MONGO_URI defined:', !!process.env.MONGO_URI);

  if (!mongo_URI) {
    throw new Error('Missing MongoDB connection string. Set MONGO_URI in your .env file.');
  }

  try {
    await mongoose.connect(mongo_URI);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
};

export default connectDB;