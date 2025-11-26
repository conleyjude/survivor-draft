/**
 * Validation Utilities for Survivor Draft App
 * Provides comprehensive validation rules for all entity types
 */

/**
 * Season Validation Rules
 */
export const seasonValidation = {
  season_number: (value) => {
    if (!value && value !== 0) return 'Season number is required';
    const num = Number(value);
    if (isNaN(num)) return 'Season number must be a number';
    if (num < 1) return 'Season number must be at least 1';
    if (num > 100) return 'Season number cannot exceed 100';
    if (!Number.isInteger(num)) return 'Season number must be a whole number';
    return '';
  },
  year: (value) => {
    if (!value && value !== 0) return 'Year is required';
    const num = Number(value);
    if (isNaN(num)) return 'Year must be a number';
    const currentYear = new Date().getFullYear();
    if (num < 2000) return 'Year must be 2000 or later';
    if (num > currentYear + 1) return `Year cannot be in the future`;
    if (!Number.isInteger(num)) return 'Year must be a whole number';
    return '';
  },
};

/**
 * Tribe Validation Rules
 */
export const tribeValidation = {
  tribe_name: (value) => {
    if (!value || !value.trim()) return 'Tribe name is required';
    if (value.trim().length < 2) return 'Tribe name must be at least 2 characters';
    if (value.trim().length > 50) return 'Tribe name cannot exceed 50 characters';
    return '';
  },
  color: (value) => {
    if (!value || !value.trim()) return 'Tribe color is required';
    // Validate hex color format
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (!hexRegex.test(value)) return 'Please provide a valid hex color (e.g., #FF5733)';
    return '';
  },
  season_number: (value) => {
    if (!value && value !== 0) return 'Season is required';
    return '';
  },
};

/**
 * Player Validation Rules
 */
