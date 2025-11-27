/**
 * Leaderboard - Fantasy team standings and scores
 * Displays ranked teams with their stats
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeaderboard } from '../../hooks/useNeo4j';
import '../../styles/Leaderboard.css';

function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard();
  const [sortBy, setSortBy] = useState('wins'); // wins, roster, prev

  // Sort leaderboard based on selected criteria
  const sortedLeaderboard = leaderboard
    ? [...leaderboard].sort((a, b) => {
        switch (sortBy) {
          case 'wins':
            return (b.totalChallengeWins || 0) - (a.totalChallengeWins || 0);
          case 'roster':
            return (b.rosterSize || 0) - (a.rosterSize || 0);
          case 'prev':
            return (b.previousWins || 0) - (a.previousWins || 0);
          default:
            return 0;
        }
      })
    : [];

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '•';
  };

  return (
    <div className="leaderboard">
      {/* Header */}
      <div className="leaderboard-header">
        <h1>🏆 Fantasy Leaderboard</h1>
        <p className="subtitle">Rankings based on combined challenge wins of drafted players</p>
      </div>

      {/* Sort Controls */}
      <section className="sort-controls">
        <button
          className={`sort-btn ${sortBy === 'wins' ? 'active' : ''}`}
          onClick={() => setSortBy('wins')}
        >
          By Challenge Wins
        </button>
        <button
          className={`sort-btn ${sortBy === 'roster' ? 'active' : ''}`}
          onClick={() => setSortBy('roster')}
        >
          By Roster Size
        </button>
        <button
          className={`sort-btn ${sortBy === 'prev' ? 'active' : ''}`}
          onClick={() => setSortBy('prev')}
        >
          By Previous Wins
        </button>
      </section>

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">⏳ Loading leaderboard...</div>
      ) : error ? (
        <div className="error-state">
          <p>❌ Error loading leaderboard: {error}</p>
        </div>
      ) : sortedLeaderboard && sortedLeaderboard.length > 0 ? (
        <section className="leaderboard-section">
          {/* Desktop View */}
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="col-rank">Rank</th>
                  <th className="col-team">Team</th>
                  <th className="col-owner">Owner</th>
                  <th className="col-wins">Challenge Wins</th>
                  <th className="col-roster">Roster</th>
                  <th className="col-prev">Prev Wins</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((team, index) => (
                  <tr key={index} className={`leaderboard-row rank-${index + 1}`}>
                    <td className="col-rank">
                      <span className="rank-badge">
                        {getMedalEmoji(index + 1)} #{index + 1}
                      </span>
                    </td>
                    <td className="col-team">
                      <Link to={`/teams/${encodeURIComponent(team.teamName)}`} className="team-link">
                        {team.teamName}
                      </Link>
                    </td>
                    <td className="col-owner">{team.ownerName || 'N/A'}</td>
                    <td className="col-wins">
                      <span className="stat-value">{team.totalChallengeWins || 0}</span>
                    </td>
                    <td className="col-roster">
                      <span className="roster-badge">{team.rosterSize || 0}</span>
                    </td>
                    <td className="col-prev">{team.previousWins || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="leaderboard-cards">
            {sortedLeaderboard.map((team, index) => (
              <Link
                key={index}
                to={`/teams/${encodeURIComponent(team.teamName)}`}
                className="leaderboard-card"
              >
                <div className="card-rank">
                  <span className="rank-badge">{getMedalEmoji(index + 1)}</span>
                  <span className="rank-number">#{index + 1}</span>
                </div>
                <div className="card-content">
                  <h3>{team.teamName}</h3>
                  {team.ownerName && <p className="owner">{team.ownerName}</p>}
                </div>
                <div className="card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Wins</span>
                    <span className="stat-val">{team.totalChallengeWins || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Roster</span>
                    <span className="stat-val">{team.rosterSize || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Prev</span>
                    <span className="stat-val">{team.previousWins || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-state">
          <p>📭 No teams yet. Start by creating a fantasy team in the admin panel.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="navigation">
        <Link to="/" className="nav-link">← Back to Dashboard</Link>
      </div>
    </div>
  );
}

export default Leaderboard;
