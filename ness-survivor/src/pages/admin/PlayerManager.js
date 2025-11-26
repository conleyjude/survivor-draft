/**
 * PlayerManager - Create and manage players
 */

import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/PlayerManager.css';
import { useState, useEffect } from 'react';

function PlayerManager() {
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [tribesInSeason, setTribesInSeason] = useState([]);
  const [playersInSeason, setPlayersInSeason] = useState([]);

  useEffect(() => {
    if (selectedSeason) {
      const loadData = async () => {
        const tribes = await neo4jService.getTribesInSeason(selectedSeason);
        setTribesInSeason(tribes);
        const players = await neo4jService.getPlayersInSeason(selectedSeason);
        setPlayersInSeason(players);
      };
      loadData();
    }
  }, [selectedSeason]);

  const { mutate: createPlayer } = useMutation(
    (params) =>
      neo4jService.createPlayer(
        params.season_number,
        params.tribe_name,
        params.first_name,
        params.last_name,
        params.occupation,
        params.hometown,
        params.archetype,
        params.notes
      ),
    () => {
      alert('Player created successfully!');
      if (selectedSeason) {
        neo4jService.getPlayersInSeason(selectedSeason).then(setPlayersInSeason);
      }
      resetForm();
    },
    (err) => alert(`Error: ${err.message}`)
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    {
      first_name: '',
      last_name: '',
      occupation: '',
      hometown: '',
      archetype: '',
      notes: '',
    },
    async (values) => {
      if (!selectedSeason || !selectedTribe) {
        alert('Please select both season and tribe');
        return;
      }
      await createPlayer({
        season_number: selectedSeason,
        tribe_name: selectedTribe,
        ...values,
      });
    },
    {
      first_name: (val) => !val ? 'First name is required' : '',
      last_name: (val) => !val ? 'Last name is required' : '',
    }
  );

  return (
    <div className="player-manager">
      <div className="manager-header">
        <h1>👥 Manage Players</h1>
      </div>

      <div className="manager-content">
        {/* Create Form */}
        <section className="create-section">
          <h2>Create New Player</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="season_select">Select Season</label>
              <select
                id="season_select"
                value={selectedSeason || ''}
                onChange={(e) => {
                  const season = Number(e.target.value) || null;
                  setSelectedSeason(season);
                  setSelectedTribe(null);
                }}
              >
                <option value="">-- Choose Season --</option>
                {seasons?.map((season) => (
                  <option key={season.season_number} value={season.season_number}>
                    Season {season.season_number} ({season.year})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tribe_select">Select Tribe</label>
              <select
                id="tribe_select"
                value={selectedTribe || ''}
                onChange={(e) => setSelectedTribe(e.target.value || null)}
                disabled={!selectedSeason}
              >
                <option value="">-- Choose Tribe --</option>
                {tribesInSeason?.map((tribe) => (
                  <option key={tribe.tribe_name} value={tribe.tribe_name}>
                    {tribe.tribe_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSeason && selectedTribe && (
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    id="first_name"
                    name="first_name"
                    value={values.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                  />
                  {errors.first_name && <span className="error">{errors.first_name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    name="last_name"
                    value={values.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                  />
                  {errors.last_name && <span className="error">{errors.last_name}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    id="occupation"
                    name="occupation"
                    value={values.occupation}
                    onChange={handleChange}
                    placeholder="e.g., Marketing Manager"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hometown">Hometown</label>
                  <input
                    id="hometown"
                    name="hometown"
                    value={values.hometown}
                    onChange={handleChange}
                    placeholder="e.g., Chicago, IL"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="archetype">Archetype</label>
                <select
                  id="archetype"
                  name="archetype"
                  value={values.archetype}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="Leader">Leader</option>
                  <option value="Strategic">Strategic</option>
                  <option value="Loyal">Loyal</option>
                  <option value="Challenge Beast">Challenge Beast</option>
                  <option value="Social Butterfly">Social Butterfly</option>
                  <option value="Wildcard">Wildcard</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={values.notes}
                  onChange={handleChange}
                  placeholder="Additional notes about the player"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Create Player
              </button>
            </form>
          )}
        </section>

        {/* Players List */}
        {selectedSeason && (
          <section className="list-section">
            <h2>Players in Season {selectedSeason} ({playersInSeason?.length || 0})</h2>
            {playersInSeason && playersInSeason.length > 0 ? (
              <div className="players-list">
                {playersInSeason.map((player) => (
                  <div key={`${player.first_name}-${player.last_name}`} className="player-item">
                    <h3>{player.first_name} {player.last_name}</h3>
                    <p className="occupation">{player.occupation || 'N/A'}</p>
                    <p className="hometown">{player.hometown || 'N/A'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No players in this season yet</p>
            )}
          </section>
        )}
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default PlayerManager;
