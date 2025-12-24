/**
 * SeasonProgress - Track season progress with tribe-centric view
 * Features: View all three tribes with assigned players, click player to update stats
 * Prerequisites: Season must have tribes and players assigned
 */

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchData, useMutation } from '../hooks/useNeo4j';
import * as neo4jService from '../services/neo4jService';
import '../styles/SeasonProgress.css';

function SeasonProgress() {
  const { seasonNumber } = useParams();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    challenge_wins: 0,
    immunity_challenge_wins: 0,
    votes_received_total: 0,
    jury_status: false,
  });

  // Data fetching
  const { data: tribes, loading: tribesLoading } = useFetchData(
    () => (seasonNumber ? neo4jService.getTribesInSeason(Number(seasonNumber)) : Promise.resolve([])),
    [seasonNumber]
  );

  const { data: players, loading: playersLoading, refetch: refetchPlayers } = useFetchData(
    () => (seasonNumber ? neo4jService.getPlayersInSeason(Number(seasonNumber)) : Promise.resolve([])),
    [seasonNumber]
  );

  // Mutation for updating player stats
  const { mutate: updatePlayerStats } = useMutation(
    () => neo4jService.updatePlayer(selectedPlayer.first_name, selectedPlayer.last_name, editForm),
    () => {
      setSuccessMessage('Player stats updated successfully!');
      setEditMode(false);
      // Update selected player with new data
      const updatedPlayer = { ...selectedPlayer, ...editForm };
      setSelectedPlayer(updatedPlayer);
      refetchPlayers();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error updating player: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  // Group players by tribe
  const playersByTribe = useMemo(() => {
    const grouped = {};
    tribes?.forEach(tribe => {
      grouped[tribe.tribe_name] = [];
    });
    players?.forEach(player => {
      if (player.tribe_name && grouped[player.tribe_name]) {
        grouped[player.tribe_name].push(player);
      }
    });
    return grouped;
  }, [tribes, players]);

  const isLoading = tribesLoading || playersLoading;

  // Handler for opening player editor
  const handleEditPlayer = (player) => {
    setEditForm({
      challenge_wins: player.challenge_wins || 0,
      immunity_challenge_wins: player.immunity_challenge_wins || 0,
      votes_received_total: player.votes_received_total || 0,
      jury_status: player.jury_status || false,
    });
    setEditMode(true);
  };

  // Handler for form input changes
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for saving changes
  const handleSaveChanges = () => {
    updatePlayerStats();
  };

  // Handler for canceling edit
  const handleCancelEdit = () => {
    setEditMode(false);
  };

  // Handler for closing modal
  const handleCloseModal = () => {
    setSelectedPlayer(null);
    setEditMode(false);
  };

  return (
    <div className="season-progress">
      {/* Messages */}
      {successMessage && (
        <div className="message message-success">
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message message-error">
          ✕ {errorMessage}
        </div>
      )}
      {seasonNumber && (
        <>
          <div className="progress-header">
            <h1>🏝️ Season {seasonNumber} Progress</h1>
            <p className="subtitle">Track tribes and player statistics as the season progresses</p>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <p className="loading-message">⏳ Loading tribes and players...</p>
            </div>
          ) : (
            <div className="tribes-container">
              {tribes && tribes.length > 0 ? (
                <div className="tribes-grid">
                  {tribes.map((tribe) => (
                    <div
                      key={tribe.tribe_name}
                      className="tribe-panel"
                      style={{ borderTopColor: tribe.tribe_color }}
                    >
                      <div
                        className="tribe-header"
                        style={{ backgroundColor: tribe.tribe_color }}
                      >
                        <h2>{tribe.tribe_name}</h2>
                        <span className="player-count">
                          {playersByTribe[tribe.tribe_name]?.length || 0} members
                        </span>
                      </div>

                      <div className="tribe-players">
                        {playersByTribe[tribe.tribe_name] && playersByTribe[tribe.tribe_name].length > 0 ? (
                          <ul className="player-list">
                            {playersByTribe[tribe.tribe_name].map((player) => (
                              <li key={`${player.first_name}-${player.last_name}`}>
                                <button
                                  className="player-button"
                                  onClick={() => setSelectedPlayer(player)}
                                >
                                  <span className="player-name">
                                    {player.first_name} {player.last_name}
                                  </span>
                                  <span className="player-stats">
                                    {player.jury_status && '⚖️'}
                                    {player.challenge_wins > 0 && ` 🏆${player.challenge_wins}`}
                                    {player.immunity_challenge_wins > 0 && ` 🛡️${player.immunity_challenge_wins}`}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="no-players">No players on this tribe yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No tribes found for this season. Create tribes first.</p>
                  <Link to={`/admin/tribes`} className="btn btn-primary">
                    Manage Tribes
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!seasonNumber && (
        <div className="no-selection">
          <p>No season selected. Please navigate to a season first.</p>
          <Link to="/" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="player-detail-header">
              <h2>{selectedPlayer.first_name} {selectedPlayer.last_name}</h2>
              <p className="player-tribe" style={{ color: tribes?.find(t => t.tribe_name === selectedPlayer.tribe_name)?.tribe_color }}>
                {selectedPlayer.tribe_name}
              </p>
            </div>

            {!editMode ? (
              <>
                {/* View Mode */}
                <div className="player-stats-grid">
                  <div className="stat-item">
                    <label>🏆 Challenge Wins</label>
                    <span className="stat-value">{selectedPlayer.challenge_wins || 0}</span>
                  </div>
                  <div className="stat-item">
                    <label>🛡️ Immunity Challenge Wins</label>
                    <span className="stat-value">{selectedPlayer.immunity_challenge_wins || 0}</span>
                  </div>
                  <div className="stat-item">
                    <label>📨 Votes Received</label>
                    <span className="stat-value">{selectedPlayer.votes_received_total || 0}</span>
                  </div>
                  <div className="stat-item">
                    <label>⚖️ Jury Status</label>
                    <span className={`stat-value ${selectedPlayer.jury_status ? 'active' : ''}`}>
                      {selectedPlayer.jury_status ? 'On Jury' : 'Not on Jury'}
                    </span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => handleEditPlayer(selectedPlayer)}
                  >
                    ✎ Edit Stats
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Edit Mode */}
                <form className="edit-form">
                  <div className="form-group">
                    <label htmlFor="challenge-wins">🏆 Challenge Wins</label>
                    <input
                      id="challenge-wins"
                      type="number"
                      min="0"
                      value={editForm.challenge_wins}
                      onChange={(e) => handleFormChange('challenge_wins', parseInt(e.target.value) || 0)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="immunity-wins">🛡️ Immunity Challenge Wins</label>
                    <input
                      id="immunity-wins"
                      type="number"
                      min="0"
                      value={editForm.immunity_challenge_wins}
                      onChange={(e) => handleFormChange('immunity_challenge_wins', parseInt(e.target.value) || 0)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="votes-received">📨 Votes Received</label>
                    <input
                      id="votes-received"
                      type="number"
                      min="0"
                      value={editForm.votes_received_total}
                      onChange={(e) => handleFormChange('votes_received_total', parseInt(e.target.value) || 0)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group checkbox">
                    <label htmlFor="jury-status">
                      <input
                        id="jury-status"
                        type="checkbox"
                        checked={editForm.jury_status}
                        onChange={(e) => handleFormChange('jury_status', e.target.checked)}
                      />
                      <span>⚖️ On Jury</span>
                    </label>
                  </div>
                </form>

                <div className="modal-actions">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleSaveChanges}
                  >
                    ✓ Save Changes
                  </button>
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={handleCancelEdit}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
}

export default SeasonProgress;
