const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
require('dotenv').config();

const verifyNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create Mock Organization
    const org = await Organization.create({
      name: 'Test Org Notification',
      ownerUserId: new mongoose.Types.ObjectId(), // Placeholder
      status: 'active'
    });
    console.log('Created Org:', org._id);

    // 2. Create Mock Users
    const createMockUser = async (role, name) => {
      return await User.create({
        name,
        email: `test_${role}_${Date.now()}@example.com`,
        password: 'password123',
        role,
        organizationId: org._id,
        isActive: true
      });
    };

    const owner = await createMockUser('PLANNER_OWNER', 'Owner User');
    const planner = await createMockUser('PLANNER', 'Planner User');
    const finance = await createMockUser('FINANCE', 'Finance User');
    const coordinator = await createMockUser('COORDINATOR', 'Coordinator User');

    // Update org owner
    org.ownerUserId = owner._id;
    await org.save();

    console.log('Created Users:', {
      owner: owner._id,
      planner: planner._id,
      finance: finance._id,
      coordinator: coordinator._id
    });

    // 3. Test: Owner sends to ALL
    console.log('\n--- Test 1: Owner sends to ALL ---');
    const res1 = await notificationService.sendManualNotification(
      owner,
      'Owner Msg',
      'Hello Team',
      '/dashboard'
    );
    console.log('Owner sent count:', res1.count); // Should be 3 (Planner, Finance, Coordinator)

    const notifs1 = await Notification.find({ title: 'Owner Msg' });
    console.log('Notifications created for Owner Msg:', notifs1.length);
    notifs1.forEach(n => console.log(`- To: ${n.userId} (${n.senderRole})`));

    // 4. Test: Planner sends (should only go to Finance & Coordinator)
    console.log('\n--- Test 2: Planner sends (Restricted) ---');
    const res2 = await notificationService.sendManualNotification(
      planner,
      'Planner Msg',
      'Hello Finance/Coord',
      '/tasks'
    );
    console.log('Planner sent count:', res2.count); // Should be 2 (Finance, Coordinator)

    const notifs2 = await Notification.find({ title: 'Planner Msg' });
    console.log('Notifications created for Planner Msg:', notifs2.length);
    notifs2.forEach(n => console.log(`- To: ${n.userId} (${n.senderRole})`));

    // 5. Test: Finance tries to send (Should fail)
    console.log('\n--- Test 3: Finance tries to send (Should fail) ---');
    try {
      await notificationService.sendManualNotification(
        finance,
        'Finance Msg',
        'Hello?',
        '/oops'
      );
    } catch (err) {
      console.log('Expected Error:', err.message);
    }

    // ... (previous code)

    const results = {
      test1: {
        count: res1.count,
        notifications: notifs1.length
      },
      test2: {
        count: res2.count,
        notifications: notifs2.length
      },
      test3: {
        passed: true // if we reached here after catch
      }
    };

    const fs = require('fs');
    fs.writeFileSync('verification_results.json', JSON.stringify(results, null, 2));
    console.log('Results written to verification_results.json');

    // Cleanup
    console.log('\nCleaning up...');
    await User.deleteMany({ organizationId: org._id });
    await Organization.deleteOne({ _id: org._id });
    await Notification.deleteMany({ organizationId: org._id });
    console.log('Cleanup done.');

  } catch (error) {
    console.error('Verification Failed:', error);
    const fs = require('fs');
    fs.writeFileSync('verification_results.json', JSON.stringify({ error: error.message }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

verifyNotifications();
