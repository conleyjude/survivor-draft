/**
 * Leaderboard - Fantasy team standings and scores
 */

import { Link } from 'react-router-dom';
import { useLeaderboard } from '../../hooks/useNeo4j';
import '../../styles/Leaderboard.css';

function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard();

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h1>🏆 Fantasy Leaderboard</h1>
        <p>Rankings based on combined challenge wins of drafted players</p>
      </div>

      {loading ? (
        <p className="loading">Loading leaderboard...</p>
      ) : error ? (
        <p className="error">Error loading leaderboard: {error}</p>
      ) : leaderboard && leaderboard.length > 0 ? (
        <div className="leaderboard-table">
          <div className="leaderboard-header-row">
            <div className="col rank">Rank</div>
            <div className="col team">Team</div>
            <div className="col wins">Challenge Wins</div>
            <div className="col roster">Roster Size</div>
            <div className="col prev">Previous Wins</div>
          </div>
          {leaderboard.map((team, index) => (
            <Link
              key={index}
              to={`/teams/${team.teamName}`}
              className="leaderboard-row"
            >
              <div className="col rank">
                <span className="rank-badge">#{index + 1}</span>
              </div>
              <div className="col team">{team.teamName}</div>
              <div className="col wins">{team.totalChallengeWins}</div>
              <div className="col roster">{team.rosterSize}</div>
              <div className="col prev">{team.previousWins}</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="no-data">No teams yet</p>
      )}

      <Link to="/" className="back-link">← Back to Dashboard</Link>
    </div>
  );
}

export default Leaderboard;
