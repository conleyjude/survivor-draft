import React, { useState, useEffect } from 'react';
import { getDriver } from '../config/neo4jConfig';

const Players = ({ seasonId }) => {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    age: '',
    occupation: '',
    hometown: ''
  });

  // Fetch players for the current season
  const fetchPlayers = async () => {
    const driver = getDriver();
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (p:Player)-[:PLAYED_IN]->(s:Season)
         WHERE ID(s) = $seasonId
         RETURN p`,
        { seasonId }
      );
      setPlayers(result.records.map(record => ({
        ...record.get('p').properties,
        id: record.get('p').identity.toString()
      })));
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      session.close();
    }
  };

  // Add a new player
  const addPlayer = async (e) => {
    e.preventDefault();
    const driver = getDriver();
    const session = driver.session();
    try {
      await session.run(
        `MATCH (s:Season)
         WHERE ID(s) = $seasonId
         CREATE (p:Player {
           name: $name,
           age: toInteger($age),
           occupation: $occupation,
           hometown: $hometown
         })-[:PLAYED_IN]->(s)
         RETURN p`,
        { ...newPlayer, seasonId }
      );
      setNewPlayer({
        name: '',
        age: '',
        occupation: '',
        hometown: ''
      });
      fetchPlayers();
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      session.close();
    }
  };

  // Delete a player
  const deletePlayer = async (playerId) => {
    const driver = getDriver();
    const session = driver.session();
    try {
      await session.run(
        `MATCH (p:Player)
         WHERE ID(p) = $playerId
         DETACH DELETE p`,
        { playerId }
      );
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
    } finally {
      session.close();
    }
  };

  useEffect(() => {
    if (seasonId) {
      fetchPlayers();
    }
  }, [seasonId]);

  return (
    <div className="players-container">
      <h2>Players</h2>
      
      {/* Add Player Form */}
      <form onSubmit={addPlayer} className="add-player-form">
        <input
          type="text"
          placeholder="Name"
          value={newPlayer.name}
          onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={newPlayer.age}
          onChange={(e) => setNewPlayer({...newPlayer, age: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Occupation"
          value={newPlayer.occupation}
          onChange={(e) => setNewPlayer({...newPlayer, occupation: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Hometown"
          value={newPlayer.hometown}
          onChange={(e) => setNewPlayer({...newPlayer, hometown: e.target.value})}
          required
        />
        <button type="submit">Add Player</button>
      </form>

      {/* Players List */}
      <div className="players-list">
        {players.map(player => (
          <div key={player.id} className="player-card">
            <h3>{player.name}</h3>
            <p>Age: {player.age}</p>
            <p>Occupation: {player.occupation}</p>
            <p>Hometown: {player.hometown}</p>
            <button onClick={() => deletePlayer(player.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Players;