export const playerValidation = {
  first_name: (value) => {
    if (!value || !value.trim()) return 'First name is required';
    if (value.trim().length < 2) return 'First name must be at least 2 characters';
    if (value.trim().length > 50) return 'First name cannot exceed 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  },
  last_name: (value) => {
    if (!value || !value.trim()) return 'Last name is required';
    if (value.trim().length < 2) return 'Last name must be at least 2 characters';
    if (value.trim().length > 50) return 'Last name cannot exceed 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
    return '';
  },
  age: (value) => {
    if (!value) return 'Age is required';
    const num = Number(value);
    if (isNaN(num)) return 'Age must be a number';
    if (num < 18) return 'Age must be at least 18';
    if (num > 120) return 'Age must be 120 or less';
    if (!Number.isInteger(num)) return 'Age must be a whole number';
    return '';
  },
  occupation: (value) => {
    if (!value || !value.trim()) return 'Occupation is required';
    if (value.trim().length < 2) return 'Occupation must be at least 2 characters';
    if (value.trim().length > 100) return 'Occupation cannot exceed 100 characters';
    return '';
  },
  season_number: (value) => {
    if (!value && value !== 0) return 'Season is required';
    return '';
  },
  tribe_name: (value) => {
    if (!value || !value.trim()) return 'Tribe is required';
    return '';
  },
  placement: (value) => {
    if (!value && value !== 0) return 'Placement is required';
    const num = Number(value);
    if (isNaN(num)) return 'Placement must be a number';
    if (num < 1) return 'Placement must be at least 1';
    if (num > 20) return 'Placement cannot exceed 20';
    if (!Number.isInteger(num)) return 'Placement must be a whole number';
    return '';
  },
};

/**
 * Alliance Validation Rules
 */
export const allianceValidation = {
  alliance_name: (value) => {
    if (!value || !value.trim()) return 'Alliance name is required';
    if (value.trim().length < 2) return 'Alliance name must be at least 2 characters';
    if (value.trim().length > 100) return 'Alliance name cannot exceed 100 characters';
    return '';
  },
  members: (value) => {
    if (!value || value.length === 0) return 'At least one member is required';
    if (value.length > 10) return 'Alliance cannot have more than 10 members';
    return '';
  },
  status: (value) => {
    const validStatuses = ['active', 'broken', 'dormant'];
    if (!value || !validStatuses.includes(value)) return 'Please select a valid alliance status';
    return '';
  },
};

/**
 * Fantasy Team Validation Rules
 */
export const fantasyTeamValidation = {
  team_name: (value) => {
    if (!value || !value.trim()) return 'Team name is required';
    if (value.trim().length < 2) return 'Team name must be at least 2 characters';
    if (value.trim().length > 100) return 'Team name cannot exceed 100 characters';
    return '';
  },
  owner: (value) => {
    if (!value || !value.trim()) return 'Owner name is required';
    if (value.trim().length < 2) return 'Owner name must be at least 2 characters';
    if (value.trim().length > 100) return 'Owner name cannot exceed 100 characters';
    return '';
  },
  season_number: (value) => {
    if (!value && value !== 0) return 'Season is required';
    return '';
  },
};

/**
 * Draft Pick Validation Rules
 */
export const draftPickValidation = {
  round: (value) => {
    if (!value && value !== 0) return 'Round is required';
    const num = Number(value);
    if (isNaN(num)) return 'Round must be a number';
    if (num < 1) return 'Round must be at least 1';
    if (num > 20) return 'Round cannot exceed 20';
    if (!Number.isInteger(num)) return 'Round must be a whole number';
    return '';
  },
  pick: (value) => {
    if (!value && value !== 0) return 'Pick number is required';
    const num = Number(value);
    if (isNaN(num)) return 'Pick must be a number';
    if (num < 1) return 'Pick must be at least 1';
    if (num > 100) return 'Pick cannot exceed 100';
    if (!Number.isInteger(num)) return 'Pick must be a whole number';
    return '';
  },
  player_name: (value) => {
    if (!value || !value.trim()) return 'Player is required';
    return '';
  },
};

/**
 * Generic validation runner
 * @param {object} values - Form values to validate
 * @param {object} rules - Validation rules object
 * @returns {object} Errors object
 */
export const validateForm = (values, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const error = rules[field](values[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};

/**
 * Check if form has any errors
 * @param {object} errors - Errors object from validation
 * @returns {boolean}
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some(error => error !== '');
};

/**
 * Sanitize input values
 * @param {string} value - Input value to sanitize
 * @returns {string}
 */
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string} Error message or empty string
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please provide a valid email address';
  return '';
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {string} Error message or empty string
 */
export const validateURL = (url) => {
  if (!url || !url.trim()) return 'URL is required';
  try {
    new URL(url);
    return '';
  } catch {
    return 'Please provide a valid URL';
  }
};

/**
 * Validate unique value
 * @param {string} value - Value to check
 * @param {array} existingValues - Array of existing values
 * @param {string} fieldName - Field name for error message
 * @returns {string} Error message or empty string
 */
export const validateUnique = (value, existingValues, fieldName = 'This value') => {
  if (existingValues && existingValues.includes(value)) {
    return `${fieldName} already exists`;
  }
  return '';
};

/**
 * Combine multiple validation rules
 * @param {...function} validators - Validation functions
 * @returns {function}
 */
export const combineValidators = (...validators) => {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return '';
  };
};

/**
 * Get validation rules for a specific entity type
 * @param {string} entityType - Type of entity (season, tribe, player, alliance, fantasyTeam, draftPick)
 * @returns {object} Validation rules object
 */
export const getValidationRules = (entityType) => {
  const rules = {
    season: seasonValidation,
    tribe: tribeValidation,
    player: playerValidation,
    alliance: allianceValidation,
    fantasyTeam: fantasyTeamValidation,
    draftPick: draftPickValidation,
  };
  
  return rules[entityType] || {};
};
