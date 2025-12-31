const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Guest = require('../models/Guest');
const Event = require('../models/Event');

const checkMigration = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // Count guests in Guest collection
    const guestCount = await Guest.countDocuments({ isDeleted: false });
    console.log(`Total guests in Guest collection: ${guestCount}`);
    
    // List all guests
    const guests = await Guest.find({ isDeleted: false })
      .select('firstName lastName eventId rsvpStatus guestType side')
      .populate('eventId', 'eventName')
      .limit(20);
    
    console.log('\nGuests found:');
    console.log('═'.repeat(80));
    guests.forEach((guest, index) => {
      console.log(`${index + 1}. ${guest.firstName} ${guest.lastName}`);
      console.log(`   Event: ${guest.eventId?.eventName || 'N/A'}`);
      console.log(`   Type: ${guest.guestType} | Side: ${guest.side} | RSVP: ${guest.rsvpStatus}`);
      console.log('');
    });
    
    // Check events with embedded guests
    const eventsWithGuests = await Event.countDocuments({ 'guests.0': { $exists: true } });
    console.log(`\nEvents still with embedded guests: ${eventsWithGuests}`);
    
    if (eventsWithGuests > 0) {
      const events = await Event.find({ 'guests.0': { $exists: true } })
        .select('eventName guests');
      events.forEach(event => {
        console.log(`  - ${event.eventName}: ${event.guests.length} embedded guests`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkMigration();
