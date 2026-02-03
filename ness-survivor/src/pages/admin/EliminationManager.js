/**
 * EliminationManager - Manage player eliminations and reserve replacements
 * Features: Mark players as eliminated, select reserve replacements
 * Prerequisites: Draft must be finalized first
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchData, useMutation } from '../../hooks/useNeo4j';
import * as neo4jService from '../../services/neo4jService';
import '../../styles/EliminationManager.css';

function EliminationManager() {
  // State for cascading selectors
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedReserve, setSelectedReserve] = useState('');

  // State for messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data fetching
  const { data: seasons } = useFetchData(() => neo4jService.getAllSeasons(), []);
  const { data: teams, refetch: refetchTeams } = useFetchData(
    () => (selectedSeason ? neo4jService.getFantasyTeamsInSeason(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );
  const { data: reservePlayers, refetch: refetchReservePlayers } = useFetchData(
    () => (selectedSeason ? neo4jService.getReservePlayers(Number(selectedSeason)) : Promise.resolve([])),
    [selectedSeason]
  );

  // Get team roster with details
  const { data: teamRoster, refetch: refetchTeamRoster } = useFetchData(
    () => {
      if (!selectedTeam) return Promise.resolve([]);
      return neo4jService.getFantasyTeamWithPlayers(selectedTeam).then(result => result?.players || []);
    },
    [selectedTeam]
  );

  // Mutations
  const { mutate: eliminatePlayerMutation } = useMutation(
    () => {
      const [firstName, ...lastNameParts] = selectedPlayer.split(' ');
      const lastName = lastNameParts.join(' ');
      return neo4jService.eliminatePlayer(firstName, lastName);
    },
    (result) => {
      setSuccessMessage(`${selectedPlayer} has been eliminated from ${result.team?.team_name || 'their team'}.`);
      setSelectedPlayer('');
      refetchTeamRoster();
      refetchTeams();
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    (err) => {
      setErrorMessage(`Error eliminating player: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  const { mutate: replaceWithReserveMutation } = useMutation(
    () => {
      const [firstName, ...lastNameParts] = selectedReserve.split(' ');
      const lastName = lastNameParts.join(' ');
      return neo4jService.replaceWithReserve(firstName, lastName, selectedTeam);
    },
    (result) => {
      setSuccessMessage(`${selectedReserve} has been added to ${selectedTeam} from reserves!`);
      setSelectedReserve('');
      refetchReservePlayers();
      refetchTeamRoster();
      refetchTeams();
      setTimeout(() => setSuccessMessage(''), 5000);
    },
    (err) => {
      setErrorMessage(`Error adding reserve: ${err.message}`);
      setTimeout(() => setErrorMessage(''), 3000);
    }
  );

  // Form handlers
  const handleSeasonChange = (e) => {
    setSelectedSeason(e.target.value);
    setSelectedTeam('');
    setSelectedPlayer('');
    setSelectedReserve('');
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
    setSelectedPlayer('');
    setSelectedReserve('');
  };

  const handleEliminatePlayer = () => {
    if (!selectedPlayer) {
      setErrorMessage('Please select a player to eliminate.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    eliminatePlayerMutation();
  };

  const handleAddReserve = () => {
    if (!selectedReserve) {
      setErrorMessage('Please select a reserve player to add.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    if (!selectedTeam) {
      setErrorMessage('Please select a team first.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    replaceWithReserveMutation();
  };

  // Filter active players (not eliminated)
  const activePlayers = teamRoster?.filter(p => p.status !== 'eliminated') || [];
  const eliminatedPlayers = teamRoster?.filter(p => p.status === 'eliminated') || [];

  return (
    <div className="elimination-manager">
      {/* Messages */}
      {successMessage && (
        <div className="message message-success">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message message-error">
          {errorMessage}
        </div>
      )}

      <div className="manager-header">
        <h1>⚰️ Elimination & Reserves Manager</h1>
        <p>Mark players as eliminated and manage reserve replacements</p>
      </div>

      {/* Season Selector */}
      <div className="season-selector-container">
        <div className="form-group">
          <label htmlFor="season">Select Season</label>
          <select
            id="season"
            value={selectedSeason}
            onChange={handleSeasonChange}
            className="season-selector"
          >
            <option value="">-- Choose Season --</option>
            {seasons?.map((season) => (
              <option key={season.season_number} value={season.season_number}>
                Season {season.season_number} ({season.year})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="manager-content">
        {selectedSeason && (
          <>
            {/* Team Selection */}
            <section className="team-selection-section">
              <h2>🎯 Select Team</h2>
              <div className="form-group">
                <label htmlFor="team">Fantasy Team</label>
                <select
                  id="team"
                  value={selectedTeam}
                  onChange={handleTeamChange}
                  className="team-selector"
                >
                  <option value="">-- Choose Team --</option>
                  {teams?.map((team) => (
                    <option key={team.team_name} value={team.team_name}>
                      {team.team_name} ({team.owners?.join(', ') || 'No owner'})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Team Roster */}
            {selectedTeam && (
              <>
                <section className="roster-section">
                  <h2>👥 Active Roster - {selectedTeam}</h2>
                  {activePlayers.length > 0 ? (
                    <div className="roster-grid">
                      {activePlayers.map((player) => (
                        <div 
                          key={`${player.first_name}-${player.last_name}`} 
                          className="roster-player-card"
                        >
                          <span className="player-name">
                            {player.first_name} {player.last_name}
                          </span>
                          <span className="player-stats">
                            Challenges: {player.challenges_won || 0} | Votes: {player.votes_received || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No active players on this team.</p>
                  )}
                </section>

                {/* Eliminate Player Section */}
                <section className="eliminate-section">
                  <h2>⚰️ Eliminate Player</h2>
                  <div className="form-group">
                    <label htmlFor="player">Select Player to Eliminate</label>
                    <select
                      id="player"
                      value={selectedPlayer}
                      onChange={(e) => setSelectedPlayer(e.target.value)}
                      className="player-selector"
                    >
                      <option value="">-- Choose Player --</option>
                      {activePlayers.map((player) => (
                        <option
                          key={`${player.first_name}-${player.last_name}`}
                          value={`${player.first_name} ${player.last_name}`}
                        >
                          {player.first_name} {player.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleEliminatePlayer}
                    className="btn btn-danger btn-block"
                    disabled={!selectedPlayer}
                  >
                    Mark as Eliminated
                  </button>
                </section>

                {/* Eliminated Players */}
                {eliminatedPlayers.length > 0 && (
                  <section className="eliminated-section">
                    <h2>🪦 Eliminated Players</h2>
                    <div className="eliminated-grid">
                      {eliminatedPlayers.map((player) => (
                        <div 
                          key={`${player.first_name}-${player.last_name}`} 
                          className="eliminated-player-card"
                        >
                          <span className="player-name">
                            {player.first_name} {player.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Add Reserve Section */}
                {reservePlayers && reservePlayers.length > 0 && (
                  <section className="reserve-selection-section">
                    <h2>🔄 Add Reserve Player</h2>
                    <p className="section-description">
                      Select a reserve player to add to this team as a replacement.
                    </p>
                    <div className="form-group">
                      <label htmlFor="reserve">Select Reserve Player</label>
                      <select
                        id="reserve"
                        value={selectedReserve}
                        onChange={(e) => setSelectedReserve(e.target.value)}
                        className="reserve-selector"
                      >
                        <option value="">-- Choose Reserve --</option>
                        {reservePlayers.map((player) => (
                          <option
                            key={`${player.first_name}-${player.last_name}`}
                            value={`${player.first_name} ${player.last_name}`}
                          >
                            {player.first_name} {player.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddReserve}
                      className="btn btn-primary btn-block"
                      disabled={!selectedReserve}
                    >
                      Add to Team
                    </button>
                  </section>
                )}

                {reservePlayers && reservePlayers.length === 0 && (
                  <section className="no-reserves-section">
                    <p className="info-message">
                      ℹ️ No reserve players available. All players have been drafted or eliminated.
                    </p>
                  </section>
                )}
              </>
            )}
          </>
        )}

        {!selectedSeason && (
          <div className="no-selection">
            <p>👆 Select a season above to manage eliminations</p>
          </div>
        )}
      </div>

      <Link to="/admin" className="back-link">← Back to Admin</Link>
    </div>
  );
}

export default EliminationManager;
