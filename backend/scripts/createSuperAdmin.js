const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const superAdminExists = await User.findOne({ role: 'SUPER_ADMIN' });

    if (superAdminExists) {
      console.log('Super Admin already exists');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt); // Default password, change immediately

    const superAdmin = await User.create({
      email: 'admin@samaaroh.com',
      password: hashedPassword,
      name: 'Platform Admin',
      role: 'SUPER_ADMIN',
      organizationId: null,
      isActive: true,
    });

    console.log('Super Admin created successfully:', superAdmin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
