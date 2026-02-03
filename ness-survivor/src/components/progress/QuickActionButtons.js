/**
 * QuickActionButtons Component
 * Displays quick action buttons for recording player events
 * 
 * @param {Object} player - The player object
 * @param {Function} onActionClick - Callback when an action is clicked
 */

import React from 'react';
import { EVENT_TYPES } from '../../utils/constants';
import './QuickActionButtons.css';

const QuickActionButtons = ({ player, onActionClick }) => {
  const handleActionClick = (e, eventType) => {
    e.stopPropagation(); // Prevent triggering parent click (opening player modal)
    onActionClick(player, eventType);
  };

  return (
    <div className="quick-action-buttons">
      <button
        className="action-btn"
        onClick={(e) => handleActionClick(e, EVENT_TYPES.CHALLENGE_WIN)}
        title={EVENT_TYPES.CHALLENGE_WIN.description}
        aria-label={EVENT_TYPES.CHALLENGE_WIN.label}
      >
        {EVENT_TYPES.CHALLENGE_WIN.icon}
      </button>
      
      <button
        className="action-btn"
        onClick={(e) => handleActionClick(e, EVENT_TYPES.IMMUNITY_WIN)}
        title={EVENT_TYPES.IMMUNITY_WIN.description}
        aria-label={EVENT_TYPES.IMMUNITY_WIN.label}
      >
        {EVENT_TYPES.IMMUNITY_WIN.icon}
      </button>
      
      <button
        className="action-btn"
        onClick={(e) => handleActionClick(e, EVENT_TYPES.IDOL_FOUND)}
        title={EVENT_TYPES.IDOL_FOUND.description}
        aria-label={EVENT_TYPES.IDOL_FOUND.label}
      >
        {EVENT_TYPES.IDOL_FOUND.icon}
      </button>
      
      <button
        className="action-btn"
        onClick={(e) => handleActionClick(e, EVENT_TYPES.TRIBAL_COUNCIL)}
        title={EVENT_TYPES.TRIBAL_COUNCIL.description}
        aria-label={EVENT_TYPES.TRIBAL_COUNCIL.label}
      >
        {EVENT_TYPES.TRIBAL_COUNCIL.icon}
      </button>
      
      <button
        className="action-btn action-btn-danger"
        onClick={(e) => handleActionClick(e, EVENT_TYPES.VOTED_OUT)}
        title={EVENT_TYPES.VOTED_OUT.description}
        aria-label={EVENT_TYPES.VOTED_OUT.label}
      >
        {EVENT_TYPES.VOTED_OUT.icon}
      </button>
    </div>
  );
};

export default QuickActionButtons;
