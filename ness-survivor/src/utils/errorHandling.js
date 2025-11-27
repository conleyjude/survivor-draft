/**
 * Error Handling and User Feedback System
 * 
 * Provides comprehensive error handling with retry logic,
 * user-friendly messages, and error recovery strategies.
 */

/**
 * Error types for consistent error handling
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  DATABASE: 'DATABASE_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
  [ERROR_TYPES.DATABASE]: 'Database operation failed. Please try again.',
  [ERROR_TYPES.VALIDATION]: 'Invalid input. Please check your data and try again.',
  [ERROR_TYPES.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.CONFLICT]: 'This item already exists. Please use a different name or value.',
  [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
  [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Categorize errors based on error object
 * @param {Error} error - The error object
 * @returns {string} - The error type
 */
export const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const message = error.message || '';
  const code = error.code || '';

  // Network errors
  if (
    message.includes('Network') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    code === 'ServiceUnavailable'
  ) {
    return ERROR_TYPES.NETWORK;
  }

  // Timeout errors
  if (message.includes('timeout') || code === 'TimeoutError') {
    return ERROR_TYPES.TIMEOUT;
  }

  // Database errors
  if (
    message.includes('Database') ||
    message.includes('query') ||
    code === 'SessionExpired'
  ) {
    return ERROR_TYPES.DATABASE;
  }

  // Validation errors
  if (
    message.includes('Validation') ||
    message.includes('Invalid') ||
    message.includes('required')
  ) {
    return ERROR_TYPES.VALIDATION;
  }

  // Authorization errors
  if (
    message.includes('401') ||
    message.includes('403') ||
    message.includes('Permission') ||
    message.includes('Unauthorized')
  ) {
    return ERROR_TYPES.AUTHORIZATION;
  }

  // Not found errors
  if (
    message.includes('404') ||
    message.includes('not found') ||
    code === 'NotFound'
  ) {
    return ERROR_TYPES.NOT_FOUND;
  }

  // Conflict errors
  if (
    message.includes('409') ||
    message.includes('already exists') ||
    message.includes('Conflict')
  ) {
    return ERROR_TYPES.CONFLICT;
  }

  // Server errors
  if (message.includes('500') || message.includes('Server')) {
    return ERROR_TYPES.SERVER;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * Determine if error is retryable
 * @param {Error} error - The error object
 * @returns {boolean} - Whether the error is retryable
 */
export const isRetryableError = (error) => {
  const errorType = categorizeError(error);

  // Retryable errors
  return [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.DATABASE,
    ERROR_TYPES.SERVER,
  ].includes(errorType);
};

/**
 * Retry operation with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} initialDelay - Initial delay in ms (default: 1000)
 * @returns {Promise} - Result of the operation
 */
export const retryOperation = async (
  operation,
  maxRetries = 3,
  initialDelay = 1000
) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${error.message}`
      );

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Get user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} - User-friendly message
 */
export const getUserFriendlyMessage = (error) => {
  if (!error) return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

  const errorType = categorizeError(error);
  const customMessage = ERROR_MESSAGES[errorType];

  return customMessage || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
};

/**
 * Format error for logging
 * @param {Error} error - The error object
 * @returns {object} - Formatted error object
 */
export const formatErrorForLogging = (error) => {
  return {
    type: categorizeError(error),
    message: error?.message || 'Unknown error',
    code: error?.code || 'UNKNOWN',
    stack: error?.stack || '',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Create an error with additional context
 * @param {string} message - Error message
 * @param {string} type - Error type
 * @param {object} context - Additional context
 * @returns {Error} - Error object with context
 */
export const createContextualError = (message, type = ERROR_TYPES.UNKNOWN, context = {}) => {
  const error = new Error(message);
  error.type = type;
  error.context = context;
  return error;
};

/**
 * Validate form data before submission
 * @param {object} data - Form data to validate
 * @param {object} rules - Validation rules
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateFormData = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    const value = data[field];

    // Required field
    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      return;
    }

    // Min length
    if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
      return;
    }

    // Max length
    if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
      errors[field] = `${field} must be at most ${fieldRules.maxLength} characters`;
      return;
    }

    // Min value
    if (fieldRules.min !== undefined && value !== null && value < fieldRules.min) {
      errors[field] = `${field} must be at least ${fieldRules.min}`;
      return;
    }

    // Max value
    if (fieldRules.max !== undefined && value !== null && value > fieldRules.max) {
      errors[field] = `${field} must be at most ${fieldRules.max}`;
      return;
    }

    // Pattern (regex)
    if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.patternMessage || `${field} format is invalid`;
      return;
    }

    // Custom validator
    if (fieldRules.validate) {
      const customError = fieldRules.validate(value);
      if (customError) {
        errors[field] = customError;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Handle API response and normalize errors
 * @param {Promise} promise - API call promise
 * @returns {Promise} - Normalized response or error
 */
export const handleApiResponse = async (promise) => {
  try {
    const response = await promise;
    return {
      success: true,
      data: response,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        type: categorizeError(error),
        message: getUserFriendlyMessage(error),
        details: error.message,
      },
    };
  }
};

/**
 * Create a result object with success/error state
 * @param {*} data - Result data
 * @param {Error} error - Optional error
 * @returns {object} - Result object
 */
export const createResult = (data = null, error = null) => {
  return {
    success: !error,
    data,
    error: error ? {
      type: categorizeError(error),
      message: getUserFriendlyMessage(error),
      details: error?.message || '',
    } : null,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Combine multiple error messages
 * @param {Error[]} errors - Array of errors
 * @returns {string} - Combined error message
 */
export const combineErrorMessages = (errors) => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  }

  const messages = errors
    .map((err) => getUserFriendlyMessage(err))
    .filter((msg, idx, arr) => arr.indexOf(msg) === idx); // Remove duplicates

  if (messages.length === 1) {
    return messages[0];
  }

  return `Multiple errors occurred:\n${messages.map((msg, i) => `${i + 1}. ${msg}`).join('\n')}`;
};

/**
 * Create an error handler factory for async operations
 * @param {string} operationName - Name of the operation for logging
 * @returns {Function} - Error handler function
 */
export const createErrorHandler = (operationName) => {
  return (error) => {
    const formattedError = formatErrorForLogging(error);
    console.error(`Error in ${operationName}:`, formattedError);
    return {
      operationName,
      ...formattedError,
    };
  };
};
