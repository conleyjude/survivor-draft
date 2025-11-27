/**
 * Enhanced Admin Component Wrapper with Error Handling
 * 
 * This provides a reusable wrapper for admin components with:
 * - Comprehensive error handling
 * - Retry mechanisms
 * - User feedback (loading, success, error states)
 * - Data validation
 * - Loading and error state management
 */

import React, { useState, useCallback } from 'react';
import { ErrorBoundary, ConfirmModal, LoadingSpinner } from '../components/common';
import {
  validateFormData,
  handleApiResponse,
  retryOperation,
  createResult,
} from '../utils/errorHandling';
import {
  showSuccess,
  showError,
  showWarning,
  NotificationContainer,
} from '../utils/notifications';

/**
 * HOC for wrapping admin components with error handling
 */
export const withErrorHandling = (Component, componentName) => {
  return (props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const executeWithErrorHandling = useCallback(
      async (operation, options = {}) => {
        const {
          successMessage = 'Operation completed successfully',
          errorTitle = 'Operation Failed',
          shouldRetry = true,
          retries = 3,
          onSuccess = null,
          onError = null,
          validate = null,
        } = options;

        try {
          setIsLoading(true);
          setError(null);

          // Validate if validator provided
          if (validate) {
            const validation = validate();
            if (!validation.isValid) {
              const errorMsg = Object.values(validation.errors).join(', ');
              setError(errorMsg);
              showWarning(`Validation failed: ${errorMsg}`);
              return { success: false, error: errorMsg };
            }
          }

          // Execute operation with optional retry
          let result;
          if (shouldRetry) {
            result = await retryOperation(operation, retries);
          } else {
            result = await operation();
          }

          setData(result);
          showSuccess(successMessage);
          onSuccess?.(result);

          return createResult(result);
        } catch (err) {
          const errorMessage = err?.message || errorTitle;
          setError(errorMessage);
          showError(errorMessage);
          onError?.(err);

          return createResult(null, err);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    return (
      <ErrorBoundary>
        <div className="admin-component-wrapper">
          {isLoading && <LoadingSpinner overlay message="Processing..." />}

          {error && (
            <div className="error-banner">
              <div className="error-banner__content">
                <span className="error-banner__icon">⚠️</span>
                <span className="error-banner__message">{error}</span>
                <button
                  className="error-banner__close"
                  onClick={() => setError(null)}
                  aria-label="Close error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <Component
            {...props}
            onExecuteWithErrorHandling={executeWithErrorHandling}
            isLoading={isLoading}
            error={error}
            data={data}
          />

          <NotificationContainer />
        </div>
      </ErrorBoundary>
    );
  };
};

/**
 * Hook for using error handling in components
 */
export const useErrorHandling = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeAsync = useCallback(
    async (operation, options = {}) => {
      const {
        successMessage = 'Operation completed successfully',
        shouldRetry = true,
        retries = 3,
      } = options;

      try {
        setIsLoading(true);
        setError(null);

        const result = shouldRetry
          ? await retryOperation(operation, retries)
          : await operation();

        showSuccess(successMessage);
        return result;
      } catch (err) {
        const errorMessage = err?.message || 'Operation failed';
        setError(errorMessage);
        showError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    executeAsync,
    clearError,
  };
};

/**
 * Hook for form validation
 */
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const validation = validateFormData(values, validationRules);
    setErrors(validation.errors);
    return validation.isValid;
  }, [values, validationRules]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues,
  };
};

/**
 * Error Banner Component
 */
export const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-banner">
      <div className="error-banner__content">
        <span className="error-banner__icon">⚠️</span>
        <span className="error-banner__message">{message}</span>
        {onClose && (
          <button
            className="error-banner__close"
            onClick={onClose}
            aria-label="Close error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Loading State Overlay Component
 */
export const LoadingOverlay = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <LoadingSpinner message={message} size="large" />
    </div>
  );
};

/**
 * Data State Component - Show appropriate state (loading, error, empty, data)
 */
export const DataState = ({ isLoading, error, isEmpty, children }) => {
  if (isLoading) {
    return <LoadingSpinner message="Loading data..." />;
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (isEmpty) {
    return (
      <div className="empty-state">
        <p>No data available</p>
      </div>
    );
  }

  return children;
};
