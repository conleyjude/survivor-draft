/**
 * TribeActionMenu Component
 * Dropdown menu for bulk tribe-wide actions
 * 
 * @param {string} tribeName - The tribe name
 * @param {Function} onAction - Callback when an action is selected
 */

import React, { useState, useRef, useEffect } from 'react';
import './TribeActionMenu.css';

const TribeActionMenu = ({ tribeName, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action) => {
    setIsOpen(false);
    onAction(tribeName, action);
  };

  return (
    <div className="tribe-action-menu" ref={menuRef}>
      <button
        className="tribe-action-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Tribe actions"
        aria-label="Tribe actions menu"
      >
        ⚡
      </button>

      {isOpen && (
        <div className="tribe-action-dropdown">
          <div className="tribe-action-header">
            Tribe Actions
          </div>
          <button
            className="tribe-action-item"
            onClick={() => handleAction('challenge_win')}
          >
            <span className="action-icon">🏆</span>
            <span className="action-label">Won Challenge</span>
            <span className="action-desc">All active members</span>
          </button>
          <button
            className="tribe-action-item"
            onClick={() => handleAction('tribal_council')}
          >
            <span className="action-icon">🔥</span>
            <span className="action-label">Tribal Council</span>
            <span className="action-desc">All active members</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TribeActionMenu;
