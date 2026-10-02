import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import { hashPassword } from '../utils/security.js';

const seedAdmin = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('Usage: npx tsx src/scripts/seedAdmin.ts <username> <password>');
    console.error('Or set ADMIN_USERNAME and ADMIN_PASSWORD in your environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB.');

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });

    const passwordHash = await hashPassword(password);

    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = 'admin';
      existing.status = 'active';
      await existing.save();
      console.log(`Admin user "${cleanUsername}" updated successfully.`);
    } else {
      await User.create({
        username: cleanUsername,
        passwordHash,
        role: 'admin',
        status: 'active',
      });
      console.log(`Admin user "${cleanUsername}" created successfully.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  }
};

seedAdmin();