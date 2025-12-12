/**
 * DraftManager - Manage draft picks for fantasy teams
 * Features: Track draft picks, manage draft rounds
 * Prerequisites: Fantasy teams must be created first
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/DraftManager.css';

function DraftManager() {
  // State for cascading selectors
  const [selectedSeason, setSelectedSeason] = useState('');

  // State for draft management
  const [draftRound, setDraftRound] = useState(1);
  const [draftPick, setDraftPick] = useState(1);
  const [teamPlayerSelections, setTeamPlayerSelections] = useState({});
  // Maps team_name -> selected_player_name

  // State for draft order (local only)
  const [draftOrder, setDraftOrder] = useState([]); // Array of team names in draft order
  const [draftOrderSet, setDraftOrderSet] = useState(false); // Flag to track if draft order has been set
  const [draftOrderInputs, setDraftOrderInputs] = useState({}); // Maps team_name -> draft position
  const [draftType, setDraftType] = useState('normal'); // 'normal' or 'snake'

  // State for messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data fetching
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const { data: players, refetch: refetchPlayers } = useFetchData(
    () => (selectedSeason ? neo4jService.getPlayersInSeason(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );
  const { data: teams } = useFetchData(
    () => (selectedSeason ? neo4jService.getFantasyTeamsInSeason(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );
  const { data: draftPicks, refetch: refetchDraftPicks } = useFetchData(
    () => (selectedSeason ? neo4jService.getDraftPicksForSeason(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );

  // Mutations
  const { mutate: createDraftPick } = useMutation(
    (teamName, playerName) =>
      neo4jService.createDraftPick(
        Number(selectedSeason),
        draftRound,
        draftPick,
        playerName,
        teamName
      ),
    () => {
      setSuccessMessage('Draft pick created successfully!');
      // Auto-increment pick/round
      const nextPick = draftPick === teams.length ? 1 : draftPick + 1;
      const nextRound = draftPick === teams.length ? draftRound + 1 : draftRound;
      setDraftPick(nextPick);
      setDraftRound(nextRound);
      // Clear selections
      setTeamPlayerSelections({});
      refetchDraftPicks();
      refetchPlayers();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error creating draft pick: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: deleteDraftPick } = useMutation(
    (pick) => neo4jService.deleteDraftPick(Number(selectedSeason), pick.round, pick.pick_number),
    () => {
      setSuccessMessage('Draft pick removed successfully!');
      refetchDraftPicks();
      refetchPlayers();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error removing draft pick: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  // Form handlers
  const handleSeasonChange = (e) => {
    setSelectedSeason(e.target.value);
    setTeamPlayerSelections({});
    setDraftOrder([]);
    setDraftOrderSet(false);
    setDraftOrderInputs({});
    setDraftRound(1);
    setDraftPick(1);
  };

  // Draft order handlers
  const handleRandomDraftOrder = () => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    setDraftOrder(shuffled.map(t => t.team_name));
    setDraftOrderSet(true);
    const inputs = {};
    shuffled.forEach((team, idx) => {
      inputs[team.team_name] = idx + 1;
    });
    setDraftOrderInputs(inputs);
    setSuccessMessage('Random draft order generated! 🎲');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDraftOrderPositionChange = (teamName, position) => {
    setDraftOrderInputs(prev => ({
      ...prev,
      [teamName]: parseInt(position) || ''
    }));
  };

  const handleSetCustomDraftOrder = () => {
    // Validate that all positions are filled and unique
    const positions = Object.values(draftOrderInputs).filter(p => p !== '');
    if (positions.length !== teams.length) {
      setErrorMessage('All teams must have a draft position!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (new Set(positions).size !== positions.length) {
      setErrorMessage('Draft positions must be unique!');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (positions.some(p => p < 1 || p > teams.length)) {
      setErrorMessage(`Draft positions must be between 1 and ${teams.length}!`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Sort teams by their assigned position
    const ordered = [...teams].sort((a, b) => 
      (draftOrderInputs[a.team_name] || 0) - (draftOrderInputs[b.team_name] || 0)
    );
    setDraftOrder(ordered.map(t => t.team_name));
    setDraftOrderSet(true);
    setSuccessMessage('Draft order set successfully! ✓');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResetDraftOrder = () => {
    setDraftOrder([]);
    setDraftOrderSet(false);
    setDraftOrderInputs({});
  };

  const getCurrentTurnTeam = () => {
    if (!draftOrderSet || draftOrder.length === 0) return null;
    
    const numTeams = draftOrder.length;
    let currentIndex;
    
    if (draftType === 'snake') {
      // Snake draft: odd rounds go 1->N, even rounds go N->1
      const roundNumber = draftRound;
      const isEvenRound = roundNumber % 2 === 0;
      const pickInRound = draftPick - ((draftRound - 1) * numTeams);
      
      if (isEvenRound) {
        // Even rounds: reverse order (N, N-1, N-2, ..., 1)
        currentIndex = numTeams - pickInRound;
      } else {
        // Odd rounds: normal order (1, 2, 3, ..., N)
        currentIndex = pickInRound - 1;
      }
    } else {
      // Normal draft: always 1->N
      currentIndex = (draftPick - 1) % numTeams;
    }
    
    return draftOrder[currentIndex];
  };

  // Filtering
  const filteredPlayers = players?.filter((player) =>
    !draftPicks?.some((dp) => dp.player_name === `${player.first_name} ${player.last_name}`)
  ) || [];

  const handleTeamPlayerSelect = (teamName, playerName) => {
    setTeamPlayerSelections(prev => ({
      ...prev,
      [teamName]: playerName
    }));
  };

  const handleSubmitDraftPickForTeam = (teamName) => {
    // Check if draft order is set
    if (draftOrderSet && getCurrentTurnTeam() !== teamName) {
      setErrorMessage(`It's ${getCurrentTurnTeam()}'s turn! They must draft next.`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    const playerName = teamPlayerSelections[teamName];
    if (!playerName) {
      setErrorMessage(`Please select a player for ${teamName}`);
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    createDraftPick(teamName, playerName);
  };

  return (
    <div className="draft-manager">
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

      <div className="manager-header">
        <h1>🎯 Draft Management</h1>
      </div>

      {/* Season Selector */}
      <div className="season-selector-container">
        <div className="form-group">
          <label htmlFor="season">Select Season</label>
          <select
            id="season"
            value={selectedSeason}
            onChange={handleSeasonChange}
            className="season-selector"
          >
            <option value="">-- Choose Season --</option>
            {seasons?.map((season) => (
              <option key={season.season_number} value={season.season_number}>
                Season {season.season_number} ({season.year})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="manager-content">
        {selectedSeason && (
          <>
            {/* Draft Type Selection */}
            <section className="draft-type-selection">
              <h2>⚙️ Draft Settings</h2>
              <div className="draft-type-options">
                <label className="draft-type-option">
                  <input
                    type="radio"
                    name="draft-type"
                    value="normal"
                    checked={draftType === 'normal'}
                    onChange={(e) => {
                      if (!draftOrderSet) {
                        setDraftType(e.target.value);
                      }
                    }}
                    disabled={draftOrderSet}
                  />
                  <span className="option-label">
                    <span className="option-title">📊 Normal Draft</span>
                    <span className="option-description">Each team picks in the same order every round (1→2→3...→N)</span>
                  </span>
                </label>
                <label className="draft-type-option">
                  <input
                    type="radio"
                    name="draft-type"
                    value="snake"
                    checked={draftType === 'snake'}
                    onChange={(e) => {
                      if (!draftOrderSet) {
                        setDraftType(e.target.value);
                      }
                    }}
                    disabled={draftOrderSet}
                  />
                  <span className="option-label">
                    <span className="option-title">🐍 Snake Draft</span>
                    <span className="option-description">Odd rounds pick 1→N, even rounds pick N→1 (more fair)</span>
                  </span>
                </label>
              </div>
            </section>

            {/* Draft Order Setup */}
            <section className="draft-order-setup">
              <h2>📋 Draft Order Setup</h2>
              {!draftOrderSet ? (
                <div className="draft-order-options">
                  <div className="draft-order-buttons">
                    <button 
                      onClick={handleRandomDraftOrder}
                      className="btn btn-primary"
                    >
                      🎲 Random Draft Order
                    </button>
                    <span className="divider">or</span>
                    <button 
                      onClick={() => {
                        // Initialize inputs with empty values
                        const inputs = {};
                        teams.forEach(team => {
                          inputs[team.team_name] = draftOrderInputs[team.team_name] || '';
                        });
                        setDraftOrderInputs(inputs);
                      }}
                      className="btn btn-secondary"
                    >
                      ✏️ Set Custom Order
                    </button>
                  </div>

                  {/* Custom Draft Order Inputs */}
                  {Object.keys(draftOrderInputs).length > 0 && (
                    <div className="custom-draft-order">
                      <h3>Set Draft Position for Each Team</h3>
                      <div className="draft-order-grid">
                        {teams.map((team) => (
                          <div key={team.team_name} className="draft-order-input">
                            <label htmlFor={`order-${team.team_name}`}>{team.team_name}</label>
                            <input
                              id={`order-${team.team_name}`}
                              type="number"
                              min="1"
                              max={teams.length}
                              value={draftOrderInputs[team.team_name] || ''}
                              onChange={(e) => handleDraftOrderPositionChange(team.team_name, e.target.value)}
                              placeholder="Position"
                              className="draft-order-input-field"
                            />
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={handleSetCustomDraftOrder}
                        className="btn btn-primary btn-block"
                      >
                        ✓ Confirm Draft Order
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="draft-order-display">
                  <div className="draft-info-header">
                    <h3>Current Draft Order:</h3>
                    <span className={`draft-type-badge ${draftType}`}>
                      {draftType === 'snake' ? '🐍 Snake Draft' : '📊 Normal Draft'}
                    </span>
                  </div>
                  <ol className="draft-order-list">
                    {draftOrder.map((teamName, idx) => (
                      <li key={teamName} className={getCurrentTurnTeam() === teamName ? 'current-turn' : ''}>
                        <span className="position">{idx + 1}</span>
                        <span className="team-name">{teamName}</span>
                        {getCurrentTurnTeam() === teamName && <span className="turn-indicator">← Now Drafting</span>}
                      </li>
                    ))}
                  </ol>
                  <button 
                    onClick={handleResetDraftOrder}
                    className="btn btn-secondary"
                  >
                    🔄 Reset Draft Order
                  </button>
                </div>
              )}
            </section>

            {/* Draft Round Info */}
            <section className="draft-summary">
              <h2>📊 Draft Progress</h2>
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-label">Current Round</span>
                  <span className="stat-value">{draftRound}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Current Pick</span>
                  <span className="stat-value">{draftPick}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Picks</span>
                  <span className="stat-value">{draftPicks?.length || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Available Players</span>
                  <span className="stat-value">{filteredPlayers.length}</span>
                </div>
              </div>
            </section>

            {/* Teams Grid with Player Selection */}
            <section className="teams-draft-grid">
              <h2>🎯 Select Players for Teams</h2>
              <div className="teams-columns">
                {teams && teams.length > 0 ? (
                  teams.map((team) => {
                    const isCurrentTurn = getCurrentTurnTeam() === team.team_name;
                    const isDraftOrderActive = draftOrderSet;
                    const isDisabled = isDraftOrderActive && !isCurrentTurn;
                    
                    return (
                      <div key={team.team_name} className={`team-column ${isCurrentTurn ? 'current-turn' : ''} ${isDisabled ? 'disabled' : ''}`}>
                        <div className="team-header">
                          <h3>{team.team_name}</h3>
                          <p className="team-owner">{team.owner_name}</p>
                          {isDraftOrderActive && isCurrentTurn && (
                            <p className="draft-turn-badge">🎯 Your Turn!</p>
                          )}
                        </div>
                        <div className="team-draft-section">
                          <div className="form-group">
                            <label htmlFor={`player-${team.team_name}`}>Select Player</label>
                            <select
                              id={`player-${team.team_name}`}
                              value={teamPlayerSelections[team.team_name] || ''}
                              onChange={(e) => handleTeamPlayerSelect(team.team_name, e.target.value)}
                              className="player-dropdown"
                              disabled={isDisabled}
                            >
                              <option value="">-- Choose Player --</option>
                              {filteredPlayers.map((player) => (
                                <option
                                  key={`${player.first_name}-${player.last_name}`}
                                  value={`${player.first_name} ${player.last_name}`}
                                >
                                  {player.first_name} {player.last_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => handleSubmitDraftPickForTeam(team.team_name)}
                            className="btn btn-primary btn-block"
                            disabled={!teamPlayerSelections[team.team_name] || isDisabled}
                          >
                            Draft Pick
                          </button>
                          {isDisabled && (
                            <p className="waiting-message">⏳ Waiting for other teams...</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-data">No teams available. Create teams in Fantasy Teams manager first.</p>
                )}
              </div>
            </section>

            {/* Draft Picks History */}
            <section className="draft-picks-history">
              <h2>📋 Draft History</h2>
              {draftPicks && draftPicks.length > 0 ? (
                <div className="picks-list">
                  {draftPicks
                    .sort((a, b) => a.round - b.round || a.pick_number - b.pick_number)
                    .map((pick, idx) => (
                      <div key={idx} className="pick-item">
                        <div className="pick-info">
                          <span className="pick-number">
                            Round {pick.round}, Pick {pick.pick_number}
                          </span>
                          <span className="pick-player">{pick.player_name}</span>
                          <span className="pick-team">{pick.team_name}</span>
                        </div>
                        <button
                          onClick={() => deleteDraftPick(pick)}
                          className="btn btn-delete btn-small"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="no-data">No draft picks yet</p>
              )}
            </section>
          </>
        )}

        {!selectedSeason && (
          <div className="no-selection">
            <p>👆 Select a season above to manage the draft</p>
          </div>
        )}
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default DraftManager;
