/**
 * Convert a date to relative time string
 * @param {Date|string} date - The date to convert
 * @returns {string} Relative time string (e.g., "2 hours ago", "in 3 days")
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate - now;
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${prefix}${diffMin} minute${diffMin > 1 ? 's' : ''}${suffix}`;
  if (diffHour < 24) return `${prefix}${diffHour} hour${diffHour > 1 ? 's' : ''}${suffix}`;
  if (diffDay < 7) return `${prefix}${diffDay} day${diffDay > 1 ? 's' : ''}${suffix}`;
  if (diffWeek < 4) return `${prefix}${diffWeek} week${diffWeek > 1 ? 's' : ''}${suffix}`;
  if (diffMonth < 12) return `${prefix}${diffMonth} month${diffMonth > 1 ? 's' : ''}${suffix}`;
  return `${prefix}${diffYear} year${diffYear > 1 ? 's' : ''}${suffix}`;
};

/**
 * Format date to readable string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format date with time
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if date is today
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const targetDate = new Date(date);
  return today.toDateString() === targetDate.toDateString();
};

/**
 * Get days until date
 * @param {Date|string} date - The target date
 * @returns {number} Number of days until date (negative if past)
 */
export const getDaysUntil = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = targetDate - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
