/**
 * FantasyTeamView - Display fantasy team with complete roster and statistics
 */

import { useParams, Link } from 'react-router-dom';
import { useFetchData } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/FantasyTeamView.css';

function FantasyTeamView() {
  const { teamName } = useParams();
  const { data: teamData, loading, error } = useFetchData(
    () => neo4jService.getFantasyTeamWithPlayers(decodeURIComponent(teamName)),
    [teamName],
    true
  );

  if (loading) {
    return (
      <div className="fantasy-team-view">
        <div className="loading-state">⏳ Loading team data...</div>
      </div>
    );
  }

  if (error || !teamData?.team) {
    return (
      <div className="fantasy-team-view">
        <div className="error-state">
          <h2>❌ Team not found</h2>
          {error && <p className="error-message">{error}</p>}
          <Link to="/" className="btn btn-primary">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { team, players } = teamData;

  // Calculate team statistics
  const totalChallengeWins = players.reduce((sum, p) => sum + (p.challenges_won || 0), 0);
  const totalVotesReceived = players.reduce((sum, p) => sum + (p.votes_received || 0), 0);
  const playersWithIdols = players.filter(p => p.has_idol).length;
  const averagePlacement = players.length > 0 
    ? (players.reduce((sum, p) => sum + (p.placement || 0), 0) / players.length).toFixed(1)
    : 'N/A';

  return (
    <div className="fantasy-team-view">
      {/* Header */}
      <div className="team-header">
        <div className="team-title">
          <h1>🎯 {team.team_name}</h1>
          {team.owner_name && <p className="owner">Owner: {team.owner_name}</p>}
        </div>
      </div>

      {/* Team Statistics */}
      <section className="team-stats">
        <div className="stat-card">
          <div className="stat-number">{players.length}</div>
          <div className="stat-label">Roster Size</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalChallengeWins}</div>
          <div className="stat-label">Total Challenge Wins</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalVotesReceived}</div>
          <div className="stat-label">Total Votes Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{averagePlacement}</div>
          <div className="stat-label">Avg Placement</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{playersWithIdols}</div>
          <div className="stat-label">Players w/ Idols</div>
        </div>
        {team.previous_wins !== undefined && (
          <div className="stat-card">
            <div className="stat-number">{team.previous_wins || 0}</div>
            <div className="stat-label">Previous Wins</div>
          </div>
        )}
      </section>

      {/* Roster */}
      <section className="roster-section">
        <h2>👥 Roster ({players.length} players)</h2>
        {players && players.length > 0 ? (
          <div className="roster-grid">
            {players.map((player, idx) => (
              <Link
                key={idx}
                to={`/players/${player.first_name}/${player.last_name}`}
                className="roster-player-card"
              >
                <div className="player-header">
                  <h3>{player.first_name} {player.last_name}</h3>
                  <span className="placement-badge">#{player.placement || 'TBD'}</span>
                </div>
                <div className="player-meta">
                  <p className="occupation">{player.occupation}</p>
                </div>
                <div className="player-stats-breakdown">
                  <div className="stat-item">
                    <span className="label">Challenges:</span>
                    <span className="value">{player.challenges_won || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Votes:</span>
                    <span className="value">{player.votes_received || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Idols:</span>
                    <span className="value">{player.idols_played || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="label">Has Idol:</span>
                    <span className={`value ${player.has_idol ? 'has-idol' : 'no-idol'}`}>
                      {player.has_idol ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">📭 No players drafted yet</div>
        )}
      </section>

      {/* Navigation */}
      <div className="navigation">
        <Link to="/leaderboard" className="nav-link">← Back to Leaderboard</Link>
        <Link to="/" className="nav-link">← Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default FantasyTeamView;
