/**
 * FantasyTeamManager - Manage fantasy teams for a season
 * Features: Create/Edit/Delete teams, manage rosters
 */

import { useState } from 'react';
import { useFetchData, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/DraftManager.css';

function FantasyTeamManager() {
  // State for cascading selectors
  const [selectedSeason, setSelectedSeason] = useState('');

  // State for form management
  const [formMode, setFormMode] = useState('create'); // create, edit
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [ownerNames, setOwnerNames] = useState('');
  const [teamSearchTerm, setTeamSearchTerm] = useState('');

  // State for messages
  const [messages, setMessages] = useState([]);

  // Data fetching
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const { data: teams, refetch: refetchTeams } = useFetchData(
    () => (selectedSeason ? neo4jService.getFantasyTeamsInSeason(selectedSeason) : Promise.resolve([])),
    [selectedSeason]
  );

  // Mutations
  const { mutate: createTeam, isLoading: isCreating } = useMutation(
    (name, owners, season) =>
      neo4jService.createFantasyTeam(name, owners, season),
    () => {
      addMessage('Fantasy team created successfully!', 'success');
      resetTeamForm();
      refetchTeams();
    },
    (err) => addMessage(`Error creating team: ${err.message}`, 'error')
  );

  const { mutate: updateTeam, isLoading: isUpdating } = useMutation(
    (name, owners) => neo4jService.updateFantasyTeam(name, owners),
    () => {
      addMessage('Fantasy team updated successfully!', 'success');
      resetTeamForm();
      refetchTeams();
    },
    (err) => addMessage(`Error updating team: ${err.message}`, 'error')
  );

  const { mutate: deleteTeam, isLoading: isDeleting } = useMutation(
    (name) => neo4jService.deleteFantasyTeam(name),
    () => {
      addMessage('Fantasy team deleted successfully!', 'success');
      resetTeamForm();
      refetchTeams();
    },
    (err) => addMessage(`Error deleting team: ${err.message}`, 'error')
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

  const handleEditTeam = (team) => {
    setFormMode('edit');
    setEditingTeam(team);
    setTeamName(team.team_name);
    setOwnerNames((team.owners || []).join(', '));
  };

  const handleSubmitTeam = (e) => {
    e.preventDefault();

    // Validation
    if (!teamName.trim()) {
      addMessage('Team name is required', 'error');
      return;
    }
    if (!ownerNames.trim()) {
      addMessage('Owners are required', 'error');
      return;
    }
    if (teamName.length < 2 || teamName.length > 100) {
      addMessage('Team name must be between 2 and 100 characters', 'error');
      return;
    }

    // Parse owners from comma-separated string
    const owners = ownerNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (owners.length === 0) {
      addMessage('Please enter at least one owner name', 'error');
      return;
    }

    if (owners.some(owner => owner.length < 1 || owner.length > 100)) {
      addMessage('Each owner name must be 1-100 characters', 'error');
      return;
    }

    if (formMode === 'create') {
      createTeam(teamName, owners, selectedSeason);
    } else {
      updateTeam(editingTeam.team_name, owners);
    }
  };

  const handleDeleteTeam = () => {
    if (window.confirm(`Are you sure you want to delete "${editingTeam.team_name}"?`)) {
      deleteTeam(editingTeam.team_name);
    }
  };

  const resetTeamForm = () => {
    setFormMode('create');
    setEditingTeam(null);
    setTeamName('');
    setOwnerNames('');
  };

  // // Filtering
  // const filteredPlayers = players?.filter((player) =>
  //   playerSearchTerm === ''
  //     ? true
  //     : `${player.first_name} ${player.last_name}`
  //         .toLowerCase()
  //         .includes(playerSearchTerm.toLowerCase()) ||
  //       (player.occupation || '').toLowerCase().includes(playerSearchTerm.toLowerCase())
  // ) || [];

  const filteredTeams = teams?.filter((team) => {
    const teamString = `${team.team_name} ${(team.owners || []).join(' ')}`.toLowerCase();
    return teamString.includes(teamSearchTerm.toLowerCase());
  }) || [];

  const isFormValid =
    teamName.trim() &&
    ownerNames.trim() &&
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
        <h1>👥 Fantasy Teams</h1>
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
            {/* Team Management */}
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
                    <label htmlFor="owner_names">Owners (comma-separated)</label>
                    <input
                      id="owner_names"
                      type="text"
                      value={ownerNames}
                      onChange={(e) => setOwnerNames(e.target.value)}
                      placeholder="e.g., John Doe, Jane Smith"
                      className={ownerNames && ownerNames.split(',').some(o => o.trim().length === 0) ? 'input-error' : ''}
                    />
                    {ownerNames && ownerNames.split(',').some(o => o.trim().length === 0) && (
                      <span className="error-message">Please enter valid owner names</span>
                    )}
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
                          <div className="team-owner">� {(team.owners || []).join(', ')}</div>
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
          </>
        )}

        {!selectedSeason && (
          <div className="no-selection">
            <p>👆 Select a season above to manage fantasy teams</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FantasyTeamManager;
