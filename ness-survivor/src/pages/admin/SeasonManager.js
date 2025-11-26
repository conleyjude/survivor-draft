/**
 * SeasonManager - Create, read, update, and delete seasons
 * Comprehensive CRUD interface for managing Survivor seasons
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { seasonValidation, hasErrors } from '../../utils/validation';
import '../../styles/SeasonManager.css';

function SeasonManager() {
  const { data: seasons, loading, refetch } = useFetchData(
    () => neo4jService.getAllSeasons(),
    []
  );

  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate: createSeason, isLoading: isCreating } = useMutation(
    (seasonNum, year) => neo4jService.createSeason(seasonNum, year),
    () => {
      setSuccessMessage('Season created successfully!');
      refetch();
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to create season: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: updateSeason, isLoading: isUpdating } = useMutation(
    (seasonNum, year) => neo4jService.updateSeason(seasonNum, { year }),
    () => {
      setSuccessMessage('Season updated successfully!');
      refetch();
      resetForm();
      setEditingId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to update season: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: deleteSeason, isLoading: isDeleting } = useMutation(
    (seasonNum) => neo4jService.deleteSeason(seasonNum),
    () => {
      setSuccessMessage('Season deleted successfully!');
      refetch();
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    (err) => {
      setErrorMessage(`Failed to delete season: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    { season_number: '', year: '' },
    async (formValues) => {
      if (editingId !== null) {
        await updateSeason(Number(formValues.season_number), Number(formValues.year));
      } else {
        await createSeason(Number(formValues.season_number), Number(formValues.year));
      }
    },
    seasonValidation
  );

  const handleEdit = (season) => {
    setEditingId(season.season_number);
    handleChange({ target: { name: 'season_number', value: season.season_number } });
    handleChange({ target: { name: 'year', value: season.year } });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (seasonNum) => {
    if (window.confirm(`Are you sure you want to delete Season ${seasonNum}? This action cannot be undone.`)) {
      deleteSeason(seasonNum);
    }
  };

  // Filter seasons based on search term
  const filteredSeasons = seasons?.filter(season =>
    season.season_number.toString().includes(searchTerm) ||
    season.year.toString().includes(searchTerm)
  ) || [];

  const formHasErrors = hasErrors(errors);

  return (
    <div className="season-manager">
      <div className="manager-header">
        <h1>📅 Manage Seasons</h1>
        <p className="header-subtitle">Create, edit, and manage Survivor seasons</p>
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
          <h2>{editingId !== null ? `Edit Season ${editingId}` : 'Create New Season'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="season_number">Season Number *</label>
              <input
                id="season_number"
                name="season_number"
                type="number"
                value={values.season_number}
                onChange={handleChange}
                placeholder="e.g., 46"
                disabled={editingId !== null}
                className={errors.season_number ? 'input-error' : ''}
              />
              {errors.season_number && (
                <span className="error-message">{errors.season_number}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input
                id="year"
                name="year"
                type="number"
                value={values.year}
                onChange={handleChange}
                placeholder="e.g., 2024"
                className={errors.year ? 'input-error' : ''}
              />
              {errors.year && (
                <span className="error-message">{errors.year}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formHasErrors || isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>⏳ {editingId !== null ? 'Updating...' : 'Creating...'}</>
                ) : (
                  editingId !== null ? '💾 Update Season' : '➕ Create Season'
                )}
              </button>
              {editingId !== null && (
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
        </section>

        {/* Seasons List */}
        <section className="list-section">
          <div className="list-header">
            <h2>All Seasons ({filteredSeasons.length})</h2>
            <input
              type="text"
              placeholder="Search by season number or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading">⏳ Loading seasons...</div>
          ) : filteredSeasons.length > 0 ? (
            <div className="seasons-list">
              {filteredSeasons.map((season) => (
                <div key={season.season_number} className="season-item">
                  <div className="season-content">
                    <div className="season-info">
                      <h3>Season {season.season_number}</h3>
                      <p className="season-year">{season.year}</p>
                    </div>
                  </div>
                  <div className="season-actions">
                    <button
                      className="btn btn-small btn-edit"
                      onClick={() => handleEdit(season)}
                      disabled={isUpdating || isDeleting}
                      title="Edit season"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-small btn-delete"
                      onClick={() => handleDelete(season.season_number)}
                      disabled={isDeleting}
                      title="Delete season"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {seasons?.length === 0 ? (
                <>
                  <p>No seasons yet. Create one to get started!</p>
                </>
              ) : (
                <>
                  <p>No seasons match your search.</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default SeasonManager;
