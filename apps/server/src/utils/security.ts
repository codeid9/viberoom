import argon2 from 'argon2';
import crypto from 'crypto';

// 1. Hash password with Argon2id using secure memory and time parameters
export const hashPassword = async (plainText: string): Promise<string> => {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
};

// 2. Verify password with Argon2id
export const verifyPassword = async (
  hash: string,
  plainText: string
): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plainText);
  } catch (err) {
    return false;
  }
};

// 3. Generate high-entropy raw session token (32 random bytes -> 64 hex characters)
export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// 4. Hash session token with SHA-256 before database lookup/storage
export const hashSessionToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};