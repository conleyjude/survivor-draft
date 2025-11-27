/**
 * AllianceManager - Create, read, update, and delete alliances
 * Comprehensive CRUD interface with multi-select member picker
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { allianceValidation, hasErrors } from '../../utils/validation';
import '../../styles/AllianceManager.css';

function AllianceManager() {
  const { data: seasons, loading: seasonsLoading } = useFetchData(
    () => neo4jService.getAllSeasons(),
    []
  );

  const [selectedSeason, setSelectedSeason] = useState(null);
  const [playersInSeason, setPlayersInSeason] = useState([]);
  const [alliances, setAlliances] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingAlliances, setLoadingAlliances] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load players and alliances when season changes
  const handleSeasonChange = (seasonNum) => {
    setSelectedSeason(seasonNum);
    setEditingId(null);

    if (seasonNum) {
      setLoadingPlayers(true);
      setLoadingAlliances(true);

      Promise.all([
        neo4jService.getPlayersInSeason(seasonNum),
        neo4jService.getAlliancesInSeason(seasonNum)
      ])
        .then(([players, alliances]) => {
          setPlayersInSeason(players);
          setAlliances(alliances);
        })
        .catch(err => {
          setErrorMessage(`Failed to load data: ${err.message}`);
          setTimeout(() => setErrorMessage(''), 3000);
        })
        .finally(() => {
          setLoadingPlayers(false);
          setLoadingAlliances(false);
        });
    } else {
      setPlayersInSeason([]);
      setAlliances([]);
    }
  };

  const { mutate: createAlliance, isLoading: isCreating } = useMutation(
    (seasonNumber, allianceName, formationEpisode, dissolvedEpisode, size, notes) =>
      neo4jService.createAlliance(seasonNumber, allianceName, formationEpisode, dissolvedEpisode, size, notes),
    () => {
      setSuccessMessage('Alliance created successfully!');
      if (selectedSeason) {
        handleSeasonChange(selectedSeason);
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to create alliance: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: updateAlliance, isLoading: isUpdating } = useMutation(
    (allianceName, dissolvedEpisode, notes) =>
      neo4jService.updateAlliance(allianceName, dissolvedEpisode, notes),
    () => {
      setSuccessMessage('Alliance updated successfully!');
      if (selectedSeason) {
        handleSeasonChange(selectedSeason);
      }
      resetForm();
      setEditingId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to update alliance: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: deleteAlliance, isLoading: isDeleting } = useMutation(
    (allianceName) =>
      neo4jService.deleteAlliance(allianceName),
    () => {
      setSuccessMessage('Alliance deleted successfully!');
      if (selectedSeason) {
        handleSeasonChange(selectedSeason);
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to delete alliance: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { values, errors, handleChange, handleSubmit, resetForm, setValues } = useForm(
    { alliance_name: '', formation_episode: '', dissolved_episode: '', size: '', notes: '' },
    async (formValues) => {
      if (!selectedSeason) {
        setErrorMessage('Please select a season first');
        return;
      }

      if (editingId) {
        await updateAlliance(
          editingId.alliance_name,
          formValues.dissolved_episode ? Number(formValues.dissolved_episode) : null,
          formValues.notes
        );
      } else {
        await createAlliance(
          selectedSeason,
          formValues.alliance_name,
          Number(formValues.formation_episode),
          formValues.dissolved_episode ? Number(formValues.dissolved_episode) : null,
          Number(formValues.size),
          formValues.notes
        );
      }
    },
    allianceValidation
  );

  const handleEdit = (alliance) => {
    setEditingId(alliance);
    setValues({
      alliance_name: alliance.alliance_name,
      formation_episode: alliance.formation_episode || '',
      dissolved_episode: alliance.dissolved_episode || '',
      size: alliance.size || '',
      notes: alliance.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (allianceName) => {
    if (window.confirm(`Are you sure you want to delete the ${allianceName} alliance? This action cannot be undone.`)) {
      deleteAlliance(allianceName);
    }
  };

  // Filter alliances based on search term
  const filteredAlliances = alliances?.filter(alliance =>
    alliance.alliance_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Check if form has errors - don't validate alliance_name when editing
  const relevantErrors = editingId 
    ? Object.fromEntries(Object.entries(errors).filter(([key]) => key !== 'alliance_name'))
    : errors;
  
  const formHasErrors = hasErrors(relevantErrors);

  return (
    <div className="alliance-manager">
      <div className="manager-header">
        <h1>🤝 Manage Alliances</h1>
        <p className="header-subtitle">Create, edit, and manage player alliances</p>
      </div>

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

      <div className="manager-content">
        {/* Create/Edit Form */}
        <section className="create-section">
          <h2>{editingId ? `Edit Alliance: ${editingId}` : 'Create New Alliance'}</h2>

          {/* Season Selection */}
          <div className="form-group">
            <label htmlFor="season_select">Select Season *</label>
            <select
              id="season_select"
              value={selectedSeason || ''}
              onChange={(e) => handleSeasonChange(Number(e.target.value) || null)}
              disabled={seasonsLoading}
              className={!selectedSeason && 'input-error'}
            >
              <option value="">-- Choose Season --</option>
              {seasons?.map((season) => (
                <option key={season.season_number} value={season.season_number}>
                  Season {season.season_number} ({season.year})
                </option>
              ))}
            </select>
            {!selectedSeason && <span className="error-message">Please select a season</span>}
          </div>

          {selectedSeason && (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="alliance_name">Alliance Name *</label>
                <input
                  id="alliance_name"
                  name="alliance_name"
                  type="text"
                  value={values.alliance_name}
                  onChange={handleChange}
                  placeholder="e.g., The Poker Alliance"
                  disabled={editingId !== null}
                  className={errors.alliance_name ? 'input-error' : ''}
                />
                {errors.alliance_name && <span className="error-message">{errors.alliance_name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="formation_episode">Formation Episode *</label>
                  <input
                    id="formation_episode"
                    name="formation_episode"
                    type="number"
                    value={values.formation_episode}
                    onChange={handleChange}
                    placeholder="e.g., 1"
                    className={errors.formation_episode ? 'input-error' : ''}
                  />
                  {errors.formation_episode && <span className="error-message">{errors.formation_episode}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="dissolved_episode">Dissolved Episode</label>
                  <input
                    id="dissolved_episode"
                    name="dissolved_episode"
                    type="number"
                    value={values.dissolved_episode}
                    onChange={handleChange}
                    placeholder="e.g., 8"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="size">Alliance Size *</label>
                <input
                  id="size"
                  name="size"
                  type="number"
                  value={values.size}
                  onChange={handleChange}
                  placeholder="e.g., 4"
                  className={errors.size ? 'input-error' : ''}
                />
                {errors.size && <span className="error-message">{errors.size}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={values.notes}
                  onChange={handleChange}
                  placeholder="Key events, strategies, etc."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={formHasErrors || isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>⏳ {editingId ? 'Updating...' : 'Creating...'}</>
                  ) : (
                    editingId ? '💾 Update Alliance' : '➕ Create Alliance'
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </section>

        {/* Alliances List */}
        {selectedSeason && (
          <section className="list-section">
            <div className="list-header">
              <h2>Alliances in Season {selectedSeason} ({filteredAlliances.length})</h2>
              <input
                type="text"
                placeholder="Search alliances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loadingAlliances ? (
              <div className="loading">⏳ Loading alliances...</div>
            ) : filteredAlliances.length > 0 ? (
              <div className="alliances-list">
                {filteredAlliances.map((alliance) => (
                  <div key={alliance.alliance_name} className="alliance-item">
                    <div className="alliance-content">
                      <div className="alliance-header">
                        <h3>{alliance.alliance_name}</h3>
                        <span className={`status-badge status-${alliance.status || 'active'}`}>
                          {alliance.status || 'Active'}
                        </span>
                      </div>
                      <div className="alliance-members">
                        <strong>Members ({alliance.members?.length || 0}):</strong>
                        <p>{alliance.members?.join(', ') || 'No members'}</p>
                      </div>
                      {alliance.notes && (
                        <p className="alliance-notes">{alliance.notes}</p>
                      )}
                    </div>
                    <div className="alliance-actions">
                      <button
                        className="btn btn-small btn-edit"
                        onClick={() => handleEdit(alliance)}
                        disabled={isUpdating || isDeleting}
                        title="Edit alliance"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(alliance.alliance_name)}
                        disabled={isDeleting}
                        title="Delete alliance"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                {alliances?.length === 0 ? (
                  <p>No alliances in this season yet. Create one to get started!</p>
                ) : (
                  <p>No alliances match your search.</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default AllianceManager;
