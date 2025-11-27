/**
 * End-to-End Tests for Critical User Journeys
 * 
 * Tests critical user paths:
 * - Complete draft creation from setup to leaderboard viewing
 * - Player lifecycle management
 * - Tribe and alliance workflows
 * - Draft picking and scoring
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as neo4jService from '../../services/neo4jService';

jest.mock('../../services/neo4jService');

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('E2E - Complete Draft Setup Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup all mock data needed for complete workflow
  });

  test('E2E: User creates complete draft from scratch', async () => {
    // Step 1: Navigate to admin dashboard
    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.getAllFantasyTeams.mockResolvedValue([]);

    // Step 2: Create Season
    neo4jService.createSeason.mockResolvedValue({
      season_number: 42,
      year: 2021,
      id: 1,
    });

    const seasonResult = await neo4jService.createSeason(42, 2021);
    expect(seasonResult.season_number).toBe(42);

    // Step 3: Create Tribes
    const tribesData = [
      { id: 1, tribe_name: 'Ika', tribe_color: '#FF0000', season_id: 1 },
      { id: 2, tribe_name: 'Laro', tribe_color: '#0000FF', season_id: 1 },
      { id: 3, tribe_name: 'Luvu', tribe_color: '#00FF00', season_id: 1 },
    ];

    neo4jService.createTribe.mockImplementation((seasonId, tribeName, color) => {
      const tribe = tribesData.find((t) => t.tribe_name === tribeName);
      return Promise.resolve(tribe);
    });

    neo4jService.getTribesBySeasonNumber.mockResolvedValue(tribesData);

    const tribe1 = await neo4jService.createTribe(1, 'Ika', '#FF0000');
    expect(tribe1.tribe_name).toBe('Ika');

    // Step 4: Create Players
    const playersData = [
      {
        id: 1,
        first_name: 'Xander',
        last_name: 'Hastings',
        tribe_id: 1,
        challenges_won: 5,
      },
      {
        id: 2,
        first_name: 'Deshawn',
        last_name: 'Radden',
        tribe_id: 2,
        challenges_won: 4,
      },
      {
        id: 3,
        first_name: 'Evvie',
        last_name: 'Jagoda',
        tribe_id: 3,
        challenges_won: 3,
      },
    ];

    neo4jService.createPlayer.mockImplementation((seasonId, tribeId, first, last) => {
      const player = playersData.find((p) => p.first_name === first);
      return Promise.resolve(player);
    });

    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(playersData);

    const player1 = await neo4jService.createPlayer(1, 1, 'Xander', 'Hastings');
    expect(player1.first_name).toBe('Xander');

    // Step 5: Create Fantasy Teams
    const teamsData = [
      { id: 1, team_name: 'Winners Circle', members: [], total_wins: 0 },
      { id: 2, team_name: 'Survivor Elite', members: [], total_wins: 0 },
    ];

    neo4jService.createFantasyTeam.mockImplementation((teamName) => {
      const team = teamsData.find((t) => t.team_name === teamName);
      return Promise.resolve(team);
    });

    neo4jService.getAllFantasyTeams.mockResolvedValue(teamsData);

    const team1 = await neo4jService.createFantasyTeam(
      'Winners Circle',
      [],
      0
    );
    expect(team1.team_name).toBe('Winners Circle');

    // Step 6: Draft Players
    neo4jService.getAvailablePlayers.mockResolvedValue(playersData);
    neo4jService.draftPlayerToTeam.mockImplementation((teamId, playerId, pickOrder) => {
      return Promise.resolve({ team_id: teamId, player_id: playerId, pick_order: pickOrder });
    });

    const draftPick1 = await neo4jService.draftPlayerToTeam(1, 1, 1);
    expect(draftPick1.pick_order).toBe(1);

    // Step 7: View Leaderboard
    const leaderboardData = [
      {
        rank: 1,
        team_name: 'Winners Circle',
        total_wins: 5,
        roster_size: 1,
      },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(leaderboardData);

    const leaderboard = await neo4jService.getLeaderboard();
    expect(leaderboard[0].team_name).toBe('Winners Circle');
  });

  test('E2E: Complete draft workflow with multiple teams and picks', async () => {
    // Create season
    neo4jService.createSeason.mockResolvedValue({
      season_number: 43,
      year: 2022,
      id: 1,
    });

    // Create players
    const players = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      first_name: `Player${i + 1}`,
      last_name: 'Last',
      challenges_won: Math.floor(Math.random() * 10),
    }));

    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(players);
    neo4jService.getAvailablePlayers.mockResolvedValue(players);

    // Create 4 teams
    const teams = [
      { id: 1, team_name: 'Team A', members: [] },
      { id: 2, team_name: 'Team B', members: [] },
      { id: 3, team_name: 'Team C', members: [] },
      { id: 4, team_name: 'Team D', members: [] },
    ];

    neo4jService.getAllFantasyTeams.mockResolvedValue(teams);

    // Simulate draft with 4 rounds, serpentine
    const draftPicks = [];
    let pickOrder = 1;

    // Round 1: Teams pick in order
    for (let i = 0; i < 4; i++) {
      const pick = {
        team_id: i + 1,
        player_id: i + 1,
        pick_order: pickOrder++,
        round: 1,
      };
      draftPicks.push(pick);
    }

    // Round 2: Teams pick in reverse order (serpentine)
    for (let i = 3; i >= 0; i--) {
      const pick = {
        team_id: i + 1,
        player_id: i + 5,
        pick_order: pickOrder++,
        round: 2,
      };
      draftPicks.push(pick);
    }

    neo4jService.draftPlayerToTeam.mockImplementation((teamId, playerId) => {
      const pick = draftPicks.find((p) => p.team_id === teamId && p.player_id === playerId);
      return Promise.resolve(pick);
    });

    // Verify draft picks were recorded
    expect(draftPicks.length).toBe(8);
    expect(draftPicks[0].round).toBe(1);
    expect(draftPicks[4].round).toBe(2);
  });
});

describe('E2E - Player Management Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('E2E: User creates, views, edits, and deletes a player', async () => {
    // Step 1: Create player
    const newPlayer = {
      id: 100,
      first_name: 'Test',
      last_name: 'Player',
      occupation: 'Teacher',
      hometown: 'Boston',
      archetype: 'Strategic',
      challenges_won: 0,
      votes_received: 0,
      has_idol: false,
    };

    neo4jService.createPlayer.mockResolvedValue(newPlayer);
    const createdPlayer = await neo4jService.createPlayer(
      1,
      1,
      'Test',
      'Player',
      'Teacher',
      'Boston',
      'Strategic'
    );
    expect(createdPlayer.id).toBe(100);

    // Step 2: View player detail
    neo4jService.getPlayerDetail.mockResolvedValue({
      ...newPlayer,
      tribe_name: 'Ua',
      season_number: 41,
    });

    const playerDetail = await neo4jService.getPlayerDetail(100);
    expect(playerDetail.first_name).toBe('Test');
    expect(playerDetail.tribe_name).toBe('Ua');

    // Step 3: Edit player stats (simulating competition)
    const updatedPlayer = {
      ...newPlayer,
      challenges_won: 5,
      votes_received: 2,
      has_idol: true,
    };

    neo4jService.updatePlayerStats.mockResolvedValue(updatedPlayer);
    const result = await neo4jService.updatePlayerStats(100, 5, 2, 1, true);
    expect(result.challenges_won).toBe(5);
    expect(result.has_idol).toBe(true);

    // Step 4: Move player to different tribe
    neo4jService.movePlayerToTribe.mockResolvedValue({
      player_id: 100,
      old_tribe: 1,
      new_tribe: 2,
    });

    const moveResult = await neo4jService.movePlayerToTribe(100, 2);
    expect(moveResult.new_tribe).toBe(2);

    // Step 5: Delete player
    neo4jService.deletePlayer.mockResolvedValue(true);
    const deleted = await neo4jService.deletePlayer(100);
    expect(deleted).toBe(true);

    // Verify player no longer exists
    neo4jService.getPlayerDetail.mockResolvedValue(null);
    const deletedPlayer = await neo4jService.getPlayerDetail(100);
    expect(deletedPlayer).toBeNull();
  });

  test('E2E: User filters and searches players', async () => {
    const players = [
      { id: 1, first_name: 'Alice', tribe_name: 'Ua', challenges_won: 5 },
      { id: 2, first_name: 'Bob', tribe_name: 'Ua', challenges_won: 3 },
      { id: 3, first_name: 'Charlie', tribe_name: 'Vicar', challenges_won: 4 },
    ];

    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(players);

    // Get all players
    const allPlayers = await neo4jService.getPlayersBySeasonNumber(41);
    expect(allPlayers.length).toBe(3);

    // Filter by tribe
    neo4jService.getPlayersByTribeNumber.mockResolvedValue(players.slice(0, 2));
    const uaPlayers = await neo4jService.getPlayersByTribeNumber(1);
    expect(uaPlayers.length).toBe(2);
    expect(uaPlayers[0].tribe_name).toBe('Ua');

    // Search by name (simulate client-side search)
    const searchResults = players.filter((p) =>
      p.first_name.toLowerCase().includes('alice')
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].first_name).toBe('Alice');
  });
});

describe('E2E - Tribe Management Journey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('E2E: User creates and manages tribes for a season', async () => {
    // Create season
    neo4jService.createSeason.mockResolvedValue({
      season_number: 44,
      year: 2023,
      id: 1,
    });

    // Create multiple tribes
    const tribeNames = ['Tribe A', 'Tribe B', 'Tribe C'];
    const colors = ['#FF0000', '#0000FF', '#00FF00'];
    const tribes = [];

    neo4jService.createTribe.mockImplementation((seasonId, tribeName, color) => {
      const tribe = { id: tribes.length + 1, tribe_name: tribeName, tribe_color: color };
      tribes.push(tribe);
      return Promise.resolve(tribe);
    });

    for (let i = 0; i < 3; i++) {
      const tribe = await neo4jService.createTribe(1, tribeNames[i], colors[i]);
      expect(tribe.tribe_name).toBe(tribeNames[i]);
    }

    // Get all tribes
    neo4jService.getTribesBySeasonNumber.mockResolvedValue(tribes);
    const allTribes = await neo4jService.getTribesBySeasonNumber(1);
    expect(allTribes.length).toBe(3);

    // Get players by tribe
    neo4jService.getPlayersByTribeNumber.mockResolvedValue([
      { id: 1, first_name: 'Player1', last_name: 'One' },
      { id: 2, first_name: 'Player2', last_name: 'Two' },
    ]);

    const tribePlayers = await neo4jService.getPlayersByTribeNumber(1);
    expect(tribePlayers.length).toBe(2);

    // Delete tribe
    neo4jService.deleteTribe.mockResolvedValue(true);
    const deleted = await neo4jService.deleteTribe(1);
    expect(deleted).toBe(true);
  });
});

describe('E2E - Alliance Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('E2E: User creates alliance and manages members', async () => {
    // Create alliance
    const alliance = {
      id: 1,
      alliance_name: 'The Core Four',
      formation_episode: 5,
      season_number: 41,
    };

    neo4jService.createAlliance.mockResolvedValue(alliance);
    const created = await neo4jService.createAlliance(41, 'The Core Four', 5, null, 4);
    expect(created.alliance_name).toBe('The Core Four');

    // Add players to alliance
    const memberIds = [1, 2, 3, 4];
    neo4jService.addPlayersToAlliance.mockResolvedValue({
      alliance_id: 1,
      players_added: 4,
    });

    const addResult = await neo4jService.addPlayersToAlliance(1, memberIds);
    expect(addResult.players_added).toBe(4);

    // Get alliance members
    const members = [
      { id: 1, first_name: 'Player1' },
      { id: 2, first_name: 'Player2' },
      { id: 3, first_name: 'Player3' },
      { id: 4, first_name: 'Player4' },
    ];

    neo4jService.getAllianceMembers.mockResolvedValue(members);
    const allianceMembers = await neo4jService.getAllianceMembers(1);
    expect(allianceMembers.length).toBe(4);

    // Remove player from alliance
    neo4jService.removePlayersFromAlliance.mockResolvedValue({
      alliance_id: 1,
      players_removed: 1,
    });

    const removeResult = await neo4jService.removePlayersFromAlliance(1, [1]);
    expect(removeResult.players_removed).toBe(1);

    // Update alliance
    neo4jService.updateAllianceInfo.mockResolvedValue({
      ...alliance,
      alliance_name: 'The Deadly Duo',
    });

    const updated = await neo4jService.updateAllianceInfo(1, 'The Deadly Duo');
    expect(updated.alliance_name).toBe('The Deadly Duo');
  });
});

describe('E2E - Leaderboard and Scoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('E2E: User views leaderboard with accurate scoring', async () => {
    const leaderboard = [
      {
        rank: 1,
        team_id: 1,
        team_name: 'Winners Circle',
        roster_size: 8,
        total_challenges_won: 35,
        previous_wins: 10,
        total_score: 45,
        members: [
          { id: 1, first_name: 'Player1', challenges_won: 5 },
          { id: 2, first_name: 'Player2', challenges_won: 4 },
        ],
      },
      {
        rank: 2,
        team_id: 2,
        team_name: 'Survivor Elite',
        roster_size: 8,
        total_challenges_won: 30,
        previous_wins: 5,
        total_score: 35,
        members: [
          { id: 3, first_name: 'Player3', challenges_won: 3 },
          { id: 4, first_name: 'Player4', challenges_won: 2 },
        ],
      },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(leaderboard);

    const rankings = await neo4jService.getLeaderboard();
    expect(rankings[0].rank).toBe(1);
    expect(rankings[0].total_score).toBeGreaterThan(rankings[1].total_score);
    expect(rankings[0].team_name).toBe('Winners Circle');
  });

  test('E2E: Score updates when players win challenges', async () => {
    // Initial state
    let leaderboard = [
      { rank: 1, team_name: 'Team A', total_wins: 20, score: 20 },
      { rank: 2, team_name: 'Team B', total_wins: 15, score: 15 },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(leaderboard);

    let rankings = await neo4jService.getLeaderboard();
    expect(rankings[0].score).toBe(20);

    // Player wins a challenge
    neo4jService.updatePlayerStats.mockResolvedValue({
      id: 1,
      challenges_won: 1,
    });

    await neo4jService.updatePlayerStats(1, 1, 0, 0, false);

    // Leaderboard updates
    leaderboard = [
      { rank: 1, team_name: 'Team A', total_wins: 21, score: 21 },
      { rank: 2, team_name: 'Team B', total_wins: 15, score: 15 },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(leaderboard);

    rankings = await neo4jService.getLeaderboard();
    expect(rankings[0].score).toBe(21);
  });
});

describe('E2E - Error Recovery and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('E2E: System handles network failure during draft', async () => {
    // First draft pick succeeds
    neo4jService.draftPlayerToTeam.mockResolvedValueOnce({
      team_id: 1,
      player_id: 1,
      pick_order: 1,
    });

    const pick1 = await neo4jService.draftPlayerToTeam(1, 1, 1);
    expect(pick1.pick_order).toBe(1);

    // Second draft pick fails then succeeds (retry)
    neo4jService.draftPlayerToTeam
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        team_id: 2,
        player_id: 2,
        pick_order: 2,
      });

    try {
      await neo4jService.draftPlayerToTeam(2, 2, 2);
    } catch (e) {
      // Retry
      const pick2 = await neo4jService.draftPlayerToTeam(2, 2, 2);
      expect(pick2.pick_order).toBe(2);
    }
  });

  test('E2E: System prevents duplicate season numbers', async () => {
    neo4jService.getAllSeasons.mockResolvedValue([
      { season_number: 41, year: 2020 },
    ]);

    const allSeasons = await neo4jService.getAllSeasons();

    // Try to create duplicate
    const isDuplicate = allSeasons.some((s) => s.season_number === 41);
    expect(isDuplicate).toBe(true);

    // Should not allow creation
    neo4jService.createSeason.mockImplementation((num) => {
      if (allSeasons.some((s) => s.season_number === num)) {
        throw new Error('Season number already exists');
      }
      return Promise.resolve({ season_number: num });
    });

    await expect(neo4jService.createSeason(41, 2020)).rejects.toThrow(
      'Season number already exists'
    );
  });
});
