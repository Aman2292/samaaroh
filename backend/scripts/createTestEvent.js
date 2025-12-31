// Create test event for Dream Weddings organization
const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('../models/Event');
const Guest = require('../models/Guest');
const Client = require('../models/Client');
const User = require('../models/User');
const qrCodeService = require('../services/qrCodeService');

const ORG_ID = '6922f52ba4f9714148fa5854'; // Dream Weddings

async function createTestData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a user in this organization
        const user = await User.findOne({ organizationId: ORG_ID });
        if (!user) {
            console.log('No user found for Dream Weddings organization.');
            process.exit(1);
        }
        console.log('Using User:', user.email);

        // Find or create a test client
        let client = await Client.findOne({ organizationId: ORG_ID });
        if (!client) {
            client = await Client.create({
                name: 'Test Wedding Client',
                email: 'testclient@example.com',
                phone: '9876543210',
                organizationId: ORG_ID,
                createdBy: user._id
            });
        }
        console.log('Using Client:', client.name);

        // Create today's event
        const today = new Date();

        const event = await Event.create({
            eventName: 'New Year Eve Wedding - QR Test',
            eventType: 'wedding',
            eventDate: today,
            clientId: client._id,
            organizationId: ORG_ID,
            createdBy: user._id,
            leadPlannerId: user._id,
            status: 'booked',
            capacity: 200,
            notes: 'Test event for QR code check-in - Dec 31, 2025'
        });

        console.log('\n========================================');
        console.log('EVENT CREATED!');
        console.log('========================================');
        console.log('Event ID:', event._id);
        console.log('Event Name:', event.eventName);
        console.log('Date:', today.toDateString());

        // Create test guests
        const guestsData = [
            { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210', side: 'groom', expectedHeadcount: 4 },
            { firstName: 'Priya', lastName: 'Sharma', phone: '9876543211', side: 'bride', expectedHeadcount: 3 },
            { firstName: 'Amit', lastName: 'Verma', phone: '9876543212', side: 'groom', expectedHeadcount: 2 },
        ];

        console.log('\nCreating guests...');
        const createdGuests = [];
        for (const g of guestsData) {
            const guest = await Guest.create({
                ...g,
                eventId: event._id,
                organizationId: ORG_ID,
                createdBy: user._id,
                guestType: 'family',
                invitationType: 'family',
                rsvpStatus: 'attending'
            });
            createdGuests.push(guest);
            console.log('  Created:', guest.firstName, guest.lastName);
        }

        // Generate QR codes
        console.log('\nGenerating QR codes...');
        for (const guest of createdGuests) {
            await qrCodeService.generateQRForGuest(guest._id);
        }

        // Fetch updated guests with QR codes
        const updatedGuests = await Guest.find({ eventId: event._id });
        
        console.log('\n========================================');
        console.log('QR CODES FOR TESTING:');
        console.log('========================================');
        updatedGuests.forEach(g => {
            console.log(`${g.firstName} ${g.lastName}: ${g.qrCode}`);
        });

        console.log('\n========================================');
        console.log('MOBILE SCANNER URLS:');
        console.log('========================================');
        console.log('\nPC (localhost):');
        console.log(`  http://localhost:5173/events/${event._id}/check-in`);
        console.log('\nMobile (via ngrok - access on same WiFi):');
        console.log(`  http://192.168.0.106:5173/events/${event._id}/check-in`);
        console.log('\n========================================');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

createTestData();
