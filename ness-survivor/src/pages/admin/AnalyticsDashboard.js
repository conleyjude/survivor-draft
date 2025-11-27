import React, { useState, useEffect } from 'react';
import '../styles/AnalyticsDashboard.css';
import { LoadingSpinner, EmptyState } from '../components/common';

/**
 * AnalyticsDashboard Component
 * Displays draft statistics, player metrics, and team performance
 */
const AnalyticsDashboard = ({ draftData, onExport }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    if (draftData) {
      calculateStats();
    }
  }, [draftData]);

  const calculateStats = () => {
    setLoading(true);

    const players = draftData.players || [];
    const teams = draftData.teams || [];
    const seasons = draftData.seasons || [];
    const alliances = draftData.alliances || [];

    // Calculate player statistics
    const playerStats = {
      total: players.length,
      avgChallengeWins: players.length > 0 
        ? (players.reduce((sum, p) => sum + (p.challenges_won || 0), 0) / players.length).toFixed(2)
        : 0,
      playersWithIdols: players.filter(p => p.has_idol).length,
      avgVotes: players.length > 0
        ? (players.reduce((sum, p) => sum + (p.votes_received || 0), 0) / players.length).toFixed(2)
        : 0,
    };

    // Calculate team statistics
    const teamStats = {
      total: teams.length,
      avgTeamSize: teams.length > 0
        ? (teams.reduce((sum, t) => sum + (t.roster?.length || 0), 0) / teams.length).toFixed(2)
        : 0,
      topTeam: teams.length > 0 ? teams.reduce((best, t) => {
        const bestWins = (best.totalChallengeWins || 0);
        const currentWins = (t.totalChallengeWins || 0);
        return currentWins > bestWins ? t : best;
      }) : null,
    };

    // Calculate season statistics
    const seasonStats = {
      total: seasons.length,
      avgPlayersPerSeason: seasons.length > 0
        ? (players.length / seasons.length).toFixed(2)
        : 0,
      avgAlliancesPerSeason: seasons.length > 0
        ? (alliances.length / seasons.length).toFixed(2)
        : 0,
    };

    // Top performers
    const topPlayers = players
      .map(p => ({
        ...p,
        score: (p.challenges_won || 0) * 2 + (p.has_idol ? 5 : 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const topTeams = teams
      .map(t => ({
        ...t,
        totalScore: (t.totalChallengeWins || 0) + (t.previous_wins || 0),
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    setStats({
      playerStats,
      teamStats,
      seasonStats,
      topPlayers,
      topTeams,
      alliances: {
        total: alliances.length,
        avgSize: alliances.length > 0
          ? (alliances.reduce((sum, a) => sum + (a.members?.length || 0), 0) / alliances.length).toFixed(2)
          : 0,
      },
    });

    setLoading(false);
  };

  if (loading) {
    return <LoadingSpinner message="Calculating statistics..." />;
  }

  if (!stats) {
    return (
      <EmptyState
        icon="📊"
        title="No Data Available"
        message="No draft data to analyze. Create some seasons and players first."
      />
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>📊 Analytics Dashboard</h1>
        <button className="btn-primary" onClick={() => onExport && onExport()}>
          📥 Export Report
        </button>
      </div>

      {/* Metric Selector */}
      <div className="metric-selector">
        <button
          className={`metric-btn ${selectedMetric === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('overview')}
        >
          Overview
        </button>
        <button
          className={`metric-btn ${selectedMetric === 'players' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('players')}
        >
          Players
        </button>
        <button
          className={`metric-btn ${selectedMetric === 'teams' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('teams')}
        >
          Teams
        </button>
        <button
          className={`metric-btn ${selectedMetric === 'alliances' ? 'active' : ''}`}
          onClick={() => setSelectedMetric('alliances')}
        >
          Alliances
        </button>
      </div>

      {/* Overview Section */}
      {selectedMetric === 'overview' && (
        <div className="analytics-section">
          <h2>📈 Overview</h2>

          <div className="stats-grid">
            {/* Player Stats Card */}
            <div className="stat-card">
              <h3>👤 Players</h3>
              <div className="stat-value">{stats.playerStats.total}</div>
              <div className="stat-detail">
                <span>Avg Wins: {stats.playerStats.avgChallengeWins}</span>
              </div>
              <div className="stat-detail">
                <span>With Idols: {stats.playerStats.playersWithIdols}</span>
              </div>
            </div>

            {/* Team Stats Card */}
            <div className="stat-card">
              <h3>👥 Fantasy Teams</h3>
              <div className="stat-value">{stats.teamStats.total}</div>
              <div className="stat-detail">
                <span>Avg Roster: {stats.teamStats.avgTeamSize}</span>
              </div>
              {stats.teamStats.topTeam && (
                <div className="stat-detail">
                  <span>Top: {stats.teamStats.topTeam.team_name}</span>
                </div>
              )}
            </div>

            {/* Season Stats Card */}
            <div className="stat-card">
              <h3>📺 Seasons</h3>
              <div className="stat-value">{stats.seasonStats.total}</div>
              <div className="stat-detail">
                <span>Avg Players: {stats.seasonStats.avgPlayersPerSeason}</span>
              </div>
              <div className="stat-detail">
                <span>Avg Alliances: {stats.seasonStats.avgAlliancesPerSeason}</span>
              </div>
            </div>

            {/* Alliance Stats Card */}
            <div className="stat-card">
              <h3>🤝 Alliances</h3>
              <div className="stat-value">{stats.alliances.total}</div>
              <div className="stat-detail">
                <span>Avg Size: {stats.alliances.avgSize}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Metrics */}
      {selectedMetric === 'players' && (
        <div className="analytics-section">
          <h2>👤 Player Metrics</h2>

          <div className="metrics-row">
            <div className="metric-box">
              <div className="metric-label">Total Players</div>
              <div className="metric-value">{stats.playerStats.total}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Avg Challenge Wins</div>
              <div className="metric-value">{stats.playerStats.avgChallengeWins}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Players with Idols</div>
              <div className="metric-value">{stats.playerStats.playersWithIdols}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Avg Votes Received</div>
              <div className="metric-value">{stats.playerStats.avgVotes}</div>
            </div>
          </div>

          <div className="top-list">
            <h3>🏆 Top 10 Players by Score</h3>
            <div className="list-container">
              {stats.topPlayers.map((player, idx) => (
                <div key={idx} className="list-item">
                  <div className="rank">#{idx + 1}</div>
                  <div className="player-info">
                    <div className="player-name">
                      {player.first_name} {player.last_name}
                    </div>
                    <div className="player-meta">
                      {player.tribe_name} • Season {player.season_number}
                    </div>
                  </div>
                  <div className="score-badge">{player.score} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Metrics */}
      {selectedMetric === 'teams' && (
        <div className="analytics-section">
          <h2>👥 Team Metrics</h2>

          <div className="metrics-row">
            <div className="metric-box">
              <div className="metric-label">Total Teams</div>
              <div className="metric-value">{stats.teamStats.total}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Avg Roster Size</div>
              <div className="metric-value">{stats.teamStats.avgTeamSize}</div>
            </div>
          </div>

          <div className="top-list">
            <h3>🥇 Top 10 Teams by Score</h3>
            <div className="list-container">
              {stats.topTeams.map((team, idx) => (
                <div key={idx} className="list-item">
                  <div className="rank">#{idx + 1}</div>
                  <div className="team-info">
                    <div className="team-name">{team.team_name}</div>
                    <div className="team-meta">
                      {team.owner} • {team.roster?.length || 0} players
                    </div>
                  </div>
                  <div className="score-badge">{team.totalScore} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alliance Metrics */}
      {selectedMetric === 'alliances' && (
        <div className="analytics-section">
          <h2>🤝 Alliance Metrics</h2>

          <div className="metrics-row">
            <div className="metric-box">
              <div className="metric-label">Total Alliances</div>
              <div className="metric-value">{stats.alliances.total}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Avg Alliance Size</div>
              <div className="metric-value">{stats.alliances.avgSize}</div>
            </div>
          </div>

          <div className="info-box">
            <p>Alliance analysis helps track player relationships and strategic formations across seasons.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
