const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Organization = require('../models/Organization');

dotenv.config();

const checkAndFixUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const email = 'aman@gmail.com';
    const password = '123456';

    let user = await User.findOne({ email });

    if (user) {
      console.log('User found. Resetting password...');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      console.log('Password reset successfully.');
    } else {
      console.log('User not found. Creating user and organization...');
      
      // Create Organization
      const organization = await Organization.create({
        name: "Aman's Events",
        phone: '9876543210',
        city: 'Mumbai',
        email: email,
        isActive: true,
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create User
      user = await User.create({
        email,
        password: hashedPassword,
        name: 'Aman User',
        phone: '9876543210',
        role: 'PLANNER_OWNER',
        organizationId: organization._id,
        isActive: true,
      });

      // Link user to organization
      organization.ownerUserId = user._id;
      await organization.save();

      console.log('User and Organization created successfully.');
    }

    console.log(`\nCredentials verified for: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAndFixUser();
