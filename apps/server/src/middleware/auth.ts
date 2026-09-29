import { Request, Response, NextFunction } from 'express';
import Session from '../models/Session.js';
import User, { IUser } from '../models/User.js';
import { hashSessionToken } from '../utils/security.js';

// Extend Express Request interface to include authenticated user and session
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      sessionId?: string;
    }
  }
}

export const SESSION_COOKIE_NAME = 'viberoom_session';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!rawToken || typeof rawToken !== 'string') {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const tokenHash = hashSessionToken(rawToken);

    // Look up session by hashed token
    const session = await Session.findOne({ sessionIdHash: tokenHash });

    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ error: 'Invalid or expired session. Please log in.' });
      return;
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ error: 'Session expired. Please log in again.' });
      return;
    }

    // Verify user existence and active status
    const user = await User.findById(session.userId);

    if (!user || user.status !== 'active') {
      await Session.deleteMany({ userId: session.userId });
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(401).json({ error: 'Account revoked or inaccessible.' });
      return;
    }

    // Update session lastActivityAt asynchronously
    session.lastActivityAt = new Date();
    session.save().catch(() => {});

    // Attach verified user and session to request
    req.user = user;
    req.sessionId = session._id.toString();

    next();
  } catch (error) {
    console.error('requireAuth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    return;
  }
  next();
};