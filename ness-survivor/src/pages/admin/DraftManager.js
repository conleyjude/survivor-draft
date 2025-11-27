/**
 * DraftManager - Manage draft picks for fantasy teams
 * Features: Track draft picks, manage draft rounds
 * Prerequisites: Fantasy teams must be created first
 */

import { useState } from 'react';
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

  // State for messages
  const [messages, setMessages] = useState([]);

  // Data fetching
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const { data: players, refetch: refetchPlayers } = useFetchData(
    () => (selectedSeason ? neo4jService.getPlayersInSeason(selectedSeason) : Promise.resolve([])),
    [selectedSeason]
  );
  const { data: teams, refetch: refetchTeams } = useFetchData(
    () => (selectedSeason ? neo4jService.getFantasyTeamsInSeason(selectedSeason) : Promise.resolve([])),
    [selectedSeason]
  );
  const { data: draftPicks, refetch: refetchDraftPicks } = useFetchData(
    () => (selectedSeason ? neo4jService.getDraftPicksForSeason(selectedSeason) : Promise.resolve([])),
    [selectedSeason]
  );

  // Mutations
  const { mutate: createDraftPick } = useMutation(
    (teamName, playerName) =>
      neo4jService.createDraftPick(
        selectedSeason,
        draftRound,
        draftPick,
        playerName,
        teamName
      ),
    () => {
      addMessage('Draft pick created successfully!', 'success');
      // Auto-increment pick/round
      const nextPick = draftPick === 10 ? 1 : draftPick + 1;
      const nextRound = draftPick === 10 ? draftRound + 1 : draftRound;
      setDraftPick(nextPick);
      setDraftRound(nextRound);
      // Clear selections
      setTeamPlayerSelections({});
      refetchDraftPicks();
      refetchPlayers();
    },
    (err) => addMessage(`Error creating draft pick: ${err.message}`, 'error')
  );

  const { mutate: deleteDraftPick } = useMutation(
    (pick) => neo4jService.deleteDraftPick(selectedSeason, pick.round, pick.pick_number),
    () => {
      addMessage('Draft pick removed successfully!', 'success');
      refetchDraftPicks();
      refetchPlayers();
    },
    (err) => addMessage(`Error removing draft pick: ${err.message}`, 'error')
  );

  // Message handling
  const addMessage = (text, type) => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  };

  // Form handlers
  const handleSeasonChange = (e) => {
    setSelectedSeason(e.target.value);
    setTeamPlayerSelections({});
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
    const playerName = teamPlayerSelections[teamName];
    if (!playerName) {
      addMessage(`Please select a player for ${teamName}`, 'error');
      return;
    }
    createDraftPick(teamName, playerName);
  };

  return (
    <div className="draft-manager">
      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
      </div>

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
                  teams.map((team) => (
                    <div key={team.team_name} className="team-column">
                      <div className="team-header">
                        <h3>{team.team_name}</h3>
                        <p className="team-owner">{team.owner_name}</p>
                      </div>
                      <div className="team-draft-section">
                        <div className="form-group">
                          <label htmlFor={`player-${team.team_name}`}>Select Player</label>
                          <select
                            id={`player-${team.team_name}`}
                            value={teamPlayerSelections[team.team_name] || ''}
                            onChange={(e) => handleTeamPlayerSelect(team.team_name, e.target.value)}
                            className="player-dropdown"
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
                          disabled={!teamPlayerSelections[team.team_name]}
                        >
                          Draft Pick
                        </button>
                      </div>
                    </div>
                  ))
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
    </div>
  );
}

export default DraftManager;
