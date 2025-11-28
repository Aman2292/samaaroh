const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Organization = require('../models/Organization');

dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Find an existing organization (or use the first one)
    const organization = await Organization.findOne({ isActive: true });
    
    if (!organization) {
      console.error('No active organization found. Please create an organization first.');
      process.exit(1);
    }

    console.log(`Using organization: ${organization.name}`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    // Create test users
    const testUsers = [
      {
        email: 'planner@test.com',
        password: hashedPassword,
        name: 'Test Planner',
        phone: '9876543210',
        role: 'PLANNER',
        organizationId: organization._id,
        isActive: true
      },
      {
        email: 'finance@test.com',
        password: hashedPassword,
        name: 'Test Finance',
        phone: '9876543211',
        role: 'FINANCE',
        organizationId: organization._id,
        isActive: true
      },
      {
        email: 'coordinator@test.com',
        password: hashedPassword,
        name: 'Test Coordinator',
        phone: '9876543212',
        role: 'COORDINATOR',
        organizationId: organization._id,
        isActive: true
      }
    ];

    // Check if users already exist and delete them
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        await User.deleteOne({ email: userData.email });
        console.log(`Deleted existing user: ${userData.email}`);
      }
    }

    // Create new users
    const createdUsers = await User.insertMany(testUsers);

    console.log('\n✅ Test users created successfully!\n');
    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('\n📧 PLANNER:');
    console.log('   Email: planner@test.com');
    console.log('   Password: test123');
    console.log('\n💰 FINANCE:');
    console.log('   Email: finance@test.com');
    console.log('   Password: test123');
    console.log('\n📋 COORDINATOR:');
    console.log('   Email: coordinator@test.com');
    console.log('   Password: test123');
    console.log('\n' + '='.repeat(60));
    console.log(`Organization: ${organization.name}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
};

createTestUsers();
