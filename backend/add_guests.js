const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let mongoUri = '';
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGO_URI=(.*)/);
    if (match) mongoUri = match[1].trim();
} catch (e) {
    console.error("Could not read .env", e);
}

if (!mongoUri) {
    console.error("MONGO_URI not found");
    process.exit(1);
}

mongoose.connect(mongoUri)
    .then(async () => {
        console.log("Connected to MongoDB");
        
        let Event, Guest, User;
        try {
            Event = require('./models/Event');
            Guest = require('./models/Guest');
            User = require('./models/User');
        } catch (e) {
            console.log("Models schema fallback...");
            // Fallback schemas if require fails (unlikely if path is correct)
            const eventSchema = new mongoose.Schema({ eventName: String });
            Event = mongoose.model('Event', eventSchema);
            const userSchema = new mongoose.Schema({ email: String });
            User = mongoose.model('User', userSchema);
            // Guest schema... omitted for brevity in fallback as we expect require to work
        }

        // Find Event
        const event = await Event.findOne({ eventName: /QR Test/i }) || await Event.findOne();
        if (!event) { console.log("No event found"); process.exit(1); }
        console.log(`Using event: ${event.eventName}`);

        // Find User for createdBy
        const user = await User.findOne();
        if (!user) { console.log("No user found"); process.exit(1); }
        console.log(`Using user: ${user.email}`);

        // Find Organization (Guest model needs organizationId)
        // Check if event has organizationId, or user has it via some logic, 
        // usually event.organizationId is best but our simplistic event find might not populate it if we use lean/model.
        // Let's assume we can fetch it from the event if referencing model, or fetch an Org.
        let orgId = event.organizationId;
        if (!orgId) {
             const Organization = require('./models/Organization');
             const org = await Organization.findOne();
             orgId = org._id;
        }

        const newGuests = [
            { firstName: 'Mobile', lastName: 'Tester', side: 'groom', rsvpStatus: 'attending', email: 'mobile@test.com', createdBy: user._id, organizationId: orgId },
            { firstName: 'Scanner', lastName: 'User', side: 'bride', rsvpStatus: 'attending', createdBy: user._id, organizationId: orgId },
            { firstName: 'Already', lastName: 'CheckedIn', side: 'groom', rsvpStatus: 'attending', checkedIn: true, checkInTime: new Date(), actualHeadcount: 1, createdBy: user._id, organizationId: orgId },
            { firstName: 'VIP', lastName: 'Guest', side: 'both',  rsvpStatus: 'pending', category: 'vip', createdBy: user._id, organizationId: orgId }
        ];

        for (const g of newGuests) {
            // Check if exists to avoid dupes
            const exists = await Guest.findOne({ firstName: g.firstName, lastName: g.lastName, eventId: event._id });
            if (!exists) {
                await Guest.create({ ...g, eventId: event._id });
                console.log(`Added ${g.firstName}`);
            } else {
                console.log(`Skipped ${g.firstName} (already exists)`);
            }
        }

        console.log("Done!");
        mongoose.disconnect();
    })
    .catch(err => {
        console.error("Error:", err);
        mongoose.disconnect();
    });
