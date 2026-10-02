import { Socket } from 'socket.io';
import cookie from 'cookie';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { hashSessionToken } from '../utils/security.js';
import { SESSION_COOKIE_NAME } from '../middleware/auth.js';

export interface AuthenticatedSocketUser {
  userId: string;
  username: string;
  role: 'admin' | 'user';
}

// Extend Socket.IO's official SocketData interface
declare module 'socket.io' {
  interface SocketData {
    user?: AuthenticatedSocketUser;
    senderName?: string;
    activeRoomId?: string;
  }
}
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const rawCookieHeader = socket.handshake.headers.cookie;

    if (!rawCookieHeader) {
      return next(new Error('Unauthorized: Authentication cookie missing'));
    }

    const parsedCookies = cookie.parse(rawCookieHeader);
    const sessionToken = parsedCookies[SESSION_COOKIE_NAME];

    if (!sessionToken || typeof sessionToken !== 'string') {
      return next(new Error('Unauthorized: Session token missing'));
    }

    // Hash the token to look up session in MongoDB
    const tokenHash = hashSessionToken(sessionToken);
    const session = await Session.findOne({ sessionIdHash: tokenHash });

    if (!session) {
      return next(new Error('Unauthorized: Invalid or expired session'));
    }

    if (new Date() > session.expiresAt) {
      await Session.deleteOne({ _id: session._id });
      return next(new Error('Unauthorized: Session expired'));
    }

    // Verify user exists and status is active
    const user = await User.findById(session.userId);

    if (!user || user.status !== 'active') {
      return next(new Error('Unauthorized: Account revoked or not found'));
    }

    // Bind authoritative, server-verified identity to socket.data
    // This can NEVER be overridden by client-sent payloads
    socket.data.user = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    };
    socket.data.senderName = user.username;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Unauthorized: Authentication verification failed'));
  }
};