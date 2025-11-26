/**
 * DraftManager - Comprehensive draft and fantasy team management
 * Features: Create/Edit/Delete teams, manage rosters, track draft picks
 */

import { useState } from 'react';
import { useFetchData, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/DraftManager.css';

function DraftManager() {
  // State for cascading selectors
  const [selectedSeason, setSelectedSeason] = useState('');

  // State for form management
  const [formMode, setFormMode] = useState('create'); // create, edit
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerSearchTerm, setPlayerSearchTerm] = useState('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');

  // State for draft management
  const [draftRound, setDraftRound] = useState(1);
  const [draftPick, setDraftPick] = useState(1);
  const [selectedPlayerForDraft, setSelectedPlayerForDraft] = useState('');

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
  const { mutate: createTeam } = useMutation(
    () =>
      neo4jService.createFantasyTeam(teamName, ownerName, selectedPlayers, selectedSeason),
    () => {
      addMessage('Fantasy team created successfully!', 'success');
      resetTeamForm();
      refetchTeams();
    },
    (err) => addMessage(`Error creating team: ${err.message}`, 'error')
  );

  const { mutate: updateTeam } = useMutation(
    () => neo4jService.updateFantasyTeam(editingTeam.team_name, ownerName, selectedPlayers),
    () => {
      addMessage('Fantasy team updated successfully!', 'success');
      resetTeamForm();
      refetchTeams();
    },
    (err) => addMessage(`Error updating team: ${err.message}`, 'error')
  );

  const { mutate: deleteTeam } = useMutation(
    () => neo4jService.deleteFantasyTeam(editingTeam.team_name),
    () => {
      addMessage('Fantasy team deleted successfully!', 'success');
      resetTeamForm();
      refetchTeams();
    },
    (err) => addMessage(`Error deleting team: ${err.message}`, 'error')
  );

  const { mutate: createDraftPick } = useMutation(
    () =>
      neo4jService.createDraftPick(
        selectedSeason,
        draftRound,
        draftPick,
        selectedPlayerForDraft,
        editingTeam?.team_name || teamName
      ),
    () => {
      addMessage('Draft pick created successfully!', 'success');
      setDraftRound(draftRound + (draftPick === 10 ? 1 : 0));
      setDraftPick(draftPick === 10 ? 1 : draftPick + 1);
      setSelectedPlayerForDraft('');
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
    resetTeamForm();
  };

  const handlePlayerToggle = (player) => {
    setSelectedPlayers((prev) =>
      prev.find((p) => p.first_name === player.first_name && p.last_name === player.last_name)
        ? prev.filter((p) => !(p.first_name === player.first_name && p.last_name === player.last_name))
        : [...prev, player]
    );
  };

  const handleEditTeam = (team) => {
    setFormMode('edit');
    setEditingTeam(team);
    setTeamName(team.team_name);
    setOwnerName(team.owner_name || '');
    setSelectedPlayers(team.roster || []);
  };

  const handleSubmitTeam = (e) => {
    e.preventDefault();

    // Validation
    if (!teamName.trim()) {
      addMessage('Team name is required', 'error');
      return;
    }
    if (!ownerName.trim()) {
      addMessage('Owner name is required', 'error');
      return;
    }
    if (teamName.length < 2 || teamName.length > 100) {
      addMessage('Team name must be between 2 and 100 characters', 'error');
      return;
    }
    if (ownerName.length < 2 || ownerName.length > 100) {
      addMessage('Owner name must be between 2 and 100 characters', 'error');
      return;
    }

    if (formMode === 'create') {
      createTeam();
    } else {
      updateTeam();
    }
  };

  const handleDeleteTeam = () => {
    if (window.confirm(`Are you sure you want to delete "${editingTeam.team_name}"?`)) {
      deleteTeam();
    }
  };

  const handleSubmitDraftPick = (e) => {
    e.preventDefault();

    if (!selectedPlayerForDraft) {
      addMessage('Please select a player', 'error');
      return;
    }

    createDraftPick();
  };

  const resetTeamForm = () => {
    setFormMode('create');
    setEditingTeam(null);
    setTeamName('');
    setOwnerName('');
    setSelectedPlayers([]);
  };

  // Filtering
  const filteredPlayers = players?.filter((player) =>
    playerSearchTerm === ''
      ? true
      : `${player.first_name} ${player.last_name}`
          .toLowerCase()
          .includes(playerSearchTerm.toLowerCase()) ||
        (player.occupation || '').toLowerCase().includes(playerSearchTerm.toLowerCase())
  ) || [];

  const filteredTeams = teams?.filter((team) =>
    `${team.team_name} ${team.owner_name}`.toLowerCase().includes(teamSearchTerm.toLowerCase())
  ) || [];

  const availablePlayers = filteredPlayers.filter(
    (p) =>
      !draftPicks?.some((dp) => dp.player_name === `${p.first_name} ${p.last_name}`) &&
      !selectedPlayers.some((sp) => sp.first_name === p.first_name && sp.last_name === p.last_name)
  );

  const isFormValid =
    teamName.trim() &&
    ownerName.trim() &&
    selectedPlayers.length > 0 &&
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
        <h1>📋 Draft & Fantasy Teams</h1>
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
            {/* Left Column - Team Management */}
            <div className="column">
              <section className="create-section">
                <h2>
                  {formMode === 'create' ? '➕ Create Fantasy Team' : '✏️ Edit Fantasy Team'}
                </h2>
                <form onSubmit={handleSubmitTeam} className="form">
                  <div className="form-group">
                    <label htmlFor="team_name">Team Name</label>
                    <input
                      id="team_name"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g., The Champions"
                      disabled={formMode === 'edit'}
                      className={teamName.length < 2 && teamName ? 'input-error' : ''}
                    />
                    {teamName && (teamName.length < 2 || teamName.length > 100) && (
                      <span className="error-message">Team name must be 2-100 characters</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="owner_name">Owner Name</label>
                    <input
                      id="owner_name"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className={ownerName.length < 2 && ownerName ? 'input-error' : ''}
                    />
                    {ownerName && (ownerName.length < 2 || ownerName.length > 100) && (
                      <span className="error-message">Owner name must be 2-100 characters</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      Select Players for Roster ({selectedPlayers.length} selected)
                    </label>
                    <div className="player-search-container">
                      <input
                        type="text"
                        placeholder="Search players..."
                        value={playerSearchTerm}
                        onChange={(e) => setPlayerSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <div className="player-grid">
                      {filteredPlayers.map((player) => (
                        <label key={`${player.first_name}-${player.last_name}`} className="player-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedPlayers.some(
                              (p) =>
                                p.first_name === player.first_name &&
                                p.last_name === player.last_name
                            )}
                            onChange={() => handlePlayerToggle(player)}
                          />
                          <span>
                            {player.first_name} {player.last_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!isFormValid}
                    >
                      {formMode === 'create' ? 'Create Team' : 'Update Team'}
                    </button>
                    {formMode === 'edit' && (
                      <>
                        <button
                          type="button"
                          onClick={resetTeamForm}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteTeam}
                          className="btn btn-delete btn-small"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </section>

              {/* Teams List */}
              <section className="teams-list-section">
                <h2>Fantasy Teams ({filteredTeams.length})</h2>
                <div className="team-search-container">
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                {filteredTeams.length > 0 ? (
                  <div className="teams-list">
                    {filteredTeams.map((team) => (
                      <div key={team.team_name} className="team-item">
                        <div className="team-content">
                          <div className="team-name">{team.team_name}</div>
                          <div className="team-owner">👤 {team.owner_name}</div>
                          <div className="team-roster">
                            Roster: {team.roster?.length || 0} players
                          </div>
                        </div>
                        <div className="team-actions">
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="btn btn-edit"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">
                    {selectedSeason ? 'No teams created yet' : 'Select a season first'}
                  </p>
                )}
              </section>
            </div>

            {/* Right Column - Draft Management */}
            <div className="column">
              <section className="draft-section">
                <h2>🎯 Draft Picks</h2>
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
                    <label htmlFor="player_select">Select Player</label>
                    <select
                      id="player_select"
                      value={selectedPlayerForDraft}
                      onChange={(e) => setSelectedPlayerForDraft(e.target.value)}
                    >
                      <option value="">-- Choose Available Player --</option>
                      {availablePlayers.map((player) => (
                        <option
                          key={`${player.first_name}-${player.last_name}`}
                          value={`${player.first_name} ${player.last_name}`}
                        >
                          {player.first_name} {player.last_name} ({player.placement || 'TBD'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={!selectedPlayerForDraft}>
                    Add Pick
                  </button>
                </form>

                {/* Draft Picks History */}
                <div className="draft-picks-history">
                  <h3>Draft History</h3>
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
                </div>
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
                    <span className="stat-value">{availablePlayers.length}</span>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {!selectedSeason && (
          <div className="no-selection">
            <p>👆 Select a season above to manage draft and fantasy teams</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DraftManager;
