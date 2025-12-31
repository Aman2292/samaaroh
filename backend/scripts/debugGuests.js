const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Guest = require('../models/Guest');

const debugGuests = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    const eventId = '6922f7e3a4f9714148fa58fc';
    
    // Check all guests
    const allGuests = await Guest.find({});
    console.log(`Total guests in collection: ${allGuests.length}`);
    
    // Check guests for this specific event
    const eventGuests = await Guest.find({ eventId: eventId });
    console.log(`Guests for event ${eventId}: ${eventGuests.length}\n`);
    
    if (eventGuests.length > 0) {
      console.log('Sample guests:');
      eventGuests.slice(0, 5).forEach(g => {
        console.log(`- ${g.firstName} ${g.lastName}`);
        console.log(`  eventId: ${g.eventId}`);
        console.log(`  isDeleted: ${g.isDeleted}`);
        console.log('');
      });
    } else {
      console.log('Checking if eventId mismatch...');
      if (allGuests.length > 0) {
        console.log('\nAll guest eventIds in database:');
        const uniqueEventIds = [...new Set(allGuests.map(g => g.eventId.toString()))];
        uniqueEventIds.forEach(id => {
          const count = allGuests.filter(g => g.eventId.toString() === id).length;
          console.log(`  ${id}: ${count} guests`);
        });
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

debugGuests();
