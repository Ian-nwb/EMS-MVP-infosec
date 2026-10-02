import mongoose from "mongoose";

export async function connectDB() {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = "mongodb://127.0.0.1:27017/torinvr_db";

  try {
    if (!primaryUri) {
      throw new Error("MONGODB_URI is not set in environment variables");
    }
    console.log(`Connecting to primary MongoDB URI...`);
    const conn = await mongoose.connect(primaryUri, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB connection failed (${error.message}). Attempting local fallback at ${fallbackUri}...`);
    try {
      const fallbackConn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ Connected to local MongoDB fallback: ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error("❌ Both primary Atlas and local MongoDB fallback failed:", fallbackError.message);
      if (process.env.NODE_ENV !== "test") {
        process.exit(1);
      }
      throw error;
    }
  }
}
