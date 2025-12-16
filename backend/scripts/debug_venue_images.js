const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Organization = require('../models/Organization');

const checkVenueImages = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI missing");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const email = 'rajesh@weddingplanner.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User ${email} not found`);
      process.exit(0);
    }

    const org = await Organization.findOne({ ownerUserId: user._id });
    if (!org) {
        console.log("Organization not found");
        process.exit(0);
    }

    console.log(`Organization: ${org.name}`);
    if (org.venues && org.venues.length > 0) {
        org.venues.forEach((v, idx) => {
            console.log(`Venue [${idx}]: ${v.category} - ${v.description ? v.description.substring(0, 30) : 'No desc'}`);
            console.log(`  Gallery Images Count: ${v.galleryImages ? v.galleryImages.length : 0}`);
            if (v.galleryImages && v.galleryImages.length > 0) {
                console.log(`  Sample Image Start: ${v.galleryImages[0].substring(0, 50)}...`);
            }
        });
    } else {
        console.log("No venues found in organization.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkVenueImages();
