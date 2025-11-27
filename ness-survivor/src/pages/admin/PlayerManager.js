/**
 * PlayerManager - Create, read, update, and delete players
 * Comprehensive CRUD interface with cascading season/tribe selectors
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { playerValidation, hasErrors } from '../../utils/validation';
import '../../styles/PlayerManager.css';

function PlayerManager() {
  const { data: seasons, loading: seasonsLoading } = useFetchData(
    () => neo4jService.getAllSeasons(),
    []
  );

  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [tribesInSeason, setTribesInSeason] = useState([]);
  const [playersInSeason, setPlayersInSeason] = useState([]);
  const [loadingTribes, setLoadingTribes] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load tribes when season changes
  useEffect(() => {
    if (selectedSeason) {
      setLoadingTribes(true);
      setSelectedTribe(null);
      neo4jService.getTribesInSeason(selectedSeason)
        .then(setTribesInSeason)
        .catch(err => {
          setErrorMessage(`Failed to load tribes: ${err.message}`);
          setTimeout(() => setErrorMessage(''), 3000);
        })
        .finally(() => setLoadingTribes(false));
    } else {
      setTribesInSeason([]);
      setPlayersInSeason([]);
    }
  }, [selectedSeason]);

  // Load players when season changes
  useEffect(() => {
    if (selectedSeason) {
      setLoadingPlayers(true);
      neo4jService.getPlayersInSeason(selectedSeason)
        .then(setPlayersInSeason)
        .catch(err => {
          setErrorMessage(`Failed to load players: ${err.message}`);
          setTimeout(() => setErrorMessage(''), 3000);
        })
        .finally(() => setLoadingPlayers(false));
    } else {
      setPlayersInSeason([]);
    }
  }, [selectedSeason]);

  const { mutate: createPlayer, isLoading: isCreating } = useMutation(
    (seasonNumber, tribeName, firstName, lastName, occupation, hometown, archetype, notes) =>
      neo4jService.createPlayer(seasonNumber, tribeName, firstName, lastName, occupation, hometown, archetype, notes),
    () => {
      setSuccessMessage('Player created successfully!');
      if (selectedSeason) {
        neo4jService.getPlayersInSeason(selectedSeason).then(setPlayersInSeason);
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to create player: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: updatePlayer, isLoading: isUpdating } = useMutation(
    (firstName, lastName, updates) =>
      neo4jService.updatePlayer(firstName, lastName, updates),
    () => {
      setSuccessMessage('Player updated successfully!');
      if (selectedSeason) {
        neo4jService.getPlayersInSeason(selectedSeason).then(setPlayersInSeason);
      }
      resetForm();
      setEditingId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to update player: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: deletePlayer, isLoading: isDeleting } = useMutation(
    (firstName, lastName) =>
      neo4jService.deletePlayer(firstName, lastName),
    () => {
      setSuccessMessage('Player deleted successfully!');
      if (selectedSeason) {
        neo4jService.getPlayersInSeason(selectedSeason).then(setPlayersInSeason);
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to delete player: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { values, errors, handleChange, handleSubmit, resetForm, setValues } = useForm(
    { first_name: '', last_name: '', occupation: '', hometown: '', archetype: '', notes: '' },
    async (formValues) => {
      if (!selectedSeason) {
        setErrorMessage('Please select a season first');
        return;
      }
      if (!selectedTribe) {
        setErrorMessage('Please select a tribe first');
        return;
      }

      if (editingId) {
        await updatePlayer(editingId.first_name, editingId.last_name, {
          first_name: formValues.first_name,
          last_name: formValues.last_name,
          occupation: formValues.occupation,
          hometown: formValues.hometown,
          archetype: formValues.archetype,
        });
      } else {
        await createPlayer(
          selectedSeason,
          selectedTribe,
          formValues.first_name,
          formValues.last_name,
          formValues.occupation,
          formValues.hometown,
          formValues.archetype,
          ''
        );
      }
    },
    playerValidation
  );

  const handleEdit = (player) => {
    setEditingId(player);
    setValues({
      first_name: player.first_name,
      last_name: player.last_name,
      occupation: player.occupation,
      hometown: player.hometown || '',
      archetype: player.archetype || '',
      notes: player.notes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (player) => {
    if (window.confirm(`Are you sure you want to delete ${player.first_name} ${player.last_name}? This action cannot be undone.`)) {
      deletePlayer(player.first_name, player.last_name);
    }
  };

  // Filter players based on search term
  const filteredPlayers = playersInSeason?.filter(player =>
    `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.occupation?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formHasErrors = hasErrors(errors);

  return (
    <div className="player-manager">
      <div className="manager-header">
        <h1>👥 Manage Players</h1>
        <p className="header-subtitle">Create, edit, and manage Survivor players</p>
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
          <h2>{editingId ? `Edit Player: ${editingId.first_name} ${editingId.last_name}` : 'Create New Player'}</h2>

          {/* Season Selection */}
          <div className="form-group">
            <label htmlFor="season_select">Select Season *</label>
            <select
              id="season_select"
              value={selectedSeason || ''}
              onChange={(e) => setSelectedSeason(Number(e.target.value) || null)}
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

          {/* Tribe Selection */}
          {selectedSeason && (
            <div className="form-group">
              <label htmlFor="tribe_select">Select Tribe *</label>
              <select
                id="tribe_select"
                value={selectedTribe || ''}
                onChange={(e) => setSelectedTribe(e.target.value || null)}
                disabled={loadingTribes}
                className={!selectedTribe && 'input-error'}
              >
                <option value="">-- Choose Tribe --</option>
                {tribesInSeason?.map((tribe) => (
                  <option key={tribe.tribe_name} value={tribe.tribe_name}>
                    {tribe.tribe_name}
                  </option>
                ))}
              </select>
              {!selectedTribe && <span className="error-message">Please select a tribe</span>}
            </div>
          )}

          {/* Player Form */}
          {selectedSeason && selectedTribe && (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={values.first_name}
                    onChange={handleChange}
                    placeholder="e.g., Robert"
                    className={errors.first_name ? 'input-error' : ''}
                  />
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name *</label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={values.last_name}
                    onChange={handleChange}
                    placeholder="e.g., Marksanchez"
                    className={errors.last_name ? 'input-error' : ''}
                  />
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="occupation">Occupation *</label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  value={values.occupation}
                  onChange={handleChange}
                  placeholder="e.g., Restaurant Owner"
                  className={errors.occupation ? 'input-error' : ''}
                />
                {errors.occupation && <span className="error-message">{errors.occupation}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="hometown">Hometown</label>
                  <input
                    id="hometown"
                    name="hometown"
                    type="text"
                    value={values.hometown}
                    onChange={handleChange}
                    placeholder="e.g., Los Angeles, CA"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="archetype">Archetype</label>
                  <input
                    id="archetype"
                    name="archetype"
                    type="text"
                    value={values.archetype}
                    onChange={handleChange}
                    placeholder="e.g., Strategic Player"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={values.notes}
                  onChange={handleChange}
                  placeholder="e.g., Key player in the game..."
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
                    editingId ? '💾 Update Player' : '➕ Create Player'
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

        {/* Players List */}
        {selectedSeason && (
          <section className="list-section">
            <div className="list-header">
              <h2>Players in Season {selectedSeason} ({filteredPlayers.length})</h2>
              <input
                type="text"
                placeholder="Search by name or occupation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loadingPlayers ? (
              <div className="loading">⏳ Loading players...</div>
            ) : filteredPlayers.length > 0 ? (
              <div className="players-list">
                {filteredPlayers.map((player) => (
                  <div key={`${player.first_name}-${player.last_name}`} className="player-item">
                    <div className="player-content">
                      <div className="player-info">
                        <h3>{player.first_name} {player.last_name}</h3>
                        <p className="player-details">
                          {player.occupation}
                        </p>
                        {player.hometown && <p className="player-meta">{player.hometown}</p>}
                        {player.archetype && <p className="player-archetype">{player.archetype}</p>}
                      </div>
                    </div>
                    <div className="player-actions">
                      <button
                        className="btn btn-small btn-edit"
                        onClick={() => handleEdit(player)}
                        disabled={isUpdating || isDeleting}
                        title="Edit player"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(player)}
                        disabled={isDeleting}
                        title="Delete player"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                {playersInSeason?.length === 0 ? (
                  <p>No players in this season yet. Create one to get started!</p>
                ) : (
                  <p>No players match your search.</p>
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

export default PlayerManager;
