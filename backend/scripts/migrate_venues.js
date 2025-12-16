const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Organization = require('../models/Organization');
const Venue = require('../models/Venue');

const migrateVenues = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI missing");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const organizations = await Organization.find({ 'venues.0': { $exists: true } });
    console.log(`Found ${organizations.length} organizations with embedded venues.`);

    for (const org of organizations) {
        console.log(`Processing Org: ${org.name} (${org._id})`);
        
        let migratedCount = 0;
        for (const vData of org.venues) {
            // Create new Venue document
            const newVenue = new Venue({
                organizationId: org._id,
                category: vData.category,
                description: vData.description,
                address: vData.address,
                amenities: vData.amenities,
                policies: vData.policies,
                galleryImages: vData.galleryImages,
                floorPlans: vData.floorPlans,
                videoUrls: vData.videoUrls,
                documents: vData.documents,
                packages: vData.packages,
                availability: vData.availability,
                // If the embedded venue had an _id, we lose it unless we explicitly set it 
                // but usually it's better to let Mongoose generate a new top-level ID 
                // OR we can preserve it if needed. For safety, let's generate new ID but log correlation.
            });
            await newVenue.save();
            migratedCount++;
        }
        console.log(`  Migrated ${migratedCount} venues.`);
    }

    console.log("Migration completed successfully.");

  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrateVenues();
