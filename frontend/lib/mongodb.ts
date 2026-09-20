import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DATABASE_NAME || "saudememora";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_CONNECTION_STRING environment variable inside .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
