/**
 * TribeManager - Create, read, update, and delete tribes
 * Comprehensive CRUD interface with cascading season selector
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { tribeValidation, hasErrors } from '../../utils/validation';
import '../../styles/TribeManager.css';

function TribeManager() {
  const { data: seasons, loading: seasonsLoading } = useFetchData(
    () => neo4jService.getAllSeasons(),
    []
  );

  const [selectedSeason, setSelectedSeason] = useState(null);
  const [tribesInSeason, setTribesInSeason] = useState([]);
  const [loadingTribes, setLoadingTribes] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load tribes when season changes
  useEffect(() => {
    if (selectedSeason) {
      setLoadingTribes(true);
      neo4jService.getTribesInSeason(selectedSeason)
        .then(setTribesInSeason)
        .catch(err => {
          setErrorMessage(`Failed to load tribes: ${err.message}`);
          setTimeout(() => setErrorMessage(''), 3000);
        })
        .finally(() => setLoadingTribes(false));
    } else {
      setTribesInSeason([]);
    }
  }, [selectedSeason]);

  const { mutate: createTribe, isLoading: isCreating } = useMutation(
    (seasonNum, tribeName, tribeColor) =>
      neo4jService.createTribe(seasonNum, tribeName, tribeColor),
    () => {
      setSuccessMessage('Tribe created successfully!');
      if (selectedSeason) {
        neo4jService.getTribesInSeason(selectedSeason).then(setTribesInSeason);
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to create tribe: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: updateTribe, isLoading: isUpdating } = useMutation(
    (tribeName, seasonNum, updates) =>
      neo4jService.updateTribe(tribeName, seasonNum, updates),
    () => {
      setSuccessMessage('Tribe updated successfully!');
      if (selectedSeason) {
        neo4jService.getTribesInSeason(selectedSeason).then(setTribesInSeason);
      }
      resetForm();
      setEditingId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to update tribe: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: deleteTribe, isLoading: isDeleting } = useMutation(
    (tribeName, seasonNum) =>
      neo4jService.deleteTribe(tribeName, seasonNum),
    () => {
      setSuccessMessage('Tribe deleted successfully!');
      if (selectedSeason) {
        neo4jService.getTribesInSeason(selectedSeason).then(setTribesInSeason);
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to delete tribe: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    { tribe_name: '', tribe_color: '#667EEA' },
    async (formValues) => {
      if (!selectedSeason) {
        setErrorMessage('Please select a season first');
        return;
      }
      if (editingId) {
        await updateTribe(editingId, selectedSeason, {
          tribe_name: formValues.tribe_name,
          tribe_color: formValues.tribe_color,
        });
      } else {
        await createTribe(selectedSeason, formValues.tribe_name, formValues.tribe_color);
      }
    },
    tribeValidation
  );

  const handleEdit = (tribe) => {
    setEditingId(tribe.tribe_name);
    handleChange({ target: { name: 'tribe_name', value: tribe.tribe_name } });
    handleChange({ target: { name: 'tribe_color', value: tribe.tribe_color } });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (tribeName) => {
    if (window.confirm(`Are you sure you want to delete the ${tribeName} tribe? This action cannot be undone.`)) {
      deleteTribe(tribeName, selectedSeason);
    }
  };

  // Filter tribes based on search term
  const filteredTribes = tribesInSeason?.filter(tribe =>
    tribe.tribe_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formHasErrors = hasErrors(errors);

  return (
    <div className="tribe-manager">
      <div className="manager-header">
        <h1>🏕️ Manage Tribes</h1>
        <p className="header-subtitle">Create, edit, and manage Survivor tribes</p>
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
          <h2>{editingId ? `Edit Tribe: ${editingId}` : 'Create New Tribe'}</h2>

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

          {selectedSeason && (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="tribe_name">Tribe Name *</label>
                <input
                  id="tribe_name"
                  name="tribe_name"
                  type="text"
                  value={values.tribe_name}
                  onChange={handleChange}
                  placeholder="e.g., Koror"
                  className={errors.tribe_name ? 'input-error' : ''}
                />
                {errors.tribe_name && (
                  <span className="error-message">{errors.tribe_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tribe_color">Tribe Color *</label>
                <div className="color-picker">
                  <input
                    id="tribe_color"
                    name="tribe_color"
                    type="color"
                    value={values.tribe_color}
                    onChange={handleChange}
                    className={errors.tribe_color ? 'input-error' : ''}
                  />
                  <span className="color-value">{values.tribe_color}</span>
                </div>
                {errors.tribe_color && (
                  <span className="error-message">{errors.tribe_color}</span>
                )}
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
                    editingId ? '💾 Update Tribe' : '➕ Create Tribe'
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

        {/* Tribes List */}
        {selectedSeason && (
          <section className="list-section">
            <div className="list-header">
              <h2>Tribes in Season {selectedSeason} ({filteredTribes.length})</h2>
              <input
                type="text"
                placeholder="Search tribes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {loadingTribes ? (
              <div className="loading">⏳ Loading tribes...</div>
            ) : filteredTribes.length > 0 ? (
              <div className="tribes-list">
                {filteredTribes.map((tribe) => (
                  <div key={tribe.tribe_name} className="tribe-item">
                    <div className="tribe-content">
                      <div
                        className="tribe-color-indicator"
                        style={{ backgroundColor: tribe.tribe_color }}
                        title={tribe.tribe_color}
                      />
                      <div className="tribe-info">
                        <h3>{tribe.tribe_name}</h3>
                        <p className="tribe-color-label">{tribe.tribe_color}</p>
                      </div>
                    </div>
                    <div className="tribe-actions">
                      <button
                        className="btn btn-small btn-edit"
                        onClick={() => handleEdit(tribe)}
                        disabled={isUpdating || isDeleting}
                        title="Edit tribe"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-small btn-delete"
                        onClick={() => handleDelete(tribe.tribe_name)}
                        disabled={isDeleting}
                        title="Delete tribe"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                {tribesInSeason?.length === 0 ? (
                  <p>No tribes in this season yet. Create one to get started!</p>
                ) : (
                  <p>No tribes match your search.</p>
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

export default TribeManager;
