const QRCode = require('qrcode');
const Guest = require('../models/Guest');
const crypto = require('crypto');

class QRCodeService {
  
  /**
   * Generate QR code image as data URL (base64)
   */
  async generateQRImage(text, options = {}) {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(text, { ...defaultOptions, ...options });
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error('QR code generation failed');
    }
  }
  
  /**
   * Generate unique QR code string
   */
  generateQRCodeString(eventId) {
    const eventIdShort = eventId.toString().slice(-6).toUpperCase();
    const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `SAMAROH-${eventIdShort}-${randomPart}`;
  }
  
  /**
   * Generate QR code for a guest (family mode - single QR)
   */
  async generateGuestQR(guestId) {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    // Generate QR code string if not exists
    if (!guest.qrCode) {
      guest.qrCode = this.generateQRCodeString(guest.eventId);
    }
    
    // Generate QR code image
    guest.qrCodeImage = await this.generateQRImage(guest.qrCode);
    
    await guest.save();
    return guest;
  }
  
  /**
   * Generate QR codes for family members (individual mode)
   */
  async generateFamilyMemberQRs(guestId) {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    // Generate QR for each family member
    for (let member of guest.familyMembers) {
      if (!member.qrCode) {
        member.qrCode = this.generateQRCodeString(guest.eventId);
      }
      member.qrCodeImage = await this.generateQRImage(member.qrCode);
    }
    
    await guest.save();
    return guest;
  }
  
  /**
   * Generate QR based on invitation type
   */
  async generateQRForGuest(guestId) {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    if (guest.invitationType === 'individual' && guest.familyMembers.length > 0) {
      return await this.generateFamilyMemberQRs(guestId);
    } else {
      return await this.generateGuestQR(guestId);
    }
  }
  
  /**
   * Bulk generate QR codes for all guests in an event
   */
  async generateQRsForEvent(eventId) {
    const guests = await Guest.find({ eventId, isDeleted: false });
    const results = { success: 0, failed: 0, errors: [] };
    
    for (let guest of guests) {
      try {
        await this.generateQRForGuest(guest._id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ guestId: guest._id, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Validate and find guest by QR code
   */
  async findByQRCode(qrCode) {
    // First check main guest QR
    let guest = await Guest.findOne({ qrCode, isDeleted: false });
    
    if (guest) {
      return { 
        guest, 
        type: 'family', 
        memberIndex: null 
      };
    }
    
    // Check family member QRs
    guest = await Guest.findOne({ 
      'familyMembers.qrCode': qrCode, 
      isDeleted: false 
    });
    
    if (guest) {
      const memberIndex = guest.familyMembers.findIndex(m => m.qrCode === qrCode);
      return { 
        guest, 
        type: 'individual', 
        memberIndex,
        member: guest.familyMembers[memberIndex]
      };
    }
    
    return null;
  }
  
  /**
   * Check in a guest (family mode)
   */
  async checkInFamily(guestId, actualHeadcount, checkInBy, notes = '') {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    if (guest.checkedIn) {
      throw new Error('Guest already checked in');
    }
    
    guest.checkedIn = true;
    guest.checkInTime = new Date();
    guest.checkInBy = checkInBy;
    guest.actualHeadcount = actualHeadcount;
    guest.checkInNotes = notes;
    
    await guest.save();
    return guest;
  }
  
  /**
   * Check in individual family member
   */
  async checkInMember(guestId, memberIndex, checkInBy) {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    if (!guest.familyMembers[memberIndex]) {
      throw new Error('Family member not found');
    }
    
    if (guest.familyMembers[memberIndex].checkedIn) {
      throw new Error('Member already checked in');
    }
    
    guest.familyMembers[memberIndex].checkedIn = true;
    guest.familyMembers[memberIndex].checkInTime = new Date();
    
    // Update main guest status if all members checked in
    const allCheckedIn = guest.familyMembers.every(m => m.checkedIn);
    if (allCheckedIn) {
      guest.checkedIn = true;
      guest.checkInTime = new Date();
      guest.checkInBy = checkInBy;
    }
    
    await guest.save();
    return guest;
  }
  
  /**
   * Get check-in statistics for an event
   */
  async getEventCheckInStats(eventId) {
    const guests = await Guest.find({ eventId, isDeleted: false });
    
    const stats = {
      totalInvitations: guests.length,
      totalExpectedHeadcount: 0,
      checkedInCount: 0,
      actualHeadcount: 0,
      pendingCount: 0,
      percentage: 0,
      bySide: {
        bride: { invited: 0, checkedIn: 0 },
        groom: { invited: 0, checkedIn: 0 },
        both: { invited: 0, checkedIn: 0 },
        neutral: { invited: 0, checkedIn: 0 }
      },
      recentCheckIns: []
    };
    
    for (const guest of guests) {
      // Count expected
      if (guest.invitationType === 'individual') {
        stats.totalExpectedHeadcount += guest.familyMembers.length;
      } else {
        stats.totalExpectedHeadcount += guest.expectedHeadcount;
      }
      
      // Count checked in
      if (guest.checkedIn) {
        stats.checkedInCount++;
        stats.actualHeadcount += guest.actualHeadcount || 1;
        stats.bySide[guest.side].checkedIn++;
      } else {
        stats.pendingCount++;
      }
      
      stats.bySide[guest.side].invited++;
    }
    
    stats.percentage = stats.totalInvitations > 0 
      ? Math.round((stats.checkedInCount / stats.totalInvitations) * 100) 
      : 0;
    
    // Get recent check-ins
    stats.recentCheckIns = await Guest.find({ 
      eventId, 
      checkedIn: true 
    })
    .sort({ checkInTime: -1 })
    .limit(10)
    .select('firstName lastName checkInTime actualHeadcount');
    
    return stats;
  }
  
  /**
   * Undo check-in if made by mistake
   */
  async undoCheckIn(guestId) {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }
    
    guest.checkedIn = false;
    guest.checkInTime = null;
    guest.checkInBy = null;
    guest.actualHeadcount = 0;
    guest.checkInNotes = '';
    
    // Reset family members if any
    guest.familyMembers.forEach(member => {
      member.checkedIn = false;
      member.checkInTime = null;
    });
    
    await guest.save();
    return guest;
  }
}

module.exports = new QRCodeService();
