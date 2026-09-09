/**
 * DraftManager - Manage draft picks for fantasy teams
 * Features: Track draft picks, manage draft rounds
 * Prerequisites: Fantasy teams must be created first
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { socket } from '../../services/socket';
import '../../styles/DraftManager.css';

function DraftManager() {
  // State for cascading selectors
  const [selectedSeason, setSelectedSeason] = useState('');

  // State for draft management
  const [selectedSlot, setSelectedSlot] = useState(null); // { teamName, slotIndex }

  // Which team this browser is drafting for (per-season, remembered via localStorage)
  const [myTeam, setMyTeam] = useState('');

  // Draft order inputs are local (form scratchpad); the confirmed order is shared/persisted server-side
  const [draftOrderInputs, setDraftOrderInputs] = useState({}); // Maps team_name -> draft position
  const draftType = 'snake'; // Always snake draft

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
  const { data: reservePlayers, refetch: refetchReservePlayers } = useFetchData(
    () => (selectedSeason ? neo4jService.getReservePlayers(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );
  // Shared draft state (draft order + finalized flag), persisted on the Season node
  const { data: draftState, refetch: refetchDraftState } = useFetchData(
    () => (selectedSeason ? neo4jService.getDraftState(Number(selectedSeason)) : Promise.resolve({ draft_order: [], draft_finalized: false })),
    [selectedSeason]
  );
  const draftOrder = draftState?.draft_order || [];
  const draftOrderSet = draftOrder.length > 0;
  const isDraftFinalized = draftState?.draft_finalized || false;

  // Load this browser's claimed team whenever the selected season changes
  useEffect(() => {
    if (!selectedSeason) {
      setMyTeam('');
      return;
    }
    setMyTeam(window.localStorage.getItem(`survivor-draft-team-${selectedSeason}`) || '');
  }, [selectedSeason]);

  const claimMyTeam = (teamName) => {
    window.localStorage.setItem(`survivor-draft-team-${selectedSeason}`, teamName);
    setMyTeam(teamName);
  };

  const releaseMyTeam = () => {
    window.localStorage.removeItem(`survivor-draft-team-${selectedSeason}`);
    setMyTeam('');
  };

  // Lookup table for player photos, keyed by full name (used on the draft board)
  const playersByName = (players || []).reduce((acc, player) => {
    acc[`${player.first_name} ${player.last_name}`] = player;
    return acc;
  }, {});

  // Join the shared draft room for this season and live-sync on any teammate's changes
  useEffect(() => {
    if (!selectedSeason) return undefined;

    socket.connect();
    socket.emit('join-season', selectedSeason);

    const handleDraftUpdated = () => {
      refetchDraftPicks();
      refetchDraftState();
      refetchPlayers();
      refetchReservePlayers();
    };
    socket.on('draft-updated', handleDraftUpdated);

    return () => {
      socket.emit('leave-season', selectedSeason);
      socket.off('draft-updated', handleDraftUpdated);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeason]);

  // Calculate max rounds dynamically (after data is fetched)
  const maxRounds = teams && teams.length > 0 && players 
    ? Math.floor(players.length / teams.length)
    : 0;

  // Mutations
  const { mutate: createDraftPick } = useMutation(
    ({ teamName, playerName, round, pickNumber }) =>
      neo4jService.createDraftPick(
        Number(selectedSeason),
        round,
        pickNumber,
        playerName,
        teamName
      ),
    () => {
      setSuccessMessage('Draft pick created successfully!');
      setSelectedSlot(null);
      refetchDraftPicks();
      refetchPlayers();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error creating draft pick: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: finalizeDraft } = useMutation(
    () => neo4jService.finalizeReserves(Number(selectedSeason), teams.length),
    (result) => {
      setSuccessMessage(`Draft finalized! ${result.drafted_count} players drafted, ${result.reserve_count} reserves created.`);
      refetchDraftState();
      refetchPlayers();
      refetchReservePlayers();
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    (err) => {
      setErrorMessage(`Error finalizing draft: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: saveDraftOrder } = useMutation(
    (order) => neo4jService.setDraftOrder(Number(selectedSeason), order),
    () => {
      refetchDraftState();
    },
    (err) => {
      setErrorMessage(`Error saving draft order: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: clearDraftOrder } = useMutation(
    () => neo4jService.resetDraftOrder(Number(selectedSeason)),
    () => {
      refetchDraftState();
    },
    (err) => {
      setErrorMessage(`Error resetting draft order: ${err.message}`);
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
    setSelectedSlot(null);
    setDraftOrderInputs({});
  };

  // Draft order handlers
  const handleRandomDraftOrder = () => {
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const inputs = {};
    shuffled.forEach((team, idx) => {
      inputs[team.team_name] = idx + 1;
    });
    setDraftOrderInputs(inputs);
    saveDraftOrder(shuffled.map(t => t.team_name));
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
    saveDraftOrder(ordered.map(t => t.team_name));
    setSuccessMessage('Draft order set successfully! ✓');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResetDraftOrder = () => {
    clearDraftOrder();
    setDraftOrderInputs({});
  };

  // Helper to get team's pick order in a specific round (always snake)
  const getTeamPickInRound = (teamName, round) => {
    if (!draftOrderSet || draftOrder.length === 0) return null;
    
    const numTeams = draftOrder.length;
    const teamIndex = draftOrder.indexOf(teamName);
    
    if (teamIndex === -1) return null;
    
    // Snake draft: odd rounds go 1->N, even rounds go N->1
    const isEvenRound = round % 2 === 0;
    if (isEvenRound) {
      // Even rounds: reverse order
      return numTeams - teamIndex;
    } else {
      // Odd rounds: normal order
      return teamIndex + 1;
    }
  };

  // Get team's drafted players organized by round
  const getTeamDraftSlots = (teamName) => {
    const slots = [];
    for (let round = 1; round <= maxRounds; round++) {
      const pickInRound = getTeamPickInRound(teamName, round);
      if (pickInRound === null) {
        slots.push(null);
        continue;
      }
      
      const overallPick = ((round - 1) * draftOrder.length) + pickInRound;
      const pick = draftPicks?.find(p => 
        p.team_name === teamName && p.round === round
      );
      
      slots.push({
        round,
        pickInRound,
        overallPick,
        player: pick ? pick.player_name : null,
        isFilled: !!pick
      });
    }
    return slots;
  };

  // Check if a slot can be clicked (it's the next available pick)
  const isSlotClickable = (teamName, slotIndex) => {
    if (isDraftFinalized) return false;
    if (!draftOrderSet) return false;
    if (!myTeam || teamName !== myTeam) return false;
    
    const slots = getTeamDraftSlots(teamName);
    const slot = slots[slotIndex];
    if (!slot || slot.isFilled) return false;
    
    // Find the next empty slot across all teams
    const allSlots = [];
    draftOrder.forEach(tn => {
      const teamSlots = getTeamDraftSlots(tn);
      teamSlots.forEach((s, idx) => {
        if (s) {
          allSlots.push({ ...s, teamName: tn, slotIndex: idx });
        }
      });
    });
    
    // Sort by overall pick number
    allSlots.sort((a, b) => a.overallPick - b.overallPick);
    
    // Find first unfilled slot
    const nextSlot = allSlots.find(s => !s.isFilled);
    
    return nextSlot && nextSlot.teamName === teamName && nextSlot.slotIndex === slotIndex;
  };

  const handleSlotClick = (teamName, slotIndex) => {
    if (!isSlotClickable(teamName, slotIndex)) return;
    setSelectedSlot({ teamName, slotIndex });
  };

  const handlePlayerSelect = (playerName) => {
    if (!selectedSlot) return;
    
    const { teamName, slotIndex } = selectedSlot;
    const slots = getTeamDraftSlots(teamName);
    const slot = slots[slotIndex];
    
    if (!slot) return;
    
    createDraftPick({
      teamName,
      playerName,
      round: slot.round,
      pickNumber: slot.overallPick
    });
  };

  // Filtering
  const filteredPlayers = players?.filter((player) =>
    !draftPicks?.some((dp) => dp.player_name === `${player.first_name} ${player.last_name}`)
  ) || [];

  const handleFinalizeDraft = () => {
    // Check if we have complete rounds
    const totalPicks = draftPicks?.length || 0;
    const numTeams = teams.length;
    const completeRounds = Math.floor(totalPicks / numTeams);
    const picksInCompleteRounds = completeRounds * numTeams;

    if (totalPicks !== picksInCompleteRounds) {
      const remaining = numTeams - (totalPicks % numTeams);
      setErrorMessage(`You must complete full draft rounds. Complete ${remaining} more pick(s) to finish the current round.`);
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    if (totalPicks === 0) {
      setErrorMessage('No draft picks made yet. Cannot finalize empty draft.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    finalizeDraft();
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
        <h1>Draft Management</h1>
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
            {/* Draft Order Setup */}
            <section className="draft-order-setup">
              <h2>🐍 Snake Draft Setup</h2>
              <p className="section-description">
                This will be a snake draft with {maxRounds} rounds ({maxRounds * teams.length} total picks). 
                Odd rounds pick left to right, even rounds pick right to left.
              </p>
              
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
                  <p className="info-text">
                    Draft order has been set. Teams are arranged left to right below.
                  </p>
                  <button 
                    onClick={handleResetDraftOrder}
                    className="btn btn-secondary"
                  >
                    🔄 Reset Draft Order
                  </button>
                </div>
              )}
            </section>

            {/* Team Claim - pick which team you're drafting for */}
            {draftOrderSet && !isDraftFinalized && (
              <section className="team-claim-section">
                {myTeam ? (
                  <p className="claim-banner">
                    🙋 Drafting as <strong>{myTeam}</strong>.{' '}
                    <button className="link-button" onClick={releaseMyTeam}>Change team</button>
                  </p>
                ) : (
                  <div className="team-claim-picker">
                    <h2>🙋 Who are you drafting for?</h2>
                    <p className="section-description">
                      Choose your team below. You'll only be able to make picks for that team.
                    </p>
                    <div className="team-claim-grid">
                      {teams.map((team) => (
                        <button
                          key={team.team_name}
                          className="team-claim-option"
                          onClick={() => claimMyTeam(team.team_name)}
                        >
                          <span className="team-claim-name">{team.team_name}</span>
                          <span className="team-claim-owner">{team.owners?.join(', ') || 'No owner'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Draft Progress */}
            {draftOrderSet && (
              <section className="draft-summary">
                <h2>📊 Draft Progress</h2>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total Picks</span>
                    <span className="stat-value">{draftPicks?.length || 0} / {maxRounds * teams.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available Players</span>
                    <span className="stat-value">{filteredPlayers.length}</span>
                  </div>
                </div>
                
                {!isDraftFinalized && draftPicks && draftPicks.length > 0 && (
                  <div className="finalize-draft-section">
                    <button 
                      onClick={handleFinalizeDraft}
                      className="btn btn-primary btn-large"
                    >
                      🏁 Finalize Draft & Create Reserves
                    </button>
                    <p className="info-text">
                      Click this button after completing full draft rounds. Remaining players will become reserves.
                    </p>
                  </div>
                )}

                {isDraftFinalized && (
                  <div className="draft-finalized-banner">
                    ✓ Draft Finalized - Reserves Created
                  </div>
                )}
              </section>
            )}

            {/* Reserve Players Section */}
            {isDraftFinalized && reservePlayers && reservePlayers.length > 0 && (
              <section className="reserve-players-section">
                <h2>🔄 Reserve Players</h2>
                <p className="section-description">
                  These players were not drafted and are available as reserves when a team's player is voted out.
                </p>
                <div className="reserve-players-grid">
                  {reservePlayers.map((player) => (
                    <div key={`${player.first_name}-${player.last_name}`} className="reserve-player-card">
                      {player.photo_url && (
                        <img
                          src={player.photo_url}
                          alt={`${player.first_name} ${player.last_name}`}
                          className="reserve-player-photo"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span className="player-name">{player.first_name} {player.last_name}</span>
                      <span className="player-tribe">{player.tribe_name || 'No tribe'}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Teams Draft Board with Slots */}
            {draftOrderSet && (
              <section className="teams-draft-board">
                <h2>🎯 Draft Board</h2>
                <p className="section-description">
                  Click on an empty slot to select a player for that pick.
                </p>
                
                <div className="draft-board-columns">
                  {draftOrder.map((teamName) => {
                    const team = teams.find(t => t.team_name === teamName);
                    const slots = getTeamDraftSlots(teamName);
                    
                    return (
                      <div key={teamName} className={`draft-column ${myTeam === teamName ? 'my-team' : ''} ${myTeam && myTeam !== teamName ? 'not-my-team' : ''}`}>
                        <div className="draft-column-header">
                          <h3>{teamName}</h3>
                          <p className="team-owner">{team?.owners?.join(', ') || 'No owner'}</p>
                        </div>
                        
                        <div className="draft-slots">
                          {slots.map((slot, idx) => {
                            if (!slot) return null;
                            
                            const isClickable = isSlotClickable(teamName, idx);
                            const isSelected = selectedSlot?.teamName === teamName && selectedSlot?.slotIndex === idx;
                            const draftedPlayer = slot.isFilled ? playersByName[slot.player] : null;
                            
                            return (
                              <div
                                key={idx}
                                className={`draft-slot ${slot.isFilled ? 'filled' : 'empty'} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSlotClick(teamName, idx)}
                              >
                                <div className="slot-number">
                                  <span className="round">R{slot.round}</span>
                                  <span className="pick">#{slot.overallPick}</span>
                                </div>
                                <div className="slot-content">
                                  {slot.isFilled ? (
                                    <div className="slot-player">
                                      {draftedPlayer?.photo_url && (
                                        <img
                                          src={draftedPlayer.photo_url}
                                          alt={slot.player}
                                          className="slot-player-photo"
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      )}
                                      <span className="player-name">{slot.player}</span>
                                    </div>
                                  ) : isClickable ? (
                                    <span className="placeholder">Click to select</span>
                                  ) : (
                                    <span className="placeholder">—</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Player Selection Modal */}
            {selectedSlot && (
              <div className="player-selection-modal" onClick={() => setSelectedSlot(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Select Player</h3>
                    <button className="close-btn" onClick={() => setSelectedSlot(null)}>×</button>
                  </div>
                  <div className="modal-body">
                    <p className="modal-info">
                      Selecting for <strong>{selectedSlot.teamName}</strong>
                    </p>
                    <div className="player-list">
                      {filteredPlayers.map((player) => (
                        <div
                          key={`${player.first_name}-${player.last_name}`}
                          className="player-item"
                          onClick={() => handlePlayerSelect(`${player.first_name} ${player.last_name}`)}
                        >
                          {player.photo_url && (
                            <img
                              src={player.photo_url}
                              alt={`${player.first_name} ${player.last_name}`}
                              className="player-photo"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div className="player-text">
                            <span className="player-name">{player.first_name} {player.last_name}</span>
                            <span className="player-info">{player.archetype} • {player.tribe_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
