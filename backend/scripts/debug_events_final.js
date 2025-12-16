const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Organization = require('../models/Organization');
const Event = require('../models/Event');

const debugEvents = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const email = 'rajesh@weddingplanner.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User ${email} not found`);
      process.exit(0);
    }
    console.log(`User found: ${user.name} (${user._id})`);

    const org = await Organization.findOne({ ownerUserId: user._id });
    if (!org) {
        console.log("Organization not found for user");
        process.exit(0);
    }
    console.log(`Organization found: ${org.name} (${org._id})`);

    // Check Events by Organization ID
    const eventsByOrg = await Event.countDocuments({ organizationId: org._id });
    console.log(`Events count by Org ID (${org._id}): ${eventsByOrg}`);

    // Check Events by Planner ID
    const eventsByPlanner = await Event.find({ leadPlannerId: user._id });
    console.log(`Events count by Planner ID (${user._id}): ${eventsByPlanner.length}`);

    if (eventsByPlanner.length > 0) {
        console.log("--- Mismatch Check ---");
        eventsByPlanner.forEach(e => {
            const match = e.organizationId && e.organizationId.toString() === org._id.toString();
            console.log(`Event: ${e.eventName} | OrgID: ${e.organizationId} | Match: ${match}`);
        });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

debugEvents();
