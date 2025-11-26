/**
 * SeasonView - Display season details with all tribes and players
 */

import { useParams, Link } from 'react-router-dom';
import { useSeasonOverview } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import { useState, useEffect } from 'react';
import '../../styles/SeasonView.css';

function SeasonView() {
  const { seasonId } = useParams();
  const [season, setSeason] = useState(null);
  const { overview, loading } = useSeasonOverview(Number(seasonId));

  useEffect(() => {
    // Load season details
    const fetchSeason = async () => {
      const seasons = await neo4jService.getAllSeasons();
      const found = seasons.find(s => s.season_number === Number(seasonId));
      setSeason(found);
    };
    fetchSeason();
  }, [seasonId]);

  if (loading) {
    return <div className="season-view"><p>Loading season data...</p></div>;
  }

  if (!season) {
    return (
      <div className="season-view">
        <p>Season not found</p>
        <Link to="/">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="season-view">
      <div className="season-header">
        <h1>Season {season.season_number}</h1>
        <p className="season-year">{season.year}</p>
      </div>

      <div className="season-content">
        <section className="tribes-section">
          <h2>Tribes</h2>
          {overview && overview.length > 0 ? (
            <div className="tribes-grid">
              {overview.map((item, idx) => (
                <div key={idx} className="tribe-card" style={{ borderColor: item.tribe?.tribe_color }}>
                  <h3>{item.tribe?.tribe_name}</h3>
                  <p className="tribe-count">{item.playerCount} players</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No tribes yet</p>
          )}
        </section>
      </div>

      <Link to="/" className="back-link">← Back to Dashboard</Link>
    </div>
  );
}

export default SeasonView;
