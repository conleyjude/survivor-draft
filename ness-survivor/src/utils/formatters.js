/**
 * Formatters.js
 * Utility functions for formatting data for display
 */

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @param {string} [format="short"] - "short", "long", "full"
 * @returns {string}
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';

  const d = new Date(date);
  if (isNaN(d)) return 'Invalid Date';

  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
  };

  return d.toLocaleDateString('en-US', options[format] || options.short);
};

/**
 * Format number as integer
 * @param {number} num - Number to format
 * @param {number} [decimals=0] - Decimal places
 * @returns {string}
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return 'N/A';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

/**
 * Format player name (title case)
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export const formatPlayerName = (firstName, lastName) => {
  const format = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  return `${format(firstName)} ${format(lastName)}`;
};

/**
 * Format tribe name with color indicator
 * @param {string} tribeName
 * @param {string} [color] - Hex color code
 * @returns {string}
 */
export const formatTribeName = (tribeName, color) => {
  return tribeName ? tribeName.toUpperCase() : 'TRIBE';
};

/**
 * Format challenge wins with prefix
 * @param {number} wins - Number of wins
 * @returns {string}
 */
export const formatChallengeWins = (wins) => {
  return `${formatNumber(wins)} win${wins !== 1 ? 's' : ''}`;
};

/**
 * Format votes received
 * @param {number} votes
 * @returns {string}
 */
export const formatVotesReceived = (votes) => {
  return `${formatNumber(votes)} vote${votes !== 1 ? 's' : ''}`;
};

/**
 * Format idol status
 * @param {boolean} hasIdol
 * @param {number} idolsPlayed
 * @returns {string}
 */
export const formatIdolStatus = (hasIdol, idolsPlayed) => {
  if (hasIdol) return '🔥 Has Idol';
  if (idolsPlayed > 0) return `⚫ Played ${idolsPlayed}`;
  return '⭕ No Idol';
};

/**
 * Format currency (USD)
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format percentage
 * @param {number} value - Value between 0-1 or 0-100
 * @param {boolean} [outOf100=false] - If value is already out of 100
 * @returns {string}
 */
export const formatPercentage = (value, outOf100 = false) => {
  if (!value) return '0%';
  const percentage = outOf100 ? value : value * 100;
  return `${Math.round(percentage)}%`;
};

/**
 * Format team statistics summary
 * @param {Object} team - Team object
 * @returns {string}
 */
export const formatTeamStats = (team) => {
  if (!team) return 'No Data';
  const wins = team.totalChallengeWins || 0;
  const players = team.roster?.length || 0;
  return `${players} players, ${wins} wins`;
};

/**
 * Format alliance size with count
 * @param {number} size
 * @returns {string}
 */
export const formatAllianceSize = (size) => {
  return `${formatNumber(size)} member${size !== 1 ? 's' : ''}`;
};

/**
 * Format episode range
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export const formatEpisodeRange = (start, end) => {
  if (start && end) return `Ep. ${start} - ${end}`;
  if (start) return `Started Ep. ${start}`;
  return 'Unknown';
};

/**
 * Format status badge text
 * @param {string} status
 * @returns {string}
 */
export const formatStatusBadge = (status) => {
  const statusMap = {
    active: '🟢 Active',
    dissolved: '🔴 Dissolved',
    dormant: '🟡 Dormant',
    pending: '⏳ Pending',
    completed: '✅ Completed',
    failed: '❌ Failed',
  };
  return statusMap[status] || status;
};

/**
 * Format placement/position
 * @param {number} placement
 * @returns {string}
 */
export const formatPlacement = (placement) => {
  if (!placement) return 'N/A';
  const suffixes = ['st', 'nd', 'rd'];
  const lastDigit = placement % 10;
  const lastTwoDigits = placement % 100;
  let suffix = 'th';

  if (lastTwoDigits > 10 && lastTwoDigits < 14) {
    suffix = 'th';
  } else if (lastDigit < 3) {
    suffix = suffixes[lastDigit - 1] || 'th';
  }

  return `${placement}${suffix}`;
};

/**
 * Format season number with year
 * @param {number} seasonNum
 * @param {number} year
 * @returns {string}
 */
export const formatSeasonLabel = (seasonNum, year) => {
  return `Season ${seasonNum}${year ? ` (${year})` : ''}`;
};

/**
 * Format large numbers with abbreviation
 * @param {number} num
 * @returns {string}
 */
export const formatCompactNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
};

/**
 * Truncate string with ellipsis
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export const truncateString = (str, length = 50) => {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length).trim()}...`;
};

/**
 * Format URL-friendly slug
 * @param {string} str
 * @returns {string}
 */
export const formatSlug = (str) => {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
};

/**
 * Format time elapsed
 * @param {Date} date
 * @returns {string}
 */
export const formatTimeElapsed = (date) => {
  if (!date) return 'N/A';

  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(date, 'short');
};

export default {
  formatDate,
  formatNumber,
  formatPlayerName,
  formatTribeName,
  formatChallengeWins,
  formatVotesReceived,
  formatIdolStatus,
  formatCurrency,
  formatPercentage,
  formatTeamStats,
  formatAllianceSize,
  formatEpisodeRange,
  formatStatusBadge,
  formatPlacement,
  formatSeasonLabel,
  formatCompactNumber,
  truncateString,
  formatSlug,
  formatTimeElapsed,
};
