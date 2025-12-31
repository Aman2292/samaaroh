const mongoose = require('mongoose');
require('dotenv').config({path: 'd:/AMAN/Samaaroh/backend/.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const Event = require('d:/AMAN/Samaaroh/backend/models/Event');
        // Simple regex find without $ syntax to avoid shell issues if passed inline, 
        // but here we are in a file so standard mongoose syntax works fine.
        const event = await Event.findOne({ eventName: /QR Test/i });
        
        if (event) {
            console.log(`FOUND_EVENT_ID: ${event._id}`);
        } else {
            console.log('EVENT_NOT_FOUND');
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
});
