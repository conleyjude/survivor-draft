import React, { useState, useEffect } from 'react';
import { getPlayersInSeason, createPlayer, deletePlayer } from '../services/neo4jService';

const Players = ({ seasonId }) => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    age: '',
    occupation: '',
    hometown: ''
  });

  // Fetch players for the current season
  const fetchPlayers = async () => {
    try {
      const result = await getPlayersInSeason(seasonId);
      setPlayers(result.map(p => ({
        ...p,
        id: `${p.first_name}-${p.last_name}`,
        name: `${p.first_name} ${p.last_name}`
      })));
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(error.message);
    }
  };

  // Add a new player
  const addPlayer = async (e) => {
    e.preventDefault();
    try {
      const [first_name, ...rest] = newPlayer.name.split(' ');
      const last_name = rest.join(' ') || '';
      await createPlayer(
        seasonId,
        '', // tribe_name - not collected in this form
        first_name,
        last_name,
        newPlayer.occupation,
        newPlayer.hometown,
        '', // archetype
        ''  // notes
      );
      setNewPlayer({ name: '', age: '', occupation: '', hometown: '' });
      await fetchPlayers();
    } catch (error) {
      console.error('Error adding player:', error);
      setError(error.message);
    }
  };

  // Delete a player
  const handleDeletePlayer = async (player) => {
    try {
      await deletePlayer(player.first_name, player.last_name);
      await fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        if (seasonId) {
          await fetchPlayers();
        }
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeAndFetch();
  }, [seasonId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
            <button onClick={() => handleDeletePlayer(player)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Players;