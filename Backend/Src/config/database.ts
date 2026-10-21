import "dotenv/config";
import mongoose from "mongoose";

export class DatabaseConnection {
  constructor(private readonly uri?: string) {}

  async connect(): Promise<void> {
    const uri = this.uri || process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not set in the environment");
    }

    await mongoose.connect(uri);
    console.info("MongoDB connected");
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    console.info("MongoDB disconnected");
  }
}

export default new DatabaseConnection();
