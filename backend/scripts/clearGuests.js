const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Guest = require('../models/Guest');

const clearGuests = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing in .env file");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");
    console.log('');

    // Delete all guests from Guest collection
    const result = await Guest.deleteMany({});
    
    console.log('═'.repeat(60));
    console.log(`✓ Cleared Guest collection: ${result.deletedCount} guests removed`);
    console.log('═'.repeat(60));
    console.log('');
    console.log('Guest collection is now empty and ready for fresh migration.');
    console.log('');

  } catch (error) {
    console.error("✗ Error clearing guests:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
    process.exit(0);
  }
};

clearGuests();
