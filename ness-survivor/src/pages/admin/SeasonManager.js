/**
 * SeasonManager - Create and manage seasons
 */

import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/SeasonManager.css';

function SeasonManager() {
  const { data: seasons, loading, refetch } = useFetchData(
    () => neo4jService.getAllSeasons(),
    []
  );

  const { mutate: createSeason } = useMutation(
    (seasonNum, year) => neo4jService.createSeason(seasonNum, year),
    () => {
      alert('Season created successfully!');
      refetch();
      resetForm();
    },
    (err) => alert(`Error: ${err.message}`)
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    { season_number: '', year: '' },
    async (values) => {
      await createSeason(Number(values.season_number), Number(values.year));
    },
    {
      season_number: (val) => !val ? 'Season number is required' : '',
      year: (val) => !val ? 'Year is required' : '',
    }
  );

  return (
    <div className="season-manager">
      <div className="manager-header">
        <h1>📅 Manage Seasons</h1>
      </div>

      <div className="manager-content">
        {/* Create Form */}
        <section className="create-section">
          <h2>Create New Season</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="season_number">Season Number</label>
              <input
                id="season_number"
                name="season_number"
                type="number"
                value={values.season_number}
                onChange={handleChange}
                placeholder="e.g., 46"
              />
              {errors.season_number && <span className="error">{errors.season_number}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                id="year"
                name="year"
                type="number"
                value={values.year}
                onChange={handleChange}
                placeholder="e.g., 2024"
              />
              {errors.year && <span className="error">{errors.year}</span>}
            </div>

            <button type="submit" className="btn btn-primary">
              Create Season
            </button>
          </form>
        </section>

        {/* Seasons List */}
        <section className="list-section">
          <h2>All Seasons ({seasons?.length || 0})</h2>
          {loading ? (
            <p>Loading seasons...</p>
          ) : seasons && seasons.length > 0 ? (
            <div className="seasons-list">
              {seasons.map((season) => (
                <div key={season.season_number} className="season-item">
                  <h3>Season {season.season_number}</h3>
                  <p>{season.year}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No seasons yet</p>
          )}
        </section>
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default SeasonManager;
