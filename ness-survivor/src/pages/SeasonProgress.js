/**
 * SeasonProgress - Track season progress with tribe-centric view
 * Features: View all three tribes with assigned players, click player to update stats
 * Prerequisites: Season must have tribes and players assigned
 */

import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetchData, useMutation } from '../hooks/useNeo4j';
import * as neo4jService from '../services/neo4jService';
import QuickActionButtons from '../components/progress/QuickActionButtons';
import EventRecorder from '../components/progress/EventRecorder';
import EventTimeline from '../components/progress/EventTimeline';
import TribeActionMenu from '../components/progress/TribeActionMenu';
import TribeBulkEventRecorder from '../components/progress/TribeBulkEventRecorder';
import '../styles/SeasonProgress.css';

function SeasonProgress() {
  const { seasonNumber } = useParams();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [viewMode, setViewMode] = useState('tribe'); // 'tribe' or 'team'
  
  // Event recording state
  const [showEventRecorder, setShowEventRecorder] = useState(false);
  const [eventToRecord, setEventToRecord] = useState(null);
  const [playerForEvent, setPlayerForEvent] = useState(null);

  // Tribe bulk action state
  const [showTribeBulkRecorder, setShowTribeBulkRecorder] = useState(false);
  const [tribeForBulkAction, setTribeForBulkAction] = useState(null);
  const [bulkActionType, setBulkActionType] = useState(null);

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

  const { data: fantasyTeams, loading: teamsLoading } = useFetchData(
    () => (seasonNumber ? neo4jService.getFantasyTeamsInSeason(Number(seasonNumber)) : Promise.resolve([])),
    [seasonNumber]
  );

  const { data: players, loading: playersLoading, refetch: refetchPlayers } = useFetchData(
    () => (seasonNumber ? neo4jService.getPlayersInSeason(Number(seasonNumber)) : Promise.resolve([])),
    [seasonNumber]
  );

  // Fetch events for selected player
  const { data: playerEvents, loading: eventsLoading, refetch: refetchEvents } = useFetchData(
    () => selectedPlayer ? neo4jService.getEventsForPlayer(selectedPlayer.first_name, selectedPlayer.last_name) : Promise.resolve([]),
    [selectedPlayer]
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

  // Mutation for deleting events
  const { mutate: deleteEvent } = useMutation(
    (eventId) => neo4jService.deleteEvent(eventId),
    () => {
      setSuccessMessage('Event deleted successfully!');
      refetchEvents();
      refetchPlayers();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error deleting event: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  // Group players by tribe or fantasy team based on view mode
  const groupedPlayers = useMemo(() => {
    if (viewMode === 'tribe') {
      // Group by tribe
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
    } else {
      // Group by fantasy team
      const grouped = {};
      fantasyTeams?.forEach(team => {
        grouped[team.team_name] = [];
      });
      players?.forEach(player => {
        if (player.fantasy_team_name && grouped[player.fantasy_team_name]) {
          grouped[player.fantasy_team_name].push(player);
        }
      });
      return grouped;
    }
  }, [viewMode, tribes, fantasyTeams, players]);

  // Get group metadata (tribes or teams) based on view mode
  const groupMetadata = useMemo(() => {
    if (viewMode === 'tribe') {
      return tribes?.map(tribe => ({
        name: tribe.tribe_name,
        color: tribe.tribe_color,
        count: groupedPlayers[tribe.tribe_name]?.length || 0
      })) || [];
    } else {
      return fantasyTeams?.map(team => ({
        name: team.team_name,
        owners: team.owners,
        count: groupedPlayers[team.team_name]?.length || 0
      })) || [];
    }
  }, [viewMode, tribes, fantasyTeams, groupedPlayers]);

  const isLoading = tribesLoading || playersLoading || teamsLoading;

  // Handler for quick action button clicks
  const handleQuickAction = (player, eventType) => {
    setPlayerForEvent(player);
    setEventToRecord(eventType);
    setShowEventRecorder(true);
  };

  // Handler for event recorded successfully
  const handleEventRecorded = () => {
    setSuccessMessage(`Event recorded successfully!`);
    refetchPlayers();
    refetchEvents();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handler for deleting an event
  const handleDeleteEvent = (eventId) => {
    deleteEvent(eventId);
  };

  // Handler for tribe action menu
  const handleTribeAction = (tribeName, actionType) => {
    setTribeForBulkAction(tribeName);
    setBulkActionType(actionType);
    setShowTribeBulkRecorder(true);
  };

  // Handler for bulk events recorded
  const handleBulkEventsRecorded = (result) => {
    const count = result.length;
    setSuccessMessage(`✓ Recorded event for ${count} player${count !== 1 ? 's' : ''}!`);
    refetchPlayers();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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

          {/* View Toggle Tabs */}
          <div className="view-toggle-tabs">
            <button
              className={`tab ${viewMode === 'tribe' ? 'active' : ''}`}
              onClick={() => setViewMode('tribe')}
            >
              🏝️ By Tribe
            </button>
            <button
              className={`tab ${viewMode === 'team' ? 'active' : ''}`}
              onClick={() => setViewMode('team')}
            >
              🎮 By Fantasy Team
            </button>
          </div>

          {isLoading ? (
            <div className="loading-container">
              <p className="loading-message">⏳ Loading {viewMode === 'tribe' ? 'tribes' : 'teams'} and players...</p>
            </div>
          ) : (
            <div className="tribes-container">
              {groupMetadata && groupMetadata.length > 0 ? (
                <div className="tribes-grid">
                  {groupMetadata.map((group) => (
                    <div
                      key={group.name}
                      className="tribe-panel"
                      style={{ borderTopColor: group.color || '#667EEA' }}
                    >
                      <div
                        className="tribe-header"
                        style={{ backgroundColor: group.color || '#667EEA' }}
                      >
                        <h2>{group.name}</h2>
                        {viewMode === 'team' && group.owners && (
                          <span className="team-owners">
                            {Array.isArray(group.owners) ? group.owners.join(', ') : group.owners}
                          </span>
                        )}
                        <div className="tribe-header-right">
                          <span className="player-count">
                            {group.count} {group.count === 1 ? 'member' : 'members'}
                          </span>
                          {viewMode === 'tribe' && (
                            <TribeActionMenu
                              tribeName={group.name}
                              onAction={handleTribeAction}
                            />
                          )}
                        </div>
                      </div>

                      <div className="tribe-players">
                        {groupedPlayers[group.name] && groupedPlayers[group.name].length > 0 ? (
                          <ul className="player-list">
                            {groupedPlayers[group.name].map((player) => (
                              <li key={`${player.first_name}-${player.last_name}`}>
                                <div className="player-card-wrapper">
                                  <button
                                    className={`player-button ${viewMode === 'team' ? 'team-view' : ''}`}
                                    onClick={() => setSelectedPlayer(player)}
                                    style={
                                      viewMode === 'team' && player.tribe_color
                                        ? {
                                            borderTopColor: player.tribe_color,
                                            background: `linear-gradient(to bottom, ${player.tribe_color}20 0%, transparent 40%)`
                                          }
                                        : {}
                                    }
                                  >
                                    <span className="player-name">
                                      {player.first_name} {player.last_name}
                                      {viewMode === 'team' && player.tribe_name && (
                                        <span className="player-tribe-badge" style={{ color: player.tribe_color }}>
                                          {' '}• {player.tribe_name}
                                        </span>
                                      )}
                                    </span>
                                    <div className="player-info-right">
                                      <span className="player-stats">
                                        {player.jury_status && '⚖️'}
                                        {player.challenge_wins > 0 && ` 🏆${player.challenge_wins}`}
                                        {player.immunity_challenge_wins > 0 && ` 🛡️${player.immunity_challenge_wins}`}
                                      </span>
                                      <QuickActionButtons
                                        player={player}
                                        onActionClick={handleQuickAction}
                                      />
                                    </div>
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="no-players">No players on this {viewMode === 'tribe' ? 'tribe' : 'team'} yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No {viewMode === 'tribe' ? 'tribes' : 'fantasy teams'} found for this season.</p>
                  {viewMode === 'tribe' ? (
                    <Link to={`/admin/tribes`} className="btn btn-primary">
                      Manage Tribes
                    </Link>
                  ) : (
                    <Link to={`/admin/fantasy-teams`} className="btn btn-primary">
                      Manage Teams
                    </Link>
                  )}
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

                {/* Event Timeline */}
                <EventTimeline
                  events={playerEvents || []}
                  onDeleteEvent={handleDeleteEvent}
                  loading={eventsLoading}
                />

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

      {/* Event Recorder Modal */}
      {showEventRecorder && playerForEvent && eventToRecord && (
        <EventRecorder
          player={playerForEvent}
          eventType={eventToRecord}
          seasonNumber={Number(seasonNumber)}
          onClose={() => setShowEventRecorder(false)}
          onEventRecorded={handleEventRecorded}
        />
      )}

      {/* Tribe Bulk Event Recorder Modal */}
      {showTribeBulkRecorder && tribeForBulkAction && bulkActionType && (
        <TribeBulkEventRecorder
          tribeName={tribeForBulkAction}
          players={groupedPlayers[tribeForBulkAction] || []}
          actionType={bulkActionType}
          seasonNumber={Number(seasonNumber)}
          onClose={() => setShowTribeBulkRecorder(false)}
          onEventsRecorded={handleBulkEventsRecorded}
        />
      )}

      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
}

export default SeasonProgress;
