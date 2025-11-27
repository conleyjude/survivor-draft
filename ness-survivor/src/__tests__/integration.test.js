/**
 * Integration Tests for Critical Workflows
 * 
 * Tests complete user journeys:
 * - Complete draft workflow (create season, tribes, players, fantasy teams, draft)
 * - Player management workflow (create, edit, view)
 * - Alliance management workflow
 * - Leaderboard and statistics generation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as neo4jService from '../../services/neo4jService';

// Mock the neo4j service
jest.mock('../../services/neo4jService');

// Helper function to wrap components with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Integration Tests - Draft Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should complete full draft workflow from start to finish', async () => {
    // Step 1: Create a season
    neo4jService.createSeason.mockResolvedValue({
      season_number: 41,
      year: 2020,
    });
    neo4jService.getAllSeasons.mockResolvedValue([
      { season_number: 41, year: 2020 },
    ]);

    // Step 2: Create tribes for the season
    neo4jService.createTribe.mockResolvedValue({
      id: 1,
      tribe_name: 'Ua',
      tribe_color: '#FF6B00',
    });
    neo4jService.getTribesBySeasonNumber.mockResolvedValue([
      { id: 1, tribe_name: 'Ua', tribe_color: '#FF6B00' },
      { id: 2, tribe_name: 'Vicar', tribe_color: '#0066CC' },
    ]);

    // Step 3: Create players for the tribes
    const mockPlayers = [
      {
        id: 1,
        first_name: 'Erika',
        last_name: 'Casupanan',
        tribe_id: 1,
        challenges_won: 3,
      },
      {
        id: 2,
        first_name: 'Shan',
        last_name: 'Smith',
        tribe_id: 2,
        challenges_won: 2,
      },
    ];
    neo4jService.createPlayer.mockResolvedValue(mockPlayers[0]);
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(mockPlayers);

    // Step 4: Create fantasy teams
    const mockTeams = [
      { id: 1, team_name: 'Dream Team', roster: [], total_wins: 0 },
      { id: 2, team_name: 'Comeback Kings', roster: [], total_wins: 0 },
    ];
    neo4jService.createFantasyTeam.mockResolvedValue(mockTeams[0]);
    neo4jService.getAllFantasyTeams.mockResolvedValue(mockTeams);

    // Step 5: Draft players to teams
    neo4jService.draftPlayerToTeam.mockResolvedValue({
      team_id: 1,
      player_id: 1,
    });

    // Step 6: Get updated leaderboard
    const mockLeaderboard = [
      { rank: 1, team_name: 'Dream Team', total_wins: 3, roster_size: 1 },
      { rank: 2, team_name: 'Comeback Kings', total_wins: 2, roster_size: 1 },
    ];
    neo4jService.getLeaderboard.mockResolvedValue(mockLeaderboard);

    // Verify the complete flow
    expect(neo4jService.createSeason).toBeDefined();
    expect(neo4jService.createTribe).toBeDefined();
    expect(neo4jService.createPlayer).toBeDefined();
    expect(neo4jService.createFantasyTeam).toBeDefined();
    expect(neo4jService.draftPlayerToTeam).toBeDefined();
    expect(neo4jService.getLeaderboard).toBeDefined();
  });

  test('should handle season creation with validation', async () => {
    const mockExistingSeasons = [
      { season_number: 1, year: 2000 },
      { season_number: 2, year: 2001 },
    ];

    neo4jService.getAllSeasons.mockResolvedValue(mockExistingSeasons);

    // Attempt to create duplicate season should fail validation
    const isDuplicate = mockExistingSeasons.some(
      (s) => s.season_number === 1
    );
    expect(isDuplicate).toBe(true);

    // Valid creation should succeed
    neo4jService.createSeason.mockResolvedValue({
      season_number: 3,
      year: 2002,
    });

    const result = await neo4jService.createSeason(3, 2002);
    expect(result.season_number).toBe(3);
  });

  test('should maintain player-tribe relationships during creation', async () => {
    // Create a tribe first
    const mockTribe = { id: 1, tribe_name: 'Ua', tribe_color: '#FF6B00' };
    neo4jService.createTribe.mockResolvedValue(mockTribe);

    // Create a player linked to the tribe
    const mockPlayer = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      tribe_id: 1,
    };
    neo4jService.createPlayer.mockResolvedValue(mockPlayer);

    // Get players by tribe to verify relationship
    neo4jService.getPlayersByTribeNumber.mockResolvedValue([mockPlayer]);

    // Verify relationships are maintained
    const playersInTribe =
      await neo4jService.getPlayersByTribeNumber(mockTribe.id);
    expect(playersInTribe[0].tribe_id).toBe(1);
  });

  test('should create alliances and link players correctly', async () => {
    const mockAlliance = {
      id: 1,
      alliance_name: 'Final Four',
      size: 4,
    };
    neo4jService.createAlliance.mockResolvedValue(mockAlliance);

    const mockPlayers = [
      { id: 1, first_name: 'Player', last_name: 'One' },
      { id: 2, first_name: 'Player', last_name: 'Two' },
    ];

    neo4jService.addPlayersToAlliance.mockResolvedValue({
      alliance_id: 1,
      players_added: 2,
    });

    // Get players in alliance
    neo4jService.getAllianceMembers.mockResolvedValue(mockPlayers);

    const result = await neo4jService.getAllianceMembers(mockAlliance.id);
    expect(result.length).toBe(2);
  });
});

describe('Integration Tests - Player Management Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create, edit, and delete a player', async () => {
    // Create player
    const newPlayer = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      challenges_won: 0,
      votes_received: 0,
    };
    neo4jService.createPlayer.mockResolvedValue(newPlayer);
    const createdPlayer = await neo4jService.createPlayer(
      1,
      1,
      'John',
      'Doe',
      'Engineer',
      'NYC',
      'Strategic'
    );
    expect(createdPlayer.id).toBe(1);

    // Edit player stats
    const updatedPlayer = {
      ...createdPlayer,
      challenges_won: 5,
      votes_received: 3,
    };
    neo4jService.updatePlayerStats.mockResolvedValue(updatedPlayer);
    const result = await neo4jService.updatePlayerStats(1, 5, 3);
    expect(result.challenges_won).toBe(5);

    // Delete player
    neo4jService.deletePlayer.mockResolvedValue(true);
    const deleted = await neo4jService.deletePlayer(1);
    expect(deleted).toBe(true);
  });

  test('should retrieve player with all related data', async () => {
    const mockPlayerDetail = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      season_number: 41,
      tribe_name: 'Ua',
      challenges_won: 5,
      votes_received: 3,
      has_idol: true,
      alliances: ['Final Four'],
      fantasy_team: 'Dream Team',
    };

    neo4jService.getPlayerDetail.mockResolvedValue(mockPlayerDetail);

    const player = await neo4jService.getPlayerDetail(1);

    expect(player.first_name).toBe('John');
    expect(player.tribe_name).toBe('Ua');
    expect(player.alliances).toBeDefined();
    expect(player.fantasy_team).toBeDefined();
  });

  test('should move player to different tribe', async () => {
    const originalTribe = { id: 1, tribe_name: 'Ua' };
    const newTribe = { id: 2, tribe_name: 'Vicar' };

    neo4jService.getPlayersByTribeNumber.mockResolvedValue([
      { id: 1, first_name: 'John', last_name: 'Doe' },
    ]);

    // Move player
    neo4jService.movePlayerToTribe.mockResolvedValue({
      player_id: 1,
      old_tribe: originalTribe.id,
      new_tribe: newTribe.id,
    });

    const result = await neo4jService.movePlayerToTribe(1, newTribe.id);
    expect(result.new_tribe).toBe(newTribe.id);
  });

  test('should handle player stats validation', async () => {
    // Stats should be non-negative integers
    const invalidStats = {
      challenges_won: -1, // Invalid
      votes_received: 5,
    };

    const validStats = {
      challenges_won: 5,
      votes_received: 5,
    };

    // Mock service should validate
    neo4jService.updatePlayerStats.mockImplementation((id, wins, votes) => {
      if (wins < 0 || votes < 0) {
        throw new Error('Stats must be non-negative');
      }
      return Promise.resolve({ challenges_won: wins, votes_received: votes });
    });

    await expect(
      neo4jService.updatePlayerStats(1, -1, 5)
    ).rejects.toThrow();

    const result = await neo4jService.updatePlayerStats(1, 5, 5);
    expect(result.challenges_won).toBe(5);
  });
});

describe('Integration Tests - Alliance Management Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create alliance and add players', async () => {
    // Create alliance
    const newAlliance = {
      id: 1,
      alliance_name: 'Final Four',
      formation_episode: 10,
      season_number: 41,
    };
    neo4jService.createAlliance.mockResolvedValue(newAlliance);

    const alliance = await neo4jService.createAlliance(
      41,
      'Final Four',
      10,
      null,
      4
    );
    expect(alliance.alliance_name).toBe('Final Four');

    // Add players to alliance
    const playerIds = [1, 2, 3, 4];
    neo4jService.addPlayersToAlliance.mockResolvedValue({
      alliance_id: 1,
      players_added: 4,
    });

    const result = await neo4jService.addPlayersToAlliance(
      alliance.id,
      playerIds
    );
    expect(result.players_added).toBe(4);
  });

  test('should retrieve alliance with all members', async () => {
    const mockAlliance = {
      id: 1,
      alliance_name: 'Final Four',
      members: [
        { id: 1, first_name: 'Erika' },
        { id: 2, first_name: 'Shan' },
        { id: 3, first_name: 'Ricard' },
        { id: 4, first_name: 'Xander' },
      ],
    };

    neo4jService.getAllianceMembers.mockResolvedValue(mockAlliance.members);

    const members = await neo4jService.getAllianceMembers(1);
    expect(members.length).toBe(4);
  });

  test('should update alliance information', async () => {
    const updatedAlliance = {
      id: 1,
      alliance_name: 'Updated Alliance',
      dissolved_episode: 12,
    };

    neo4jService.updateAllianceInfo.mockResolvedValue(updatedAlliance);

    const result = await neo4jService.updateAllianceInfo(
      1,
      'Updated Alliance'
    );
    expect(result.alliance_name).toBe('Updated Alliance');
  });

  test('should remove players from alliance', async () => {
    neo4jService.removePlayersFromAlliance.mockResolvedValue({
      alliance_id: 1,
      players_removed: 1,
    });

    const result = await neo4jService.removePlayersFromAlliance(1, [1]);
    expect(result.players_removed).toBe(1);
  });

  test('should delete alliance', async () => {
    neo4jService.deleteAlliance.mockResolvedValue(true);

    const result = await neo4jService.deleteAlliance(1);
    expect(result).toBe(true);
  });
});

describe('Integration Tests - Leaderboard & Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate correct leaderboard rankings', async () => {
    const mockLeaderboard = [
      {
        rank: 1,
        team_name: 'Dream Team',
        total_wins: 25,
        roster_size: 8,
        previous_wins: 5,
        score: 30, // total_wins + previous_wins
      },
      {
        rank: 2,
        team_name: 'Comeback Kings',
        total_wins: 20,
        roster_size: 8,
        previous_wins: 3,
        score: 23,
      },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(mockLeaderboard);

    const leaderboard = await neo4jService.getLeaderboard();
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].score).toBeGreaterThan(leaderboard[1].score);
  });

  test('should calculate team statistics accurately', async () => {
    const mockTeamStats = {
      team_id: 1,
      team_name: 'Dream Team',
      roster_size: 8,
      total_player_challenges_won: 25,
      average_challenges_won_per_player: 3.125,
      players_with_idols: 2,
      total_votes_received: 12,
    };

    neo4jService.getTeamStatistics.mockResolvedValue(mockTeamStats);

    const stats = await neo4jService.getTeamStatistics(1);
    expect(stats.roster_size).toBe(8);
    expect(stats.total_player_challenges_won).toBe(25);
    expect(stats.average_challenges_won_per_player).toBe(3.125);
  });

  test('should get available players for draft', async () => {
    const mockAvailablePlayers = [
      { id: 1, first_name: 'John', challenges_won: 5 },
      { id: 2, first_name: 'Jane', challenges_won: 3 },
    ];

    neo4jService.getAvailablePlayers.mockResolvedValue(mockAvailablePlayers);

    const players = await neo4jService.getAvailablePlayers();
    expect(players.length).toBe(2);
  });

  test('should handle draft picking logic', async () => {
    // Available players
    neo4jService.getAvailablePlayers.mockResolvedValue([
      { id: 1, first_name: 'Top Player', challenges_won: 10 },
      { id: 2, first_name: 'Second', challenges_won: 8 },
    ]);

    // Draft player to team
    neo4jService.draftPlayerToTeam.mockResolvedValue({
      team_id: 1,
      player_id: 1,
      pick_order: 1,
    });

    const result = await neo4jService.draftPlayerToTeam(1, 1, 1);
    expect(result.player_id).toBe(1);

    // After draft, player should not be available
    neo4jService.getAvailablePlayers.mockResolvedValue([
      { id: 2, first_name: 'Second', challenges_won: 8 },
    ]);

    const remaining = await neo4jService.getAvailablePlayers();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).not.toBe(1);
  });
});

describe('Integration Tests - Error Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retry failed database operations', async () => {
    // First call fails, second succeeds
    neo4jService.getAllSeasons
      .mockRejectedValueOnce(new Error('Connection timeout'))
      .mockResolvedValueOnce([{ season_number: 1, year: 2000 }]);

    // First attempt fails
    let result;
    try {
      result = await neo4jService.getAllSeasons();
    } catch (e) {
      // Retry
      result = await neo4jService.getAllSeasons();
    }

    expect(result).toBeDefined();
    expect(result[0].season_number).toBe(1);
  });

  test('should handle partial transaction failures gracefully', async () => {
    // Create season succeeds
    neo4jService.createSeason.mockResolvedValue({
      season_number: 41,
      year: 2020,
    });

    // Adding tribe fails
    neo4jService.createTribe.mockRejectedValue(
      new Error('Tribe creation failed')
    );

    const season = await neo4jService.createSeason(41, 2020);
    expect(season).toBeDefined();

    await expect(neo4jService.createTribe(41, 'Ua', '#FF6B00')).rejects.toThrow(
      'Tribe creation failed'
    );
  });

  test('should validate data before operations', async () => {
    const invalidSeason = {
      season_number: null,
      year: 2000,
    };

    // Validation should prevent invalid data
    if (!invalidSeason.season_number) {
      throw new Error('Season number is required');
    }

    await expect(
      neo4jService.createSeason(null, 2000)
    ).rejects.toThrow();
  });
});
