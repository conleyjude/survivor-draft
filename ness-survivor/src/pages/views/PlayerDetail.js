/**
 * PlayerDetail - Display complete player profile with all relationships
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
    return <div className="player-detail"><p>Loading player details...</p></div>;
  }

  if (error || !player) {
    return (
      <div className="player-detail">
        <p>Player not found: {error}</p>
        <Link to="/">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="player-detail">
      <div className="player-header">
        <h1>{player.first_name} {player.last_name}</h1>
        {tribe && <p className="tribe-badge">{tribe.tribe_name}</p>}
      </div>

      <div className="player-grid">
        <section className="player-bio">
          <h2>Bio</h2>
          <dl>
            <dt>Occupation:</dt>
            <dd>{player.occupation || 'N/A'}</dd>
            <dt>Hometown:</dt>
            <dd>{player.hometown || 'N/A'}</dd>
            <dt>Archetype:</dt>
            <dd>{player.archetype || 'N/A'}</dd>
          </dl>
        </section>

        <section className="player-stats">
          <h2>Stats</h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="label">Challenges Won</span>
              <span className="value">{player.challenges_won || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Votes Received</span>
              <span className="value">{player.votes_received || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Idols Played</span>
              <span className="value">{player.idols_played || 0}</span>
            </div>
            <div className="stat">
              <span className="label">Has Idol</span>
              <span className="value">{player.has_idol ? '✓' : '✗'}</span>
            </div>
          </div>
        </section>

        {alliances && alliances.length > 0 && (
          <section className="player-alliances">
            <h2>Alliances</h2>
            <ul>
              {alliances.map((alliance, idx) => (
                <li key={idx}>{alliance.alliance_name}</li>
              ))}
            </ul>
          </section>
        )}

        {fantasyTeam && (
          <section className="player-team">
            <h2>Drafted By</h2>
            <p>{fantasyTeam.team_name}</p>
          </section>
        )}
      </div>

      <Link to="/" className="back-link">← Back to Dashboard</Link>
    </div>
  );
}

export default PlayerDetail;
