/**
 * TribeManager - Create and manage tribes
 */

import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/TribeManager.css';
import { useState, useEffect } from 'react';

function TribeManager() {
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [tribesInSeason, setTribesInSeason] = useState([]);

  useEffect(() => {
    if (selectedSeason) {
      const loadTribes = async () => {
        const tribes = await neo4jService.getTribesInSeason(selectedSeason);
        setTribesInSeason(tribes);
      };
      loadTribes();
    }
  }, [selectedSeason]);

  const { mutate: createTribe } = useMutation(
    (seasonNum, tribeName, tribeColor) =>
      neo4jService.createTribe(seasonNum, tribeName, tribeColor),
    () => {
      alert('Tribe created successfully!');
      if (selectedSeason) {
        neo4jService.getTribesInSeason(selectedSeason).then(setTribesInSeason);
      }
      resetForm();
    },
    (err) => alert(`Error: ${err.message}`)
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    { tribe_name: '', tribe_color: '#000000' },
    async (values) => {
      if (!selectedSeason) {
        alert('Please select a season first');
        return;
      }
      await createTribe(selectedSeason, values.tribe_name, values.tribe_color);
    },
    {
      tribe_name: (val) => !val ? 'Tribe name is required' : '',
    }
  );

  return (
    <div className="tribe-manager">
      <div className="manager-header">
        <h1>🏕️ Manage Tribes</h1>
      </div>

      <div className="manager-content">
        {/* Create Form */}
        <section className="create-section">
          <h2>Create New Tribe</h2>

          <div className="form-group">
            <label htmlFor="season_select">Select Season</label>
            <select
              id="season_select"
              value={selectedSeason || ''}
              onChange={(e) => setSelectedSeason(Number(e.target.value) || null)}
            >
              <option value="">-- Choose Season --</option>
              {seasons?.map((season) => (
                <option key={season.season_number} value={season.season_number}>
                  Season {season.season_number} ({season.year})
                </option>
              ))}
            </select>
          </div>

          {selectedSeason && (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="tribe_name">Tribe Name</label>
                <input
                  id="tribe_name"
                  name="tribe_name"
                  value={values.tribe_name}
                  onChange={handleChange}
                  placeholder="e.g., Koror"
                />
                {errors.tribe_name && <span className="error">{errors.tribe_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="tribe_color">Tribe Color</label>
                <div className="color-picker">
                  <input
                    id="tribe_color"
                    name="tribe_color"
                    type="color"
                    value={values.tribe_color}
                    onChange={handleChange}
                  />
                  <span className="color-value">{values.tribe_color}</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Create Tribe
              </button>
            </form>
          )}
        </section>

        {/* Tribes List */}
        {selectedSeason && (
          <section className="list-section">
            <h2>Tribes in Season {selectedSeason}</h2>
            {tribesInSeason && tribesInSeason.length > 0 ? (
              <div className="tribes-list">
                {tribesInSeason.map((tribe) => (
                  <div key={tribe.tribe_name} className="tribe-item">
                    <div
                      className="tribe-color-indicator"
                      style={{ backgroundColor: tribe.tribe_color }}
                    />
                    <h3>{tribe.tribe_name}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <p>No tribes in this season yet</p>
            )}
          </section>
        )}
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default TribeManager;
