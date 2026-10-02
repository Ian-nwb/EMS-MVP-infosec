import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./db.js";
import { seedDemoData } from "./utils/seed.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await connectDB();

    console.log("Checking database seeds...");
    await seedDemoData();

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚀 EMS Backend Server listening on port ${PORT}`);
      console.log(`🔒 Security Layer: Active (Helmet, RateLimit, RBAC, AES)`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`=================================================`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
