import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import roomRoutes from './routes/roomRoutes.js';

const app: Application = express();

// Enable CORS for frontend communication
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'VibeRoom server is running 🚀',
  });
});


// Room routes
app.use('/api/rooms', roomRoutes);


export default app;