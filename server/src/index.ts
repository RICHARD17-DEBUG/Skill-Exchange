import http from 'http';
import { app } from './app';
import { connectDB } from './config/db';
import { autoSeedIfEmpty } from './seed/seed';
import { initSocketServer } from './socket';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await autoSeedIfEmpty();

    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Skill Exchange Platform Backend API & WebSockets Running`);
      console.log(`📍 Port: http://localhost:${PORT}`);
      console.log(`💎 Economy: Credits-Only Model (Strictly Non-Monetary)`);
      console.log(`📡 Real-Time Rooms & WebRTC Signaling: ACTIVE`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();