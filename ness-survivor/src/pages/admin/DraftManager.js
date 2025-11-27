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
  const [selectedPlayerForDraft, setSelectedPlayerForDraft] = useState('');
  const [selectedTeamForPick, setSelectedTeamForPick] = useState('');

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
    () =>
      neo4jService.createDraftPick(
        selectedSeason,
        draftRound,
        draftPick,
        selectedPlayerForDraft,
        selectedTeamForPick
      ),
    () => {
      addMessage('Draft pick created successfully!', 'success');
      setDraftRound(draftRound + (draftPick === 10 ? 1 : 0));
      setDraftPick(draftPick === 10 ? 1 : draftPick + 1);
      setSelectedPlayerForDraft('');
      setSelectedTeamForPick('');
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
    setSelectedTeamForPick('');
    setSelectedPlayerForDraft('');
  };

  const handleSubmitDraftPick = (e) => {
    e.preventDefault();

    if (!selectedPlayerForDraft) {
      addMessage('Please select a player', 'error');
      return;
    }

    if (!selectedTeamForPick) {
      addMessage('Please select a team', 'error');
      return;
    }

    createDraftPick();
  };

  const resetTeamForm = () => {
    // Not used in draft-only mode
  };

  // Filtering
  const filteredPlayers = players?.filter((player) =>
    !draftPicks?.some((dp) => dp.player_name === `${player.first_name} ${player.last_name}`)
  ) || [];

  const isFormValid =
    selectedPlayerForDraft &&
    selectedTeamForPick &&
    selectedSeason;

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
            {/* Draft Management */}
            <div className="column">
              <section className="draft-section">
                <h2>🎯 Add Draft Pick</h2>
                <form onSubmit={handleSubmitDraftPick} className="form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="draft_round">Round</label>
                      <input
                        id="draft_round"
                        type="number"
                        value={draftRound}
                        onChange={(e) => setDraftRound(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="draft_pick">Pick</label>
                      <input
                        id="draft_pick"
                        type="number"
                        value={draftPick}
                        onChange={(e) => setDraftPick(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="team_select">Select Team</label>
                    <select
                      id="team_select"
                      value={selectedTeamForPick}
                      onChange={(e) => setSelectedTeamForPick(e.target.value)}
                    >
                      <option value="">-- Choose Team --</option>
                      {teams?.map((team) => (
                        <option key={team.team_name} value={team.team_name}>
                          {team.team_name} ({team.owner_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="player_select">Select Player</label>
                    <select
                      id="player_select"
                      value={selectedPlayerForDraft}
                      onChange={(e) => setSelectedPlayerForDraft(e.target.value)}
                    >
                      <option value="">-- Choose Available Player --</option>
                      {filteredPlayers.map((player) => (
                        <option
                          key={`${player.first_name}-${player.last_name}`}
                          value={`${player.first_name} ${player.last_name}`}
                        >
                          {player.first_name} {player.last_name} ({player.placement || 'TBD'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={!isFormValid}>
                    Add Pick
                  </button>
                </form>
              </section>

              {/* Draft Picks History */}
              <section className="draft-picks-history">
                <h2>Draft History</h2>
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

              {/* Draft Summary */}
              <section className="draft-summary">
                <h2>📊 Draft Summary</h2>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Total Picks</span>
                    <span className="stat-value">{draftPicks?.length || 0}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Current Round</span>
                    <span className="stat-value">{draftRound}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Players Drafted</span>
                    <span className="stat-value">
                      {draftPicks?.length || 0} / {players?.length || 0}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Available Players</span>
                    <span className="stat-value">{filteredPlayers.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Teams</span>
                    <span className="stat-value">{teams?.length || 0}</span>
                  </div>
                </div>
              </section>
            </div>
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
