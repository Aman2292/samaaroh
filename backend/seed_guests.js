const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Event = require('./models/Event');

dotenv.config();

const seedGuests = async () => {
    try {
        await connectDB();

        const eventId = '6922f7e3a4f9714148fa58fc';
        const event = await Event.findById(eventId);

        if (!event) {
            console.error('Event not found');
            process.exit(1);
        }

        const newGuests = [
            {
                name: "Aarav Sharma",
                phone: "9876543210",
                email: "aarav.sharma@example.com",
                side: "groom",
                group: "family",
                rsvpStatus: "confirmed",
                headcount: 2,
                source: "manual"
            },
            {
                name: "Vivaan Gupta",
                phone: "9876543211",
                email: "vivaan.gupta@example.com",
                side: "bride",
                group: "friends",
                rsvpStatus: "invited",
                headcount: 1,
                source: "manual"
            },
            {
                name: "Aditya Verma",
                phone: "9876543212",
                email: "aditya.verma@example.com",
                side: "groom",
                group: "friends",
                rsvpStatus: "tentative",
                headcount: 1,
                source: "manual"
            },
            {
                name: "Vihaan Singh",
                phone: "9876543213",
                email: "vihaan.singh@example.com",
                side: "bride",
                group: "family",
                rsvpStatus: "confirmed",
                headcount: 4,
                source: "manual"
            },
            {
                name: "Arjun Kumar",
                phone: "9876543214",
                email: "arjun.kumar@example.com",
                side: "groom",
                group: "vip",
                rsvpStatus: "invited",
                headcount: 2,
                source: "manual"
            },
            {
                name: "Sai Iyer",
                phone: "9876543215",
                email: "sai.iyer@example.com",
                side: "bride",
                group: "family",
                rsvpStatus: "confirmed",
                headcount: 3,
                source: "manual"
            },
            {
                name: "Reyansh Reddy",
                phone: "9876543216",
                email: "reyansh.reddy@example.com",
                side: "groom",
                group: "friends",
                rsvpStatus: "declined",
                headcount: 1,
                source: "manual"
            },
            {
                name: "Ayaan Khan",
                phone: "9876543217",
                email: "ayaan.khan@example.com",
                side: "bride",
                group: "friends",
                rsvpStatus: "confirmed",
                headcount: 2,
                source: "manual"
            },
            {
                name: "Krishna Das",
                phone: "9876543218",
                email: "krishna.das@example.com",
                side: "groom",
                group: "family",
                rsvpStatus: "invited",
                headcount: 2,
                source: "manual"
            },
            {
                name: "Ishaan Patel",
                phone: "9876543219",
                email: "ishaan.patel@example.com",
                side: "bride",
                group: "vip",
                rsvpStatus: "confirmed",
                headcount: 2,
                source: "manual"
            },
            {
                name: "Shaurya Nair",
                phone: "9876543220",
                email: "shaurya.nair@example.com",
                side: "groom",
                group: "friends",
                rsvpStatus: "tentative",
                headcount: 1,
                source: "manual"
            },
            {
                name: "Atharv Joshi",
                phone: "9876543221",
                email: "atharv.joshi@example.com",
                side: "bride",
                group: "family",
                rsvpStatus: "invited",
                headcount: 3,
                source: "manual"
            },
            {
                name: "Advik Malhotra",
                phone: "9876543222",
                email: "advik.malhotra@example.com",
                side: "groom",
                group: "friends",
                rsvpStatus: "confirmed",
                headcount: 2,
                source: "manual"
            },
            {
                name: "Pranav Saxena",
                phone: "9876543223",
                email: "pranav.saxena@example.com",
                side: "bride",
                group: "friends",
                rsvpStatus: "invited",
                headcount: 1,
                source: "manual"
            },
            {
                name: "Kian Mehra",
                phone: "9876543224",
                email: "kian.mehra@example.com",
                side: "groom",
                group: "family",
                rsvpStatus: "confirmed",
                headcount: 4,
                source: "manual"
            }
        ];

        event.guests.push(...newGuests);

        // Update summary
        const totalInvited = event.guests.length;
        const totalConfirmed = event.guests.filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'checked_in').length;
        const totalDeclined = event.guests.filter(g => g.rsvpStatus === 'declined').length;
        const expectedHeadcount = event.guests.reduce((sum, g) => {
             if (g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'checked_in') {
                 return sum + (g.headcount || 1);
             }
             return sum;
        }, 0);

        event.guestSummary = {
            totalInvited,
            totalConfirmed,
            totalDeclined,
            expectedHeadcount,
            onsiteAdded: event.guestSummary.onsiteAdded || 0,
            checkedIn: event.guestSummary.checkedIn || 0
        };

        await event.save();

        console.log(`Successfully added ${newGuests.length} guests to event ${event.eventName}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding guests:', error);
        process.exit(1);
    }
};

seedGuests();
