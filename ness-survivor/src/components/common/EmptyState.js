import React from 'react';
import '../styles/EmptyState.css';

/**
 * EmptyState Component
 * Displays empty state with icon, message, and action
 * 
 * @component
 * @param {Object} props
 * @param {string} props.icon - Emoji or icon to display
 * @param {string} props.title - Empty state title
 * @param {string} [props.message] - Empty state description
 * @param {Object} [props.action] - Action button {label, onClick}
 * @returns {JSX.Element}
 */
const EmptyState = ({ icon, title, message, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && (
        <button className="btn-primary" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
