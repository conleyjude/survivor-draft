import React from 'react';
import '../styles/LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.message="Loading..."] - Message to display below spinner
 * @param {string} [props.size="medium"] - Size: "small", "medium", "large"
 * @param {boolean} [props.overlay=false] - Full screen overlay when true
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({ message = 'Loading...', size = 'medium', overlay = false }) => {
  const spinnerClass = overlay ? 'spinner-overlay' : `spinner-${size}`;

  return (
    <div className={`loading-container ${spinnerClass}`}>
      <div className={`spinner ${size}`}></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
