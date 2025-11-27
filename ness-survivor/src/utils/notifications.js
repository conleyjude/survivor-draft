/**
 * Notification System for User Feedback
 * 
 * Provides toast-like notifications for success, error, warning, and info messages
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Global notification store (simple implementation)
 */
let notificationListeners = [];

const addNotificationListener = (listener) => {
  notificationListeners.push(listener);
  return () => {
    notificationListeners = notificationListeners.filter((l) => l !== listener);
  };
};

const notifyListeners = (notification) => {
  notificationListeners.forEach((listener) => listener(notification));
};

/**
 * Public API for showing notifications
 */
export const showNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
  const id = Date.now();
  const notification = {
    id,
    message,
    type,
    duration,
    timestamp: new Date(),
  };

  notifyListeners(notification);

  if (duration > 0) {
    setTimeout(() => {
      notifyListeners({ ...notification, action: 'remove' });
    }, duration);
  }

  return id;
};

/**
 * Convenience functions for different notification types
 */
export const showSuccess = (message, duration = 3000) =>
  showNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);

export const showError = (message, duration = 5000) =>
  showNotification(message, NOTIFICATION_TYPES.ERROR, duration);

export const showWarning = (message, duration = 4000) =>
  showNotification(message, NOTIFICATION_TYPES.WARNING, duration);

export const showInfo = (message, duration = 4000) =>
  showNotification(message, NOTIFICATION_TYPES.INFO, duration);

/**
 * Custom Hook for using notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = addNotificationListener((notification) => {
      if (notification.action === 'remove') {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );
      } else {
        setNotifications((prev) => [...prev, notification]);
      }
    });

    return unsubscribe;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, removeNotification };
};

/**
 * Notification Container Component
 */
export const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

/**
 * Individual Notification Component
 */
const Notification = ({ notification, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (notification.duration > 0) {
      timeoutRef.current = setTimeout(onClose, notification.duration);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [notification.duration, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return '✅';
      case NOTIFICATION_TYPES.ERROR:
        return '❌';
      case NOTIFICATION_TYPES.WARNING:
        return '⚠️';
      case NOTIFICATION_TYPES.INFO:
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`notification notification--${notification.type}`}>
      <div className="notification__icon">{getIcon()}</div>
      <div className="notification__content">
        <p className="notification__message">{notification.message}</p>
      </div>
      <button
        className="notification__close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};
