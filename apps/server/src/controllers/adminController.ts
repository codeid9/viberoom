import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { hashPassword } from '../utils/security.js';

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// 1. GET /api/admin/users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({})
      .select('_id username role status createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .lean();

    const safeUsers = users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
    }));

    res.status(200).json({ users: safeUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// 2. POST /api/admin/users
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      return;
    }

    // Alphanumeric + underscore check for clean URL-safe usernames
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }

    // Hash with Argon2id
    const passwordHash = await hashPassword(password);

    // Enforce role: 'user' and status: 'active' strictly on the backend
    const newUser = await User.create({
      username: cleanUsername,
      passwordHash,
      role: 'user',
      status: 'active',
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
        lastLoginAt: null,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// 3. PATCH /api/admin/users/:userId/status
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    if (status !== 'active' && status !== 'revoked') {
      res.status(400).json({ error: 'Status must be either "active" or "revoked"' });
      return;
    }

    // Prevent admin from revoking their own account
    if (req.user && req.user._id.toString() === userId) {
      res.status(400).json({ error: 'You cannot revoke your own account' });
      return;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    targetUser.status = status;
    await targetUser.save();

    // Invalidate all active sessions if user is revoked
    if (status === 'revoked') {
      await Session.deleteMany({ userId: targetUser._id });
    }

    res.status(200).json({
      message: `User status updated to ${status}`,
      user: {
        id: targetUser._id.toString(),
        username: targetUser.username,
        role: targetUser.role,
        status: targetUser.status,
        createdAt: targetUser.createdAt,
        lastLoginAt: targetUser.lastLoginAt || null,
      },
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// 4. POST /api/admin/users/:userId/reset-password
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { password } = req.body || {};

    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long' });
      return;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Hash with Argon2id
    targetUser.passwordHash = await hashPassword(password);
    await targetUser.save();

    // Invalidate all active sessions so old sessions cannot continue using the account
    await Session.deleteMany({ userId: targetUser._id });

    res.status(200).json({
      message: `Password reset successfully for user "${targetUser.username}". All existing sessions have been terminated.`,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// 5. DELETE /api/admin/users/:userId
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    // Guard: Prevent admin from deleting themselves
    if (req.user && req.user._id.toString() === userId) {
      res.status(400).json({ error: 'You cannot delete your own admin account' });
      return;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Guard: Prevent deleting another admin account
    if (targetUser.role === 'admin') {
      res.status(403).json({ error: 'Administrative accounts cannot be deleted through this endpoint' });
      return;
    }

    // Invalidate all sessions before deleting the user document
    await Session.deleteMany({ userId: targetUser._id });
    await User.deleteOne({ _id: targetUser._id });

    res.status(200).json({
      message: `User "${targetUser.username}" permanently deleted`,
      userId,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};