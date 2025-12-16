
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wedding-planner');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

const migrateFeature = (feature, defaults) => {
    if (typeof feature === 'boolean') {
        return { ...defaults, access: feature };
    }
    if (!feature) return defaults;
    return feature;
};

const runMigration = async () => {
    await connectDB();
    
    try {
        // Use the native driver collection to bypass Mongoose schema casting on find
        const collection = mongoose.connection.collection('organizations');
        const organizations = await collection.find({}).toArray();

        console.log(`Found ${organizations.length} organizations to check.`);

        for (const org of organizations) {
            let updated = false;
            const features = org.subscribedFeatures || {};
            
            // Payments
            if (typeof features.payments !== 'object' || features.payments === null) {
                console.log(`Migrating payments for org ${org.name}`);
                const isTrue = features.payments === true || features.payments === undefined; 
                features.payments = { 
                    access: isTrue, 
                    client: true, 
                    vendor: true 
                };
                updated = true;
            }

            // Venue
            if (typeof features.venue !== 'object' || features.venue === null) {
                console.log(`Migrating venue for org ${org.name}`);
                const isTrue = features.venue === true || features.venue === undefined;
                features.venue = { 
                    access: isTrue, 
                    profile: true, 
                    gallery: true, 
                    packages: true, 
                    availability: true, 
                    tasks: true 
                };
                updated = true;
            }

            // Team
            if (typeof features.team !== 'object' || features.team === null) {
                console.log(`Migrating team for org ${org.name}`);
                const isTrue = features.team === true || features.team === undefined;
                features.team = { 
                    access: isTrue, 
                    manage: true, 
                    export: true 
                };
                updated = true;
            }
            
            // Events - mostly likely already object but strict check
            if (typeof features.events !== 'object' || features.events === null) {
                console.log(`Migrating events for org ${org.name}`);
                const isTrue = features.events === true || features.events === undefined;
                 features.events = { 
                    access: isTrue, 
                    guests: true, 
                    payments: true, 
                    tasks: true 
                };
                updated = true;
            }

            if (updated) {
                await collection.updateOne(
                    { _id: org._id },
                    { $set: { subscribedFeatures: features } }
                );
                console.log(`Updated organization: ${org.name}`);
            }
        }
        
        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
