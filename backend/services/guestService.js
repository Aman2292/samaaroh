const Guest = require('../models/Guest');
const GuestGroup = require('../models/GuestGroup');
const Event = require('../models/Event');
const xlsx = require('xlsx');

/**
 * Create a single guest
 */
const createGuest = async (guestData, userId, organizationId) => {
  // Verify event exists and belongs to organization
  const event = await Event.findOne({
    _id: guestData.eventId,
    organizationId,
    isActive: true
  });

  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  const guest = await Guest.create({
    ...guestData,
    organizationId,
    createdBy: userId
  });

  return guest;
};

/**
 * Get all guests for an event
 */
const getEventGuests = async (eventId, organizationId, filters = {}) => {
  const query = {
    eventId,
    organizationId,
    isDeleted: false
  };

  // Apply filters
  if (filters.rsvpStatus) {
    query.rsvpStatus = filters.rsvpStatus;
  }
  if (filters.side) {
    query.side = filters.side;
  }
  if (filters.guestType) {
    query.guestType = filters.guestType;
  }
  if (filters.search) {
    query.$or = [
      { firstName: { $regex: filters.search, $options: 'i' } },
      { lastName: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { phone: { $regex: filters.search, $options: 'i' } }
    ];
  }

  const guests = await Guest.find(query)
    .populate('groupId', 'groupName')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  return guests;
};

/**
 * Get single guest by ID
 */
const getGuestById = async (guestId, organizationId) => {
  const guest = await Guest.findOne({
    _id: guestId,
    organizationId,
    isDeleted: false
  })
    .populate('groupId', 'groupName groupType')
    .populate('eventId', 'eventName eventDate')
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (!guest) {
    throw new Error('Guest not found or does not belong to your organization');
  }

  return guest;
};

/**
 * Get guest by RSVP token (for public RSVP page)
 */
const getGuestByToken = async (rsvpToken) => {
  const guest = await Guest.findOne({
    rsvpToken,
    isDeleted: false
  })
    .populate('eventId', 'eventName eventDate venue clientId')
    .populate({
      path: 'eventId',
      populate: { path: 'clientId', select: 'name' }
    });

  if (!guest) {
    throw new Error('Invalid RSVP link');
  }

  return guest;
};

/**
 * Update guest
 */
const updateGuest = async (guestId, updateData, organizationId, userId) => {
  const guest = await Guest.findOne({
    _id: guestId,
    organizationId,
    isDeleted: false
  });

  if (!guest) {
    throw new Error('Guest not found or does not belong to your organization');
  }

  // Update allowed fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) {
      guest[key] = updateData[key];
    }
  });

  guest.updatedBy = userId;
  await guest.save();

  return guest;
};

/**
 * Submit RSVP (public - no auth required)
 */
const submitRSVP = async (rsvpToken, rsvpData) => {
  const guest = await Guest.findOne({ rsvpToken, isDeleted: false });

  if (!guest) {
    throw new Error('Invalid RSVP link');
  }

  // Update RSVP fields
  guest.rsvpStatus = rsvpData.rsvpStatus;
  guest.plusOneAttending = rsvpData.plusOneAttending;
  guest.plusOneName = rsvpData.plusOneName;
  guest.dietaryRestrictions = rsvpData.dietaryRestrictions || [];
  guest.dietaryNotes = rsvpData.dietaryNotes;
  guest.specialRequests = rsvpData.specialRequests;

  await guest.save(); // rsvpDate will be auto-set by pre-save hook

  return guest;
};

/**
 * Delete guest (soft delete)
 */
const deleteGuest = async (guestId, organizationId) => {
  const guest = await Guest.findOne({
    _id: guestId,
    organizationId,
    isDeleted: false
  });

  if (!guest) {
    throw new Error('Guest not found or does not belong to your organization');
  }

  guest.isDeleted = true;
  await guest.save();

  return guest;
};

/**
 * Bulk delete guests
 */
const bulkDeleteGuests = async (guestIds, organizationId) => {
  const result = await Guest.updateMany(
    {
      _id: { $in: guestIds },
      organizationId,
      isDeleted: false
    },
    {
      $set: { isDeleted: true }
    }
  );

  return result;
};

/**
 * Bulk import guests from Excel
 */
