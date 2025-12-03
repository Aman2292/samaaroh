const Event = require('../models/Event');

/**
 * Add guest to event
 */
const addGuest = async (eventId, guestData, organizationId, userId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  // Create guest object
  const newGuest = {
    ...guestData,
    addedBy: userId,
    addedAt: new Date()
  };

  // Add guest to array
  event.guests.push(newGuest);
  
  // Update summary
  updateGuestSummary(event);
  
  await event.save();
  
  return event.guests[event.guests.length - 1]; // Return newly added guest
};

/**
 * Get all guests for an event with filters
 */
const getEventGuests = async (eventId, organizationId, filters = {}) => {
  const { side, group, rsvpStatus, search, page = 1, limit = 50 } = filters;
  
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  let guests = event.guests || [];

  // Apply filters
  if (side) {
    guests = guests.filter(g => g.side === side);
  }
  if (group) {
    guests = guests.filter(g => g.group === group);
  }
  if (rsvpStatus) {
    guests = guests.filter(g => g.rsvpStatus === rsvpStatus);
  }
  if (filters.source) {
    guests = guests.filter(g => g.source === filters.source);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    guests = guests.filter(g => 
      g.name?.toLowerCase().includes(searchLower) ||
      g.phone?.includes(search) ||
      g.email?.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedGuests = guests.slice(startIndex, endIndex);

  return {
    guests: paginatedGuests,
    pagination: {
      total: guests.length,
      page: parseInt(page),
      pages: Math.ceil(guests.length / limit),
      limit: parseInt(limit)
    }
  };
};

/**
 * Get guest statistics
 */
const getGuestStats = async (eventId, organizationId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const guests = event.guests || [];

  // Calculate stats
  const stats = {
    totalInvited: guests.length,
    totalConfirmed: guests.filter(g => g.rsvpStatus === 'confirmed').length,
    totalDeclined: guests.filter(g => g.rsvpStatus === 'declined').length,
    totalTentative: guests.filter(g => g.rsvpStatus === 'tentative').length,
    expectedHeadcount: guests
      .filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'checked_in')
      .reduce((sum, g) => sum + (g.headcount || 1), 0),
    onsiteAdded: guests.filter(g => g.addedOnsite).length,
    checkedIn: guests.filter(g => g.rsvpStatus === 'checked_in').length,
    
    // By group
    byGroup: {
      family: guests.filter(g => g.group === 'family').length,
      friends: guests.filter(g => g.group === 'friends').length,
      vip: guests.filter(g => g.group === 'vip').length,
      vendor: guests.filter(g => g.group === 'vendor').length,
      other: guests.filter(g => g.group === 'other').length
    },
    
    // By side
    bySide: {
      bride: guests.filter(g => g.side === 'bride').length,
      groom: guests.filter(g => g.side === 'groom').length,
      both: guests.filter(g => g.side === 'both').length,
      vendor: guests.filter(g => g.side === 'vendor').length
    }
  };

  return stats;
};

/**
 * Update guest
 */
const updateGuest = async (eventId, guestId, updateData, organizationId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const guestIndex = event.guests.findIndex(g => g._id.toString() === guestId);
  
  if (guestIndex === -1) {
    throw new Error('Guest not found');
  }

  // Update guest fields
  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'addedBy' && key !== 'addedAt') {
      event.guests[guestIndex][key] = updateData[key];
    }
  });

  // Update summary
  updateGuestSummary(event);
  
  await event.save();
  
  return event.guests[guestIndex];
};

/**
 * Delete guest
 */
const deleteGuest = async (eventId, guestId, organizationId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const guestIndex = event.guests.findIndex(g => g._id.toString() === guestId);
  
  if (guestIndex === -1) {
    throw new Error('Guest not found');
  }

  event.guests.splice(guestIndex, 1);
  
  // Update summary
  updateGuestSummary(event);
  
  await event.save();
  
  return { message: 'Guest deleted successfully' };
};

/**
 * Quick add guest (on-site)
 */
const quickAddGuest = async (eventId, guestData, organizationId, userId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const newGuest = {
    ...guestData,
    source: 'onsite',
    addedOnsite: true,
    addedBy: userId,
    addedAt: new Date()
  };

  event.guests.push(newGuest);
  
  updateGuestSummary(event);
  
  await event.save();
  
  return event.guests[event.guests.length - 1];
};

/**
 * Check in guest
 */
