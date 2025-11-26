/**
 * FantasyTeamView - Display fantasy team with roster
 */

import { useParams, Link } from 'react-router-dom';
import { useFetchData } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/FantasyTeamView.css';

function FantasyTeamView() {
  const { teamName } = useParams();
  const { data: teamData, loading, error } = useFetchData(
    () => neo4jService.getFantasyTeamWithPlayers(teamName),
    [teamName],
    true
  );

  if (loading) {
    return <div className="fantasy-team-view"><p>Loading team data...</p></div>;
  }

  if (error || !teamData) {
    return (
      <div className="fantasy-team-view">
        <p>Team not found: {error}</p>
        <Link to="/">Return to Dashboard</Link>
      </div>
    );
  }

  const { team, players } = teamData;

  return (
    <div className="fantasy-team-view">
      <div className="team-header">
        <h1>{team.team_name}</h1>
        <div className="team-info">
          <p>Members: {team.members}</p>
          <p>Previous Wins: {team.previous_wins || 0}</p>
        </div>
      </div>

      <section className="roster">
        <h2>Roster ({players.length} players)</h2>
        {players && players.length > 0 ? (
          <div className="players-grid">
            {players.map((player, idx) => (
              <div key={idx} className="roster-player">
                <h3>{player.first_name} {player.last_name}</h3>
                <p className="challenges">{player.challenges_won || 0} challenges won</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No players drafted yet</p>
        )}
      </section>

      <Link to="/" className="back-link">← Back to Dashboard</Link>
    </div>
  );
}

export default FantasyTeamView;
