/**
 * FantasyTeamManager - Manage fantasy teams for a season
 * Features: Create/Edit/Delete teams, manage rosters
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useMutation } from '../../hooks/useNeo4j';
import { useForm } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { fantasyTeamValidation, hasErrors } from '../../utils/validation';
import '../../styles/DraftManager.css';

function FantasyTeamManager() {
  // State for cascading selectors
  const [selectedSeason, setSelectedSeason] = useState('');

  // State for form management
  const [editingTeam, setEditingTeam] = useState(null);

  // State for messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State for search
  const [teamSearchTerm, setTeamSearchTerm] = useState('');

  // Data fetching
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const { data: teams, refetch: refetchTeams } = useFetchData(
    () => (selectedSeason ? neo4jService.getFantasyTeamsInSeason(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );

  // Form management
  const { values, errors, handleChange, handleSubmit, resetForm, setValues } = useForm(
    { team_name: '', owner_names: '' },
    async (formValues) => {
      if (!selectedSeason) {
        setErrorMessage('Please select a season first');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const owners = formValues.owner_names
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      console.log('Form submission - team:', formValues.team_name, 'owners:', owners, 'season:', selectedSeason, 'season type:', typeof selectedSeason);

      try {
        if (editingTeam) {
          console.log('Updating team:', editingTeam.team_name);
          await updateTeamMutation(editingTeam.team_name, owners);
        } else {
          console.log('Creating new team');
          await createTeamMutation(formValues.team_name, owners, Number(selectedSeason));
        }
      } catch (err) {
        console.error('Mutation error:', err);
        // Error handling is done in mutation callbacks
      }
    },
    fantasyTeamValidation
  );

  // Mutations
  const { mutate: createTeamMutation, isLoading: isCreating } = useMutation(
    (name, owners, season) =>
      neo4jService.createFantasyTeam(name, owners, season),
    () => {
      setSuccessMessage('Fantasy team created successfully!');
      resetForm();
      refetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      console.error('Error creating team:', err);
      setErrorMessage(`Error creating team: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: updateTeamMutation, isLoading: isUpdating } = useMutation(
    (name, owners) => neo4jService.updateFantasyTeam(name, owners),
    () => {
      setSuccessMessage('Fantasy team updated successfully!');
      setEditingTeam(null);
      resetForm();
      refetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error updating team: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: deleteTeamMutation, isLoading: isDeleting } = useMutation(
    (name) => neo4jService.deleteFantasyTeam(name),
    () => {
      setSuccessMessage('Fantasy team deleted successfully!');
      setEditingTeam(null);
      resetForm();
      refetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Error deleting team: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  // Form handlers
  const handleSeasonChange = (e) => {
    setSelectedSeason(e.target.value);
    setEditingTeam(null);
    resetForm();
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setValues({
      team_name: team.team_name,
      owner_names: (team.owners || []).join(', '),
    });
  };

  const handleDeleteTeam = () => {
    if (window.confirm(`Are you sure you want to delete "${editingTeam.team_name}"? This action cannot be undone.`)) {
      deleteTeamMutation(editingTeam.team_name);
    }
  };

  const filteredTeams = teams?.filter((team) => {
    const teamString = `${team.team_name} ${(team.owners || []).join(' ')}`.toLowerCase();
    return teamString.includes(teamSearchTerm.toLowerCase());
  }) || [];

  const formHasErrors = hasErrors(errors);

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
                  {editingTeam ? '✏️ Edit Fantasy Team' : '➕ Create Fantasy Team'}
                </h2>
                <form onSubmit={handleSubmit} className="form">
                  <div className="form-group">
                    <label htmlFor="team_name">Team Name *</label>
                    <input
                      id="team_name"
                      name="team_name"
                      type="text"
                      value={values.team_name}
                      onChange={handleChange}
                      placeholder="e.g., The Champions"
                      disabled={editingTeam !== null}
                      className={errors.team_name ? 'input-error' : ''}
                    />
                    {errors.team_name && (
                      <span className="error-message">{errors.team_name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="owner_names">Owners (comma-separated) *</label>
                    <input
                      id="owner_names"
                      name="owner_names"
                      type="text"
                      value={values.owner_names}
                      onChange={handleChange}
                      placeholder="e.g., John Doe, Jane Smith"
                      className={errors.owner_names ? 'input-error' : ''}
                    />
                    {errors.owner_names && (
                      <span className="error-message">{errors.owner_names}</span>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={formHasErrors || isCreating || isUpdating}
                    >
                      {isCreating || isUpdating ? (
                        <>⏳ {editingTeam ? 'Updating...' : 'Creating...'}</>
                      ) : (
                        editingTeam ? '💾 Update Team' : '➕ Create Team'
                      )}
                    </button>
                    {editingTeam && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingTeam(null);
                            resetForm();
                          }}
                          disabled={isUpdating}
                        >
                          ✕ Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-delete"
                          onClick={handleDeleteTeam}
                          disabled={isDeleting}
                          title="Delete team"
                        >
                          🗑️ Delete
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

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default FantasyTeamManager;
