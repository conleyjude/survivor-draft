/**
 * EventRecorder Component
 * Modal for recording episode events for players
 * 
 * @param {Object} player - The player object
 * @param {Object} eventType - The event type from EVENT_TYPES
 * @param {number} seasonNumber - Current season number
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onEventRecorded - Callback after event is successfully recorded
 */

import React, { useState } from 'react';
import { useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import './EventRecorder.css';

const EventRecorder = ({ player, eventType, seasonNumber, onClose, onEventRecorded }) => {
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { mutate: recordEvent, loading } = useMutation(
    () => neo4jService.createEvent(
      player.first_name,
      player.last_name,
      eventType.id,
      Number(episodeNumber),
      Number(seasonNumber),
      notes
    ),
    (result) => {
      onEventRecorded(result);
      onClose();
    },
    (err) => {
      setError(`Error recording event: ${err.message}`);
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!episodeNumber || Number(episodeNumber) < 1) {
      setError('Please enter a valid episode number');
      return;
    }

    setError('');
    recordEvent();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="event-recorder-overlay" onClick={handleOverlayClick}>
      <div className="event-recorder-modal">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="event-recorder-header">
          <span className="event-icon">{eventType.icon}</span>
          <h2>{eventType.label}</h2>
          <p className="player-name">{player.first_name} {player.last_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="event-recorder-form">
          <div className="form-group">
            <label htmlFor="episode-number">Episode Number *</label>
            <input
              id="episode-number"
              type="number"
              min="1"
              max="20"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              className="form-input"
              placeholder="e.g., 5"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-textarea"
              placeholder={`Additional details about this ${eventType.label.toLowerCase()}...`}
              rows="3"
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Recording...' : '✓ Record Event'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRecorder;
