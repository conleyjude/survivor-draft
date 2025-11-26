/**
 * DraftManager - Manage fantasy teams and drafting
 */

import { Link } from 'react-router-dom';
import { useFetchData, useForm, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/DraftManager.css';
import { useState, useEffect } from 'react';

function DraftManager() {
  const { data: teams, refetch: refetchTeams } = useFetchData(
    () => neo4jService.getAllFantasyTeams(),
    []
  );
  const { data: leaderboard } = useFetchData(
    () => neo4jService.getFantasyTeamLeaderboard(),
    []
  );

  const { mutate: createTeam } = useMutation(
    (params) =>
      neo4jService.createFantasyTeam(params.team_name, params.members, params.previous_wins),
    () => {
      alert('Fantasy team created successfully!');
      refetchTeams();
      resetForm();
    },
    (err) => alert(`Error: ${err.message}`)
  );

  const { values, errors, handleChange, handleSubmit, resetForm } = useForm(
    { team_name: '', members: '', previous_wins: 0 },
    async (values) => {
      await createTeam({
        team_name: values.team_name,
        members: values.members,
        previous_wins: Number(values.previous_wins),
      });
    },
    {
      team_name: (val) => !val ? 'Team name is required' : '',
      members: (val) => !val ? 'Members is required' : '',
    }
  );

  return (
    <div className="draft-manager">
      <div className="manager-header">
        <h1>📋 Manage Draft</h1>
      </div>

      <div className="manager-content">
        {/* Create Team Form */}
        <section className="create-section">
          <h2>Create Fantasy Team</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="team_name">Team Name</label>
              <input
                id="team_name"
                name="team_name"
                value={values.team_name}
                onChange={handleChange}
                placeholder="e.g., The Winners"
              />
              {errors.team_name && <span className="error">{errors.team_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="members">Team Members</label>
              <input
                id="members"
                name="members"
                value={values.members}
                onChange={handleChange}
                placeholder="e.g., John, Jane"
              />
              {errors.members && <span className="error">{errors.members}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="previous_wins">Previous Wins</label>
              <input
                id="previous_wins"
                name="previous_wins"
                type="number"
                value={values.previous_wins}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Create Team
            </button>
          </form>
        </section>

        {/* Teams List */}
        <section className="list-section">
          <h2>Fantasy Teams ({teams?.length || 0})</h2>
          {teams && teams.length > 0 ? (
            <div className="teams-list">
              {teams.map((team) => (
                <div key={team.team_name} className="team-item">
                  <h3>{team.team_name}</h3>
                  <p className="members">{team.members}</p>
                  <p className="wins">Previous Wins: {team.previous_wins || 0}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No teams created yet</p>
          )}
        </section>

        {/* Leaderboard Preview */}
        {leaderboard && leaderboard.length > 0 && (
          <section className="leaderboard-section">
            <h2>Current Standings</h2>
            <div className="leaderboard-preview">
              {leaderboard.map((team, idx) => (
                <div key={idx} className="leaderboard-item">
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{team.teamName}</span>
                  <span className="score">{team.totalChallengeWins} wins</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default DraftManager;
