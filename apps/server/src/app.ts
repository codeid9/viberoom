import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import roomRoutes from './routes/roomRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';

const app: Application = express();

// Trust reverse proxy (Render, AWS ALB) so req.ip reflects the genuine client
app.set('trust proxy', 1);

// Standard HTTP Security Headers (Cross-Origin Resource Sharing preserved)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS: Allow only configured frontend origin with credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Payload size limit to prevent memory exhaustion DoS
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Apply General Rate Limiter across all /api routes
app.use('/api', generalApiLimiter);

// Health check endpoint (outside of general rate limiter)
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'VibeRoom server is running 🚀',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin routes (Protected by requireAuth + requireAdmin)
app.use('/api/admin', adminRoutes);

// Room routes
app.use('/api/rooms', roomRoutes);

export default app;