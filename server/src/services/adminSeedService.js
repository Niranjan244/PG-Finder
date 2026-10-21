import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import User from '../models/User.js';

export const initializeAdminAccount = async () => {
  const { adminEmail, adminPassword } = env;

  if (!adminEmail || !adminPassword) {
    console.log('Admin credentials not specified in .env; skipping admin initialization.');
    return;
  }

  try {
    const normalizedEmail = adminEmail.trim().toLowerCase();
    const existingAdmin = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await User.create({
        name: 'System Administrator',
        email: normalizedEmail,
        phone: '1000000000',
        passwordHash,
        role: 'admin',
        isBlocked: false,
      });

      console.log(`Default administrator account successfully initialized for: ${normalizedEmail}`);
    } else {
      const isMatch = existingAdmin.passwordHash
        ? await bcrypt.compare(adminPassword, existingAdmin.passwordHash)
        : false;

      if (!isMatch) {
        const salt = await bcrypt.genSalt(12);
        existingAdmin.passwordHash = await bcrypt.hash(adminPassword, salt);
        await existingAdmin.save();
        console.log(`Administrator password synchronized with .env: ${normalizedEmail}`);
      }
      console.log(`Administrator account active: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error(`Failed to initialize administrator account: ${error.message}`);
  }
};
