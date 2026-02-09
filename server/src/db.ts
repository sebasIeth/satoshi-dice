import mongoose from 'mongoose';

let cached = false;

export async function connectDB() {
  if (cached || mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/satoshi-dice';
  try {
    await mongoose.connect(uri);
    cached = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
}
