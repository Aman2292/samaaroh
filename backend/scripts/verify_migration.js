const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Organization = require('../models/Organization');
const Venue = require('../models/Venue');

const verifyMigration = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI missing");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const venues = await Venue.find({});
    console.log(`Total Venues in Venue Collection: ${venues.length}`);

    if (venues.length > 0) {
        venues.forEach((v, idx) => {
            console.log(`[${idx}] Venue: ${v.category} (OrgID: ${v.organizationId})`);
            console.log(`    Gallery Images: ${v.galleryImages.length}`);
            console.log(`    Address: ${v.address?.city}`);
        });
    } else {
        console.error("No venues found in new collection! Migration might have failed.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

verifyMigration();
