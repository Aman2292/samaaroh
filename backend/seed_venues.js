const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Organization = require('./models/Organization');
const User = require('./models/User');

dotenv.config();

const seedVenues = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find a PLANNER_OWNER user
        const user = await User.findOne({ role: 'PLANNER_OWNER' });
        if (!user) {
            console.log('No PLANNER_OWNER found');
            process.exit(1);
        }

        const organization = await Organization.findOne({ ownerUserId: user._id });
        if (!organization) {
            console.log('No Organization found');
            process.exit(1);
        }

        // Clear existing venues
        organization.venues = [];

        // Venue 1: Full Details
        organization.venues.push({
            category: 'venue',
            description: 'A luxurious venue for grand weddings with state-of-the-art facilities.',
            address: {
                street: '123 Grand Avenue',
                city: 'New Delhi',
                state: 'Delhi',
                zip: '110001',
                googleMapsUrl: 'https://maps.google.com/?q=123+Grand+Avenue'
            },
            amenities: ['AC', 'Parking', 'Stage', 'Sound System', 'Projector', 'Wi-Fi', 'Changing Rooms', 'Power Backup'],
            policies: {
                cancellation: 'Full refund if cancelled 30 days prior.',
                refund: 'Processed within 7 days.',
                outsideCatering: true
            },
            galleryImages: [
                'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
            ],
            packages: [
                {
                    name: 'Gold Package',
                    basePrice: 150000,
                    maxGuests: 500,
                    inclusions: ['Venue Rental', 'Basic Decor', 'Catering'],
                    extraGuestPrice: 1200,
                    description: 'Perfect for medium sized weddings.'
                }
            ],
            availability: [
                { date: new Date(), status: 'available', notes: 'Open for booking' }
            ]
        });

        // Venue 2: Partial Details
        organization.venues.push({
            category: 'banquet',
            description: 'A cozy banquet hall for intimate gatherings.',
            address: {
                street: '456 Small Lane',
                city: 'Gurgaon',
                state: 'Haryana',
                zip: '122001'
            },
            amenities: ['AC', 'Parking'],
            policies: {
                outsideCatering: false
            }
        });

        await organization.save();
        console.log('Venues Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding venues:', error);
        process.exit(1);
    }
};

seedVenues();
