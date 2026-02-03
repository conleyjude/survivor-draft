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

// Event Types for Progress Tracking
export const EVENT_TYPES = {
  CHALLENGE_WIN: {
    id: 'challenge_win',
    label: 'Challenge Win',
    icon: '🏆',
    statsField: 'challenges_won',
    incrementStats: true,
    description: 'Won a tribal/team challenge'
  },
  IMMUNITY_WIN: {
    id: 'immunity_win',
    label: 'Immunity Win',
    icon: '🛡️',
    statsField: 'immunity_challenge_wins',
    incrementStats: true,
    description: 'Won individual immunity'
  },
  IDOL_FOUND: {
    id: 'idol_found',
    label: 'Found Idol',
    icon: '🗝️',
    statsField: 'has_idol',
    setValue: true,
    description: 'Found a hidden immunity idol'
  },
  IDOL_PLAYED: {
    id: 'idol_played',
    label: 'Played Idol',
    icon: '✨',
    statsField: 'idols_played',
    incrementStats: true,
    description: 'Played an immunity idol'
  },
  TRIBAL_COUNCIL: {
    id: 'tribal_council',
    label: 'Tribal Council',
    icon: '🔥',
    statsField: null,
    incrementStats: false,
    description: 'Attended tribal council'
  },
  VOTED_OUT: {
    id: 'voted_out',
    label: 'Voted Out',
    icon: '❌',
    statsField: 'status',
    setValue: 'eliminated',
    description: 'Eliminated from the game'
  }
};

// Role Types
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
};

// Color Palette - 90s Sports Jungle Theme
export const COLORS = {
  // Primary Jungle Colors - VIBRANT
  DEEP_JUNGLE: '#0f7c3e',
  JUNGLE_GREEN: '#1e9857',
  MOSS_GREEN: '#20c55e',
  LIGHT_MOSS: '#3de07c',
  
  // Tropical Accents - 90s FLAIR
  TROPICAL_TEAL: '#00d4aa',
  JUNGLE_LIME: '#b7ff00',
  SUNSET_PINK: '#ff006e',
  ELECTRIC_BLUE: '#00b4ff',
  
  // Enhanced Earth Tones
  BURNT_ORANGE: '#ff6b35',
  GOLD: '#ffc857',
  WARM_BROWN: '#8b5a3c',
  
  // Functional
  SUCCESS: '#20c55e',
  WARNING: '#ff6b35',
  DANGER: '#c1121f',
  INFO: '#00b4ff',
  
  // Neutrals
  LIGHT_GRAY: '#f9fafb',
  DARK_GRAY: '#2d3436',
  BORDER_COLOR: '#d4c4b0',
  TEXT_LIGHT: '#636e72',
  TEXT_DEFAULT: '#2d3436',
};

// Tribe Colors (Survivor themed - VIBRANT)
export const TRIBE_COLORS = {
  BORAN: '#ffc857',
  SAMBURU: '#ff006e',
  MOTO: '#1e9857',
  JEMBE: '#00b4ff',
  MARAAMU: '#ff6b35',
  ROTU: '#00d4aa',
  JACARÉ: '#b7ff00',
  LALARI: '#20c55e',
  MANIHIKI: '#ff6b35',
  TAMBU: '#f5f2ed',
  FINAL: '#ff6b35',
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
  PLAYER_STATUS,
  EVENT_TYPES,
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
