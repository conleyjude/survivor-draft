/**
 * AllianceManager - Create and manage alliances
 */

import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/AllianceManager.css';
import { useState, useEffect } from 'react';

function AllianceManager() {
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const [selectedSeason, setSelectedSeason] = useState(null);

  const { mutate: createAlliance } = useMutation(
    (params) =>
      neo4jService.createAlliance(
        params.season_number,
        params.alliance_name,
        params.formation_episode,
        params.dissolved_episode,
        params.size,
        params.notes
      ),
    () => {
      alert('Alliance created successfully!');
      resetForm();
    },
    (err) => alert(`Error: ${err.message}`)
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    {
      alliance_name: '',
      formation_episode: '',
      dissolved_episode: '',
      size: '',
      notes: '',
    },
    async (values) => {
      if (!selectedSeason) {
        alert('Please select a season first');
        return;
      }
      await createAlliance({
        season_number: selectedSeason,
        ...values,
      });
    },
    {
      alliance_name: (val) => !val ? 'Alliance name is required' : '',
      formation_episode: (val) => !val ? 'Formation episode is required' : '',
      size: (val) => !val ? 'Size is required' : '',
    }
  );

  return (
    <div className="alliance-manager">
      <div className="manager-header">
        <h1>🤝 Manage Alliances</h1>
      </div>

      <div className="manager-content">
        <section className="create-section">
          <h2>Create New Alliance</h2>

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
                <label htmlFor="alliance_name">Alliance Name</label>
                <input
                  id="alliance_name"
                  name="alliance_name"
                  value={values.alliance_name}
                  onChange={handleChange}
                  placeholder="e.g., The Four Horsemen"
                />
                {errors.alliance_name && <span className="error">{errors.alliance_name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="formation_episode">Formation Episode</label>
                  <input
                    id="formation_episode"
                    name="formation_episode"
                    type="number"
                    value={values.formation_episode}
                    onChange={handleChange}
                    placeholder="e.g., 1"
                  />
                  {errors.formation_episode && (
                    <span className="error">{errors.formation_episode}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="dissolved_episode">Dissolved Episode</label>
                  <input
                    id="dissolved_episode"
                    name="dissolved_episode"
                    type="number"
                    value={values.dissolved_episode}
                    onChange={handleChange}
                    placeholder="e.g., 7 (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="size">Size</label>
                  <input
                    id="size"
                    name="size"
                    type="number"
                    value={values.size}
                    onChange={handleChange}
                    placeholder="e.g., 4"
                  />
                  {errors.size && <span className="error">{errors.size}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={values.notes}
                  onChange={handleChange}
                  placeholder="Details about the alliance"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Create Alliance
              </button>
            </form>
          )}
        </section>
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default AllianceManager;