const checkInGuest = async (eventId, guestId, organizationId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const guestIndex = event.guests.findIndex(g => g._id.toString() === guestId);
  
  if (guestIndex === -1) {
    throw new Error('Guest not found');
  }

  event.guests[guestIndex].rsvpStatus = 'checked_in';
  event.guests[guestIndex].checkedInAt = new Date();
  
  updateGuestSummary(event);
  
  await event.save();
  
  return event.guests[guestIndex];
};

/**
 * Helper: Update guest summary
 */
const updateGuestSummary = (event) => {
  const guests = event.guests || [];
  
  event.guestSummary = {
    totalInvited: guests.length,
    totalConfirmed: guests.filter(g => g.rsvpStatus === 'confirmed').length,
    totalDeclined: guests.filter(g => g.rsvpStatus === 'declined').length,
    expectedHeadcount: guests
      .filter(g => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'checked_in')
      .reduce((sum, g) => sum + (g.headcount || 1), 0),
    onsiteAdded: guests.filter(g => g.addedOnsite).length,
    checkedIn: guests.filter(g => g.rsvpStatus === 'checked_in').length
  };
};

/**
 * Bulk import guests from parsed CSV data
 */
const bulkImportGuests = async (eventId, guestsData, organizationId, userId) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const results = {
    total: guestsData.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < guestsData.length; i++) {
    const guestData = guestsData[i];
    
    try {
      // Validate required fields
      if (!guestData.name || !guestData.side || !guestData.group) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: guestData,
          error: 'Missing required fields: name, side, or group'
        });
        continue;
      }

      // Check for duplicates (same name and phone)
      const isDuplicate = event.guests.some(g => 
        g.name.toLowerCase() === guestData.name.toLowerCase() &&
        g.phone && guestData.phone && g.phone === guestData.phone
      );

      if (isDuplicate) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: guestData,
          error: 'Duplicate guest: same name and phone already exists'
        });
        continue;
      }

      // Create guest object
      const newGuest = {
        name: guestData.name,
        phone: guestData.phone || '',
        email: guestData.email || '',
        side: guestData.side,
        group: guestData.group,
        rsvpStatus: guestData.rsvpStatus || 'invited',
        headcount: parseInt(guestData.headcount) || 1,
        plusOnes: parseInt(guestData.plusOnes) || 0,
        specialNotes: guestData.specialNotes || '',
        dietaryRestrictions: guestData.dietaryRestrictions || '',
        source: 'csv_import',
        addedBy: userId,
        addedAt: new Date()
      };

      event.guests.push(newGuest);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        data: guestData,
        error: error.message
      });
    }
  }

  // Update summary
  updateGuestSummary(event);
  
  await event.save();

  return results;
};

/**
 * Export guests to CSV format
 */
const exportGuests = async (eventId, organizationId, filters = {}) => {
  const event = await Event.findOne({ _id: eventId, organizationId });
  
  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  let guests = event.guests || [];

  // Apply filters if provided
  const { side, group, rsvpStatus } = filters;
  if (side) guests = guests.filter(g => g.side === side);
  if (group) guests = guests.filter(g => g.group === group);
  if (rsvpStatus) guests = guests.filter(g => g.rsvpStatus === rsvpStatus);

  // Convert to CSV format
  const csvData = guests.map(g => ({
    Name: g.name,
    Phone: g.phone || '',
    Email: g.email || '',
    Side: g.side,
    Group: g.group,
    RSVP_Status: g.rsvpStatus,
    Headcount: g.headcount,
    Plus_Ones: g.plusOnes,
    Special_Notes: g.specialNotes || '',
    Dietary_Restrictions: g.dietaryRestrictions || '',
    Source: g.source,
    Added_Onsite: g.addedOnsite ? 'Yes' : 'No',
    Checked_In: g.rsvpStatus === 'checked_in' ? 'Yes' : 'No',
    Added_At: g.addedAt ? new Date(g.addedAt).toLocaleDateString() : ''
  }));

  return csvData;
};

/**
 * Get CSV template structure
 */
const getCSVTemplate = () => {
  return [
    {
      Name: 'John Doe',
      Phone: '9876543210',
      Email: 'john@example.com',
      Side: 'bride',
      Group: 'family',
      RSVP_Status: 'invited',
      Headcount: '2',
      Plus_Ones: '1',
      Special_Notes: 'Vegetarian',
      Dietary_Restrictions: 'No peanuts'
    }
  ];
};

module.exports = {
  addGuest,
  getEventGuests,
  getGuestStats,
  updateGuest,
  deleteGuest,
  quickAddGuest,
  checkInGuest,
  bulkImportGuests,
  exportGuests,
  getCSVTemplate
};
