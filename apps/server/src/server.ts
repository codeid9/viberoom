import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server, Socket } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { registerRoomHandlers } from './sockets/roomHandler.js';
import { socketAuthMiddleware } from './sockets/authMiddleware.js';
import { initScheduledCleanup } from './services/cleanupService.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to Express controllers (e.g., adminRoomController)
app.set('io', io);

// Enforce session authentication on all incoming socket connections
io.use(socketAuthMiddleware);

io.on('connection', (socket: Socket) => {
  const username = socket.data.user?.username || 'Unknown';
  console.log(`Socket authenticated & connected: ${socket.id} (User: ${username})`);

  registerRoomHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} (${username})`);
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // Start background data retention cleanup (does not block HTTP listener)
    initScheduledCleanup(io);

    httpServer.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT} 🚀`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();