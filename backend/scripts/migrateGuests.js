const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Event = require('../models/Event');
const Guest = require('../models/Guest');

/**
 * Split full name into firstName and lastName
 */
const splitName = (fullName) => {
  if (!fullName) return { firstName: 'Unknown', lastName: '' };
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { firstName, lastName };
};

/**
 * Transform RSVP status from old to new schema
 * Old: 'invited', 'confirmed', 'declined', 'tentative', 'checked_in'
 * New: 'pending', 'attending', 'not_attending', 'maybe'
 */
const transformRSVPStatus = (oldStatus) => {
  const statusMap = {
    'invited': 'pending',
    'confirmed': 'attending',
    'declined': 'not_attending',
    'tentative': 'maybe',
    'checked_in': 'attending' // Will set checkedIn flag separately
  };
  
  return statusMap[oldStatus] || 'pending';
};

/**
 * Main migration function
 */
const migrateGuests = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing in .env file");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");
    console.log('');

    // Find all events with embedded guests
    const events = await Event.find({ 
      'guests.0': { $exists: true } 
    }).select('_id organizationId eventName guests');
    
    console.log(`Found ${events.length} event(s) with embedded guests.`);
    console.log('');

    let totalGuestsMigrated = 0;
    let totalEventsProcessed = 0;

    for (const event of events) {
      console.log(`Processing Event: "${event.eventName}" (${event._id})`);
      console.log(`  Organization ID: ${event.organizationId}`);
      console.log(`  Embedded guests count: ${event.guests.length}`);
      
      let migratedCount = 0;
      
      for (const embeddedGuest of event.guests) {
        try {
          // Split name into firstName and lastName
          const { firstName, lastName } = splitName(embeddedGuest.name);
          
          // Transform RSVP status
          const newRsvpStatus = transformRSVPStatus(embeddedGuest.rsvpStatus);
          const wasCheckedIn = embeddedGuest.rsvpStatus === 'checked_in';
          
          // Map guest type (group -> guestType)
          // Old: 'family', 'friends', 'vip', 'vendor', 'other'
          // New: 'family', 'friend', 'colleague', 'vip', 'vendor', 'other'
          let guestType = embeddedGuest.group;
          if (guestType === 'friends') guestType = 'friend';
          
          // Create new Guest document
          const newGuest = new Guest({
            eventId: event._id,
            organizationId: event.organizationId,
            
            // Personal Info
            firstName,
            lastName,
            email: embeddedGuest.email || '',
            phone: embeddedGuest.phone || '',
            
            // Classification
            guestType: guestType || 'friend',
            side: embeddedGuest.side || 'neutral',
            
            // RSVP
            rsvpStatus: newRsvpStatus,
            
            // Plus One (embedded had headcount and plusOnes)
            plusOne: embeddedGuest.plusOnes > 0,
            plusOneAttending: embeddedGuest.plusOnes > 0,
            
            // Dietary & Special Requests
            dietaryRestrictions: embeddedGuest.dietaryRestrictions 
              ? [embeddedGuest.dietaryRestrictions] 
              : [],
            specialRequests: embeddedGuest.specialNotes || '',
            notes: embeddedGuest.specialNotes || '',
            
            // Source Tracking
            // Check source if exists, otherwise default to 'manual'
            invitationSent: embeddedGuest.source === 'csv_import' ? true : false,
            
            // Check-in
            checkedIn: wasCheckedIn,
            checkInTime: embeddedGuest.checkedInAt || null,
            
            // Metadata - preserve original tracking
            createdBy: embeddedGuest.addedBy || event.organizationId,
            createdAt: embeddedGuest.addedAt || new Date(),
            isDeleted: false
          });
          
          await newGuest.save();
          migratedCount++;
          console.log(`    ✓ Migrated guest: ${firstName} ${lastName}`);
          
        } catch (guestError) {
          console.error(`    ✗ Failed to migrate guest "${embeddedGuest.name}":`, guestError.message);
        }
      }
      
      console.log(`  → Migrated ${migratedCount}/${event.guests.length} guests`);
      console.log('');
      
      totalGuestsMigrated += migratedCount;
      totalEventsProcessed++;
    }

    console.log('═'.repeat(60));
    console.log('Migration Summary:');
    console.log(`  Events processed: ${totalEventsProcessed}`);
    console.log(`  Total guests migrated: ${totalGuestsMigrated}`);
    console.log('═'.repeat(60));
    console.log('');
    console.log("✓ Migration completed successfully!");
    console.log('');
    console.log("Next steps:");
    console.log("  1. Verify guests appear in the Guest collection");
    console.log("  2. Test frontend guest list to ensure data displays correctly");
    console.log("  3. If everything looks good, run the schema cleanup to remove embedded guests from Event model");
    console.log('');

  } catch (error) {
    console.error("✗ Error during migration:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run migration
migrateGuests();
