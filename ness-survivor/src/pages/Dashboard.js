/**
 * Dashboard - Main landing page for the app
 * 
 * This is the first page users see. It shows a summary of recent activity,
 * links to main features, and quick stats.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetchData } from '../hooks/useNeo4j';
import * as neo4jService from '../services/neo4jService';
import '../styles/Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState('');
  
  const { data: seasons, loading: seasonsLoading } = useFetchData(
    () => neo4jService.getAllSeasons(),
    []
  );

  const { data: leaderboard, loading: leaderboardLoading } = useFetchData(
    () => neo4jService.getFantasyTeamLeaderboard(),
    []
  );

  const handleSeasonProgressNavigate = () => {
    if (selectedSeason) {
      navigate(`/season/${selectedSeason}/progress`);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <h1>Welcome to Survivor Fantasy Draft Manager</h1>
        <p>Manage seasons, players, alliances, and your fantasy draft all in one place</p>
      </div>

      <div className="dashboard-grid">
        {/* Season Progress Tracker */}
        <section className="dashboard-section season-progress-tracker">
          <h2>📊 Season Progress Tracker</h2>
          <p className="section-description">Track tribe and player stats during an ongoing season</p>
          <div className="season-selector">
            <select 
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="season-select"
            >
              <option value="">Select a season...</option>
              {seasons?.map((season) => (
                <option key={season.season_number} value={season.season_number}>
                  Season {season.season_number} ({season.year})
                </option>
              ))}
            </select>
            <button 
              onClick={handleSeasonProgressNavigate}
              disabled={!selectedSeason}
              className="progress-button"
            >
              Track Progress →
            </button>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="dashboard-section quick-stats">
          <h2>📊 Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Seasons</h3>
              <p className="stat-number">{seasons?.length || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Fantasy Teams</h3>
              <p className="stat-number">{leaderboard?.length || 0}</p>
            </div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="dashboard-section leaderboard-preview">
          <h2>🏆 Top Teams</h2>
          {leaderboardLoading ? (
            <p className="loading">Loading leaderboard...</p>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="mini-leaderboard">
              {leaderboard.slice(0, 5).map((team, index) => (
                <div key={index} className="leaderboard-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="team-name">{team.teamName}</span>
                  <span className="team-score">{team.totalChallengeWins} wins</span>
                </div>
              ))}
              <Link to="/leaderboard" className="view-all-link">View Full Leaderboard →</Link>
            </div>
          ) : (
            <p className="no-data">No fantasy teams yet</p>
          )}
        </section>

        {/* Recent Seasons */}
        <section className="dashboard-section seasons-preview">
          <h2>📺 Seasons</h2>
          {seasonsLoading ? (
            <p className="loading">Loading seasons...</p>
          ) : seasons && seasons.length > 0 ? (
            <div className="seasons-list">
              {seasons.slice(0, 5).map((season) => (
                <div key={season.season_number} className="season-card-wrapper">
                  <Link
                    to={`/seasons/${season.season_number}`}
                    className="season-card"
                  >
                    <h3>Season {season.season_number}</h3>
                    <p>{season.year}</p>
                  </Link>
                  <Link
                    to={`/season/${season.season_number}/progress`}
                    className="season-progress-link"
                    title="Track progress"
                  >
                    📊
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No seasons yet</p>
          )}
        </section>

        {/* Admin Quick Links */}
        <section className="dashboard-section admin-links">
          <h2>⚙️ Admin Tools</h2>
          <div className="admin-link-grid">
            <Link to="/admin/seasons" className="admin-link">
              <span className="icon">📅</span>
              <span className="label">Manage Seasons</span>
            </Link>
            <Link to="/admin/tribes" className="admin-link">
              <span className="icon">🏕️</span>
              <span className="label">Manage Tribes</span>
            </Link>
            <Link to="/admin/players" className="admin-link">
              <span className="icon">👥</span>
              <span className="label">Manage Players</span>
            </Link>
            <Link to="/admin/alliances" className="admin-link">
              <span className="icon">🤝</span>
              <span className="label">Manage Alliances</span>
            </Link>
            <Link to="/admin/draft" className="admin-link">
              <span className="icon">📋</span>
              <span className="label">Manage Draft</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
