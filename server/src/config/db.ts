import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<string> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skill_exchange';
  
  try {
    // 1. Attempt connecting to a standalone MongoDB instance or cloud URI if running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] Connected successfully to external MongoDB at ${uri}`);
    return uri;
  } catch (err: any) {
    console.warn(`[Database] Standalone MongoDB unavailable (${err.message}). Starting disk-persistent embedded MongoDB...`);
    
    try {
      // 2. Persistent on-disk storage directory: server/data/db
      const dbPath = path.resolve(__dirname, '../../data/db');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'skill_exchange',
          dbPath,
          storageEngine: 'wiredTiger',
        }
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to Persistent Embedded MongoDB (Data saved in server/data/db)`);
      return memoryUri;
    } catch (memErr: any) {
      console.error('[Database] Failed to start embedded persistent MongoDB:', memErr);
      throw memErr;
    }
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};