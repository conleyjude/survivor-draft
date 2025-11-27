/**
 * PlayerDetail - Individual player profile with complete statistics
 * Displays player info, stats, tribe, season, alliances, and fantasy team
 */

import { useParams, Link } from 'react-router-dom';
import { usePlayerDetails } from '../../hooks/useNeo4j';
import '../../styles/PlayerDetail.css';

function PlayerDetail() {
  const { firstName, lastName } = useParams();
  const { player, tribe, season, alliances, fantasyTeam, loading, error } = usePlayerDetails(
    firstName,
    lastName
  );

  if (loading) {
    return (
      <div className="player-detail">
        <div className="loading-state">⏳ Loading player details...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="player-detail">
        <div className="error-state">
          <h2>❌ Player not found</h2>
          {error && <p className="error-message">{error}</p>}
          <Link to="/" className="btn btn-primary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="player-detail">
      {/* Header */}
      <div className="player-header">
        <div className="player-name-section">
          <h1>{player.first_name} {player.last_name}</h1>
          {season && (
            <p className="season-link">
              <Link to={`/seasons/${season.season_number}`}>
                Season {season.season_number} ({season.year})
              </Link>
            </p>
          )}
        </div>
        {tribe && (
          <div className="tribe-badge">
            <span className="tribe-name">{tribe.tribe_name}</span>
            <div className="tribe-color" style={{ backgroundColor: tribe.tribe_color }} />
          </div>
        )}
      </div>

      <div className="player-content">
        {/* Main Info Cards */}
        <section className="info-grid">
          {/* Basic Info */}
          <div className="info-card">
            <h3>👤 Player Info</h3>
            <div className="info-row">
              <span className="label">Occupation:</span>
              <span className="value">{player.occupation || 'N/A'}</span>
            </div>
            {player.hometown && (
              <div className="info-row">
                <span className="label">Hometown:</span>
                <span className="value">{player.hometown}</span>
              </div>
            )}
            {player.archetype && (
              <div className="info-row">
                <span className="label">Archetype:</span>
                <span className="value">{player.archetype}</span>
              </div>
            )}
            <div className="info-row">
              <span className="label">Placement:</span>
              <span className="value stat-badge">#{player.placement || 'TBD'}</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="info-card">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-number">{player.challenges_won || 0}</div>
                <div className="stat-label">Challenges Won</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{player.votes_received || 0}</div>
                <div className="stat-label">Votes Received</div>
              </div>
              <div className="stat-box">
                <div className="stat-number">{player.idols_played || 0}</div>
                <div className="stat-label">Idols Played</div>
              </div>
              <div className="stat-box">
                <div className={`stat-number ${player.has_idol ? 'has-idol' : 'no-idol'}`}>
                  {player.has_idol ? '✓' : '✗'}
                </div>
                <div className="stat-label">Current Idol</div>
              </div>
            </div>
          </div>
        </section>

        {/* Alliances */}
        {alliances && alliances.length > 0 && (
          <section className="alliances-section">
            <h2>🤝 Alliances ({alliances.length})</h2>
            <div className="alliances-list">
              {alliances.map((alliance, idx) => (
                <div key={idx} className="alliance-badge">
                  <span className="alliance-name">{alliance.alliance_name}</span>
                  {alliance.status && (
                    <span className={`status-badge status-${alliance.status}`}>
                      {alliance.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fantasy Team */}
        {fantasyTeam && (
          <section className="fantasy-team-section">
            <h2>🎯 Fantasy Team Assignment</h2>
            <div className="team-card">
              <h3>
                <Link to={`/teams/${fantasyTeam.team_name}`}>
                  {fantasyTeam.team_name}
                </Link>
              </h3>
              {fantasyTeam.owner_name && (
                <p className="owner">Owner: {fantasyTeam.owner_name}</p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Navigation */}
      <div className="navigation">
        {season && (
          <Link to={`/seasons/${season.season_number}`} className="nav-link">
            ← Back to Season {season.season_number}
          </Link>
        )}
        <Link to="/" className="nav-link">← Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default PlayerDetail;
