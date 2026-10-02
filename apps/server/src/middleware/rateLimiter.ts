import rateLimit from 'express-rate-limit';

// 1. General API Limiter: 100 requests per 15 minutes per IP
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, // Draft-6 / Draft-7 RateLimit headers
  legacyHeaders: false, // Disables X-RateLimit-* headers
  message: {
    error: 'Too many requests from this IP. Please try again later.',
  },
});

// 2. Login Brute-Force Limiter: 5 failed attempts per 15 minutes per IP
// Successful logins do not count against this quota (skipSuccessfulRequests: true)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many failed login attempts. Please try again in 15 minutes.',
  },
});

// 3. Room Creation Limiter: 10 rooms per hour per IP / authenticated user
export const roomCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Key by authenticated userId if available, otherwise fallback to IP
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip || 'anonymous';
  },
  message: {
    error: 'Room creation limit reached. You can only create up to 10 rooms per hour.',
  },
});

// 4. Admin API Limiter: 60 requests per 15 minutes per admin IP
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip || 'admin';
  },
  message: {
    error: 'Too many admin operations. Please slow down.',
  },
});