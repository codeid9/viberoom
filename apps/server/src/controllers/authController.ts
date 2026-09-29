import { Request, Response } from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import {
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
} from '../utils/security.js';
import { SESSION_COOKIE_NAME } from '../middleware/auth.js';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Helper to configure production-ready cookie options
export const getSessionCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  };
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Find user by username
    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      // Use uniform message to prevent username enumeration
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account access has been revoked.' });
      return;
    }

    // Verify password with Argon2id
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    // Create server-side session
    const rawSessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await Session.create({
      sessionIdHash: tokenHash,
      userId: user._id,
      expiresAt,
      lastActivityAt: new Date(),
    });

    // Update user login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Set HttpOnly cookie
    res.cookie(SESSION_COOKIE_NAME, rawSessionToken, getSessionCookieOptions());

    res.status(200).json({
      message: 'Logged in successfully.',
      user: {
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  // req.user is populated by requireAuth middleware
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }

  res.status(200).json({
    user: {
      username: req.user.username,
      role: req.user.role,
      status: req.user.status,
    },
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (rawToken && typeof rawToken === 'string') {
      const tokenHash = hashSessionToken(rawToken);
      await Session.deleteOne({ sessionIdHash: tokenHash });
    }

    // Clear session cookie with identical attributes
    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Internal server error during logout.' });
  }
};