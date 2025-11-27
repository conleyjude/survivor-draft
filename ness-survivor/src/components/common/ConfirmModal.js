import React, { useState } from 'react';
import '../styles/ConfirmModal.css';

/**
 * ConfirmModal Component
 * Generic confirmation dialog for destructive actions
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {Function} props.onCancel - Callback when cancelled
 * @param {string} [props.confirmText="Confirm"] - Confirm button text
 * @param {string} [props.cancelText="Cancel"] - Cancel button text
 * @param {string} [props.type="warning"] - Modal type: "warning", "danger", "info"
 * @param {boolean} [props.isOpen=true] - Whether modal is visible
 * @param {boolean} [props.requireConfirmText=false] - Require typing confirmation text
 * @param {string} [props.confirmTextRequired] - Text user must type to confirm
 * @returns {JSX.Element}
 */
const ConfirmModal = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isOpen = true,
  requireConfirmText = false,
  confirmTextRequired = 'CONFIRM',
}) => {
  const [typedText, setTypedText] = useState('');
  const isConfirmDisabled = requireConfirmText && typedText !== confirmTextRequired;

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header modal-${type}`}>
          <h2 className="modal-title">
            {type === 'danger' && '🚨'}
            {type === 'warning' && '⚠️'}
            {type === 'info' && 'ℹ️'}
            {' '}{title}
          </h2>
        </div>

        <div className="modal-body">
          <p className="modal-message">{message}</p>

          {requireConfirmText && (
            <div className="modal-confirm-text">
              <label htmlFor="confirm-input" className="confirm-label">
                Type <strong>{confirmTextRequired}</strong> to confirm:
              </label>
              <input
                id="confirm-input"
                type="text"
                className="confirm-input"
                placeholder={confirmTextRequired}
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn-${type}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
