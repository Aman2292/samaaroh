const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Guest = require('../models/Guest');

const countGuests = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    
    const count = await Guest.countDocuments({});
    console.log(`Total guests in Guest collection: ${count}`);
    
    if (count > 0) {
      const guests = await Guest.find({}).limit(5);
      console.log('\nFirst 5 guests:');
      guests.forEach(g => {
        console.log(`- ${g.firstName} ${g.lastName} (${g.guestType})`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

countGuests();
