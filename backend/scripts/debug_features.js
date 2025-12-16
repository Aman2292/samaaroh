const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
require('dotenv').config();

const debugUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'rajesh@weddingplanner.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User ${email} not found`);
      return;
    }

    console.log('User found:', user.name);
    console.log('Organization ID:', user.organizationId);

    if (user.organizationId) {
      const org = await Organization.findById(user.organizationId);
      if (org) {
        console.log('Organization found:', org.name);
        console.log('Subscribed Features:', JSON.stringify(org.subscribedFeatures, null, 2));
      } else {
        console.log('Organization not found in DB');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

debugUser();
