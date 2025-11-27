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
  const seasonNumber = Number(seasonId);
  const [season, setSeason] = useState(null);
  const [players, setPlayers] = useState([]);
  const { overview, loading: overviewLoading } = useSeasonOverview(seasonNumber);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load season details and players
    const fetchData = async () => {
      try {
        setLoadingPlayers(true);
        const seasons = await neo4jService.getAllSeasons();
        const found = seasons.find(s => s.season_number === seasonNumber);
        setSeason(found);

        if (found) {
          const playersData = await neo4jService.getPlayersInSeason(seasonNumber);
          setPlayers(playersData || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPlayers(false);
      }
    };

    if (seasonNumber) {
      fetchData();
    }
  }, [seasonId, seasonNumber]);

  if (overviewLoading || loadingPlayers) {
    return (
      <div className="season-view">
        <div className="loading-state">⏳ Loading season data...</div>
      </div>
    );
  }

  if (error || !season) {
    return (
      <div className="season-view">
        <div className="error-state">
          <h2>❌ Season not found</h2>
          {error && <p className="error-message">{error}</p>}
          <Link to="/" className="btn btn-primary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalPlayers = players.length;
  const totalChallengeWins = players.reduce((sum, p) => sum + (p.challenges_won || 0), 0);
  const playersWithIdols = players.filter(p => p.has_idol).length;

  return (
    <div className="season-view">
      {/* Header */}
      <div className="season-header">
        <div className="season-title">
          <h1>Season {season.season_number}</h1>
          <p className="season-year">aired {season.year}</p>
        </div>
      </div>

      {/* Statistics */}
      <section className="season-stats">
        <div className="stat-card">
          <div className="stat-number">{totalPlayers}</div>
          <div className="stat-label">Total Players</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{overview?.length || 0}</div>
          <div className="stat-label">Tribes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalChallengeWins}</div>
          <div className="stat-label">Total Challenge Wins</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{playersWithIdols}</div>
          <div className="stat-label">Players with Idols</div>
        </div>
      </section>

      <div className="season-content">
        {/* Tribes Section */}
        <section className="tribes-section">
          <h2>🏕️ Tribes ({overview?.length || 0})</h2>
          {overview && overview.length > 0 ? (
            <div className="tribes-grid">
              {overview.map((item, idx) => (
                <div key={idx} className="tribe-card">
                  <div 
                    className="tribe-color-bar" 
                    style={{ backgroundColor: item.tribe?.tribe_color }}
                  />
                  <div className="tribe-content">
                    <h3>{item.tribe?.tribe_name}</h3>
                    <p className="tribe-count">
                      <strong>{item.playerCount}</strong> player{item.playerCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No tribes yet</div>
          )}
        </section>

        {/* Players Section */}
        <section className="players-section">
          <h2>👥 Players ({totalPlayers})</h2>
          {players.length > 0 ? (
            <div className="players-grid">
              {players.map((player, idx) => (
                <Link
                  key={idx}
                  to={`/players/${player.first_name}/${player.last_name}`}
                  className="player-card"
                >
                  <div className="player-name">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="player-meta">
                    <span className="placement">#{player.placement || 'TBD'}</span>
                    <span className="occupation">{player.occupation}</span>
                  </div>
                  <div className="player-stats-mini">
                    <span className="stat-mini">
                      <strong>{player.challenges_won || 0}</strong> wins
                    </span>
                    <span className="stat-mini">
                      <strong>{player.votes_received || 0}</strong> votes
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">No players yet</div>
          )}
        </section>
      </div>

      {/* Navigation */}
      <div className="navigation">
        <Link to="/" className="nav-link">← Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default SeasonView;
