import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import { hashPassword } from '../utils/security.js';

const seedAdmin = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('Error: MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  // 1. Enforce explicit credentials via environment variables (no defaults, no CLI password arguments)
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username) {
    console.error('Error: ADMIN_USERNAME environment variable is required.');
    process.exit(1);
  }

  if (username.length < 3 || username.length > 30) {
    console.error('Error: ADMIN_USERNAME must be between 3 and 30 characters long.');
    process.exit(1);
  }

  if (!password || password.length < 12) {
    console.error('Error: ADMIN_PASSWORD environment variable is required and must be at least 12 characters.');
    process.exit(1);
  }

  try {
    // 2. Connect to MongoDB
    await mongoose.connect(mongoURI);

    // 3. Immutability check: NEVER overwrite, reset, reactivate, or promote an existing record
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.error(
        `Refusing to seed: A user with the username "${username}" already exists. No changes were made.`
      );
      process.exitCode = 1;
      return;
    }

    // 4. Hash password with existing Argon2id configuration
    const passwordHash = await hashPassword(password);

    // 5. Create new admin document
    await User.create({
      username,
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    console.log(`Success: Initial admin account "${username}" has been provisioned.`);
  } catch (error) {
    console.error('Error: An unexpected failure occurred during admin provisioning.');
    process.exitCode = 1;
  } finally {
    // 6. Guarantee connection closure on both success and error paths
    try {
      await mongoose.disconnect();
    } catch {
      // Suppress disconnection errors during teardown
    }
  }
};

seedAdmin();