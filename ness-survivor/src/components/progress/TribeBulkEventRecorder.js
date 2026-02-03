/**
 * TribeBulkEventRecorder Component
 * Modal for recording events for all tribe members at once
 * 
 * @param {string} tribeName - The tribe name
 * @param {Array} players - Array of players in the tribe
 * @param {string} actionType - Type of action ('challenge_win' or 'tribal_council')
 * @param {number} seasonNumber - Current season number
 * @param {Function} onClose - Callback to close modal
 * @param {Function} onEventsRecorded - Callback after events are successfully recorded
 */

import React, { useState } from 'react';
import { useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { EVENT_TYPES } from '../../utils/constants';
import './TribeBulkEventRecorder.css';

const TribeBulkEventRecorder = ({ tribeName, players, actionType, seasonNumber, onClose, onEventsRecorded }) => {
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const eventType = actionType === 'challenge_win' ? EVENT_TYPES.CHALLENGE_WIN : EVENT_TYPES.TRIBAL_COUNCIL;

  // Filter out eliminated players
  const activePlayers = players.filter(p => p.status !== 'eliminated');

  const { mutate: recordBulkEvents, loading } = useMutation(
    () => neo4jService.createBulkEvents(
      activePlayers,
      eventType.id,
      Number(episodeNumber),
      Number(seasonNumber),
      notes || `${tribeName} - ${eventType.label}`
    ),
    (result) => {
      onEventsRecorded(result);
      onClose();
    },
    (err) => {
      setError(`Error recording events: ${err.message}`);
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!episodeNumber || Number(episodeNumber) < 1) {
      setError('Please enter a valid episode number');
      return;
    }

    if (activePlayers.length === 0) {
      setError('No active players in this tribe');
      return;
    }

    setError('');
    recordBulkEvents();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="tribe-bulk-recorder-overlay" onClick={handleOverlayClick}>
      <div className="tribe-bulk-recorder-modal">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="tribe-bulk-recorder-header">
          <span className="event-icon">{eventType.icon}</span>
          <h2>{eventType.label}</h2>
          <p className="tribe-name">{tribeName}</p>
          <p className="player-count">{activePlayers.length} active member{activePlayers.length !== 1 ? 's' : ''}</p>
        </div>

        <form onSubmit={handleSubmit} className="tribe-bulk-recorder-form">
          <div className="players-preview">
            <strong>Recording for:</strong>
            <div className="players-list">
              {activePlayers.map(player => (
                <span key={`${player.first_name}-${player.last_name}`} className="player-chip">
                  {player.first_name} {player.last_name}
                </span>
              ))}
            </div>
          </div>

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
              placeholder={`Additional details...`}
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
              {loading ? 'Recording...' : `✓ Record for ${activePlayers.length} Player${activePlayers.length !== 1 ? 's' : ''}`}
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

export default TribeBulkEventRecorder;
