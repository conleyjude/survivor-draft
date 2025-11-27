/**
 * Constants.js
 * Application-wide constants and configurations
 */

// Application Metadata
export const APP_NAME = 'Survivor Fantasy Draft';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'A Fantasy Football style draft for the TV show Survivor';

// API Configuration
export const API_TIMEOUT = 30000; // ms
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // ms

// Data Limits
export const LIMITS = {
  SEASON_MIN: 1,
  SEASON_MAX: 100,
  YEAR_MIN: 2000,
  AGE_MIN: 18,
  AGE_MAX: 120,
  PLACEMENT_MAX: 20,
  ALLIANCE_MAX_MEMBERS: 10,
  STRING_MIN: 2,
  STRING_MAX: 100,
  TRIBE_NAME_MAX: 50,
  DESCRIPTION_MAX: 500,
  ROUND_MAX: 20,
  PICK_MAX: 100,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZES: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// Cache Configuration
export const CACHE = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutes
  QUERY_TTL: 10 * 60 * 1000, // 10 minutes
};

// Sorting Options
export const SORT_OPTIONS = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
};

// Status Types
export const ALLIANCE_STATUS = {
  ACTIVE: 'active',
  BROKEN: 'broken',
  DORMANT: 'dormant',
};

export const DRAFT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const PLAYER_STATUS = {
  ACTIVE: 'active',
  ELIMINATED: 'eliminated',
  WINNER: 'winner',
  RUNNER_UP: 'runner_up',
};

// Role Types
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
};

// Color Palette
export const COLORS = {
  PRIMARY: '#667eea',
  PRIMARY_DARK: '#764ba2',
  SECONDARY: '#f59e0b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6',
  LIGHT_GRAY: '#f9fafb',
  DARK_GRAY: '#333',
  BORDER_COLOR: '#e5e7eb',
  TEXT_LIGHT: '#999',
  TEXT_DEFAULT: '#666',
};

// Tribe Colors (Survivor themed)
export const TRIBE_COLORS = {
  BORAN: '#FF6B35',
  SAMBURU: '#004E89',
  MOTO: '#00A651',
  MARAAMU: '#E63946',
  ROTU: '#457B9D',
  JACARÉ: '#F4A261',
  LALARI: '#2A9D8F',
  MANIHIKI: '#E76F51',
  TAMBU: '#F1FAEE',
};

// Icon Mapping
export const ICONS = {
  HOME: '🏠',
  SEASON: '📺',
  TRIBE: '🏕️',
  PLAYER: '👤',
  ALLIANCE: '🤝',
  TEAM: '👥',
  DRAFT: '📋',
  LEADERBOARD: '🏆',
  SEARCH: '🔍',
  FILTER: '⚙️',
  EDIT: '✏️',
  DELETE: '🗑️',
  ADD: '➕',
  LOADING: '⏳',
  ERROR: '❌',
  SUCCESS: '✅',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  IDOL: '🔥',
  VOTE: '📝',
  CHALLENGE: '🏅',
  MEDAL_1ST: '🥇',
  MEDAL_2ND: '🥈',
  MEDAL_3RD: '🥉',
};

// Navigation Routes
export const ROUTES = {
  // Public Routes
  HOME: '/',
  SEASONS: '/seasons',
  SEASON_DETAIL: '/seasons/:seasonId',
  PLAYERS: '/players',
  PLAYER_DETAIL: '/players/:firstName/:lastName',
  TEAMS: '/teams',
  TEAM_DETAIL: '/teams/:teamName',
  LEADERBOARD: '/leaderboard',
  TRIBES: '/tribes',
  TRIBE_DETAIL: '/tribes/:tribeId',
  ALLIANCES: '/alliances',
  ALLIANCE_DETAIL: '/alliances/:allianceId',

  // Admin Routes
  ADMIN: '/admin',
  ADMIN_SEASONS: '/admin/seasons',
  ADMIN_TRIBES: '/admin/tribes',
  ADMIN_PLAYERS: '/admin/players',
  ADMIN_ALLIANCES: '/admin/alliances',
  ADMIN_DRAFT: '/admin/draft',
  ADMIN_TEAMS: '/admin/fantasy-teams',
  ADMIN_ANALYTICS: '/admin/analytics',
};

// Search Types
export const SEARCH_TYPES = {
  PLAYER: 'player',
  SEASON: 'season',
  TRIBE: 'tribe',
  ALLIANCE: 'alliance',
  TEAM: 'team',
  GENERAL: 'general',
};

// Filter Types
export const FILTER_TYPES = {
  CHECKBOX: 'checkbox',
  SELECT: 'select',
  RANGE: 'range',
  DATE: 'date',
};

// Export Formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  XLSX: 'xlsx',
};

// Leaderboard Sort Options
export const LEADERBOARD_SORTS = {
  WINS: 'wins',
  ROSTER_SIZE: 'roster_size',
  PREVIOUS_WINS: 'previous_wins',
  ALPHABETICAL: 'alphabetical',
};

// Draft Settings
export const DRAFT_SETTINGS = {
  DEFAULT_ROUNDS: 5,
  MIN_TEAMS: 2,
  MAX_TEAMS: 12,
  SERPENTINE: true,
  AUTO_PICK_DELAY: 30000, // 30 seconds
};

// Messages
export const MESSAGES = {
  LOADING: 'Loading data...',
  ERROR_GENERIC: 'An error occurred. Please try again.',
  ERROR_NETWORK: 'Network error. Please check your connection.',
  ERROR_NOT_FOUND: 'The requested item was not found.',
  SUCCESS_CREATED: 'Successfully created!',
  SUCCESS_UPDATED: 'Successfully updated!',
  SUCCESS_DELETED: 'Successfully deleted!',
  SUCCESS_EXPORTED: 'Data exported successfully!',
  CONFIRM_DELETE: 'Are you sure you want to delete this? This action cannot be undone.',
  INVALID_INPUT: 'Please check your input and try again.',
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'short',
  LONG: 'long',
  FULL: 'full',
  ISO: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
};

// Debounce Delays
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  SCROLL: 200,
  RESIZE: 250,
};

// Breakpoints for Responsive Design
export const BREAKPOINTS = {
  XS: 480,
  SM: 768,
  MD: 1024,
  LG: 1280,
  XL: 1536,
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 100,
  MODAL: 1000,
  TOOLTIP: 1001,
  NOTIFICATION: 1002,
  OVERLAY: 9999,
};

// Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Feature Flags
export const FEATURES = {
  ANALYTICS_ENABLED: true,
  EXPORT_ENABLED: true,
  IMPORT_ENABLED: true,
  BULK_OPERATIONS: true,
  ADVANCED_FILTERING: true,
  REAL_TIME_UPDATES: false,
};

export default {
  APP_NAME,
  APP_VERSION,
  API_TIMEOUT,
  LIMITS,
  PAGINATION,
  CACHE,
  ALLIANCE_STATUS,
  DRAFT_STATUS,
  COLORS,
  ICONS,
  ROUTES,
  SEARCH_TYPES,
  EXPORT_FORMATS,
  LEADERBOARD_SORTS,
  DRAFT_SETTINGS,
  MESSAGES,
  DATE_FORMATS,
  DEBOUNCE_DELAYS,
  BREAKPOINTS,
  Z_INDEX,
  ANIMATION_DURATIONS,
  FEATURES,
};