const bulkImportGuests = async (fileBuffer, eventId, organizationId, userId) => {
  // Verify event exists
  const event = await Event.findOne({
    _id: eventId,
    organizationId,
    isActive: true
  });

  if (!event) {
    throw new Error('Event not found or does not belong to your organization');
  }

  // Parse Excel file
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  if (data.length === 0) {
    throw new Error('Excel file is empty');
  }

  // Map Excel columns to guest fields
  const guests = data.map(row => {
    const guest = {
      eventId,
      organizationId,
      createdBy: userId,
      firstName: row['First Name'] || row.firstName || '',
      lastName: row['Last Name'] || row.lastName || '',
      email: row.Email || row.email || '',
      phone: row.Phone || row.phone || '',
      guestType: row['Guest Type'] || row.guestType || 'friend',
      side: row.Side || row.side || 'neutral',
      plusOne: row['Plus One'] === 'Yes' || row.plusOne === true || false,
      notes: row.Notes || row.notes || ''
    };

    // Handle dietary restrictions (comma-separated in Excel)
    if (row['Dietary Restrictions'] || row.dietaryRestrictions) {
      const dietary = row['Dietary Restrictions'] || row.dietaryRestrictions;
      if (typeof dietary === 'string') {
        guest.dietaryRestrictions = dietary.split(',').map(s => s.trim().toLowerCase());
      }
    }

    return guest;
  }).filter(g => g.firstName); // Remove rows without first name

  // Bulk insert
  const inserted = await Guest.insertMany(guests);

  return {
    total: guests.length,
    imported: inserted.length,
    guests: inserted
  };
};

/**
 * Get RSVP statistics for an event
 */
const getRSVPStats = async (eventId, organizationId) => {
  const guests = await Guest.find({
    eventId,
    organizationId,
    isDeleted: false
  });

  const stats = {
    total: guests.length,
    attending: 0,
    notAttending: 0,
    maybe: 0,
    pending: 0,
    withPlusOne: 0,
    expectedHeadcount: 0,
    invitationsSent: 0,
    rsvpRate: 0
  };

  guests.forEach(guest => {
    // Count by RSVP status
    if (guest.rsvpStatus === 'attending') stats.attending++;
    else if (guest.rsvpStatus === 'not_attending') stats.notAttending++;
    else if (guest.rsvpStatus === 'maybe') stats.maybe++;
    else stats.pending++;

    // Plus ones
    if (guest.plusOne) stats.withPlusOne++;

    // Expected headcount
    if (guest.rsvpStatus === 'attending') {
      stats.expectedHeadcount += 1;
      if (guest.plusOne && guest.plusOneAttending !== false) {
        stats.expectedHeadcount += 1;
      }
    }

    // Invitations sent
    if (guest.invitationSent) stats.invitationsSent++;
  });

  // RSVP rate (% of guests who have responded)
  const responded = stats.attending + stats.notAttending + stats.maybe;
  stats.rsvpRate = stats.total > 0 
    ? Math.round((responded / stats.total) * 100) 
    : 0;

  return stats;
};

/**
 * Export guests to Excel
 */
const exportGuestsToExcel = async (eventId, organizationId) => {
  const guests = await Guest.find({
    eventId,
    organizationId,
    isDeleted: false
  }).sort({ lastName: 1, firstName: 1 });

  // Prepare data for Excel
  const data = guests.map(guest => ({
    'First Name': guest.firstName,
    'Last Name': guest.lastName || '',
    'Email': guest.email || '',
    'Phone': guest.phone || '',
    'Guest Type': guest.guestType,
    'Side': guest.side,
    'RSVP Status': guest.rsvpStatus,
    'Plus One': guest.plusOne ? 'Yes' : 'No',
    'Plus One Name': guest.plusOneName || '',
    'Dietary Restrictions': guest.dietaryRestrictions.join(', '),
    'Special Requests': guest.specialRequests || '',
    'Table Number': guest.tableNumber || '',
    'RSVP Date': guest.rsvpDate ? guest.rsvpDate.toLocaleDateString() : '',
    'Notes': guest.notes || ''
  }));

  // Create workbook
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Guests');

  // Generate buffer
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
};

/**
 * Send invitations (mark as sent, generate links)
 */
const markInvitationsSent = async (guestIds, organizationId, userId) => {
  const result = await Guest.updateMany(
    {
      _id: { $in: guestIds },
      organizationId,
      isDeleted: false
    },
    {
      $set: {
        invitationSent: true,
        invitationSentDate: new Date(),
        updatedBy: userId
      }
    }
  );

  // Return guests with their RSVP links
  const guests = await Guest.find({
    _id: { $in: guestIds },
    organizationId
  }).select('firstName lastName email phone rsvpToken');

  return guests.map(guest => ({
    ...guest.toObject(),
    rsvpLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/rsvp/${guest.rsvpToken}`
  }));
};

module.exports = {
  createGuest,
  getEventGuests,
  getGuestById,
  getGuestByToken,
  updateGuest,
  submitRSVP,
  deleteGuest,
  bulkDeleteGuests,
  bulkImportGuests,
  getRSVPStats,
  exportGuestsToExcel,
  markInvitationsSent
};
