import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import roomRoutes from './routes/roomRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app: Application = express();

// Trust reverse proxy (Render, AWS ALB, etc.) so secure cookies work over HTTPS
app.set('trust proxy', 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'VibeRoom server is running 🚀',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Room routes
app.use('/api/rooms', roomRoutes);

export default app;