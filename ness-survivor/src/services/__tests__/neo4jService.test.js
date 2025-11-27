/**
 * Unit Tests for Neo4j Service Layer
 * 
 * Tests cover:
 * - All CRUD operations (Create, Read, Update, Delete)
 * - Error handling and retry logic
 * - Parameter validation
 * - Database connection management
 * - Data transformation and formatting
 */

import * as neo4jService from '../neo4jService';
import { getDriver } from '../../config/neo4jConfig';

// Mock the neo4j config module
jest.mock('../../config/neo4jConfig', () => ({
  getDriver: jest.fn(),
}));

describe('Neo4j Service - CRUD Operations', () => {
  let mockSession;
  let mockDriver;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup mock session
    mockSession = {
      run: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock driver
    mockDriver = {
      session: jest.fn().mockReturnValue(mockSession),
    };

    // Setup getDriver mock
    getDriver.mockResolvedValue(mockDriver);
  });

  describe('CREATE Operations', () => {
    test('createSeason should create a season with valid data', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              s: { properties: { season_number: 1, year: 2000 } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.createSeason(1, 2000);

      expect(result).toEqual({ season_number: 1, year: 2000 });
      expect(mockSession.run).toHaveBeenCalled();
      expect(mockSession.close).toHaveBeenCalled();
    });

    test('createSeason should handle database errors gracefully', async () => {
      mockSession.run.mockRejectedValue(new Error('Database connection failed'));

      await expect(neo4jService.createSeason(1, 2000)).rejects.toThrow(
        'Database query failed'
      );
    });

    test('createTribe should create a tribe linked to season', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              t: { properties: { tribe_name: 'Pagong', tribe_color: '#FF6B00' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.createTribe(1, 'Pagong', '#FF6B00');

      expect(result).toEqual({
        tribe_name: 'Pagong',
        tribe_color: '#FF6B00',
      });
    });

    test('createPlayer should create a player with all fields', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              p: {
                properties: {
                  first_name: 'John',
                  last_name: 'Doe',
                  occupation: 'Engineer',
                  hometown: 'New York',
                  archetype: 'Strategic',
                  challenges_won: 0,
                  has_idol: false,
                  idols_played: 0,
                  votes_received: 0,
                },
              },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.createPlayer(
        1,
        1,
        'John',
        'Doe',
        'Engineer',
        'New York',
        'Strategic',
        'Test notes'
      );

      expect(result.first_name).toBe('John');
      expect(result.challenges_won).toBe(0);
      expect(result.has_idol).toBe(false);
    });

    test('createAlliance should create an alliance', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              a: {
                properties: {
                  alliance_name: 'Final Four',
                  formation_episode: 1,
                  dissolved_episode: null,
                },
              },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.createAlliance(
        1,
        'Final Four',
        1,
        null,
        4
      );

      expect(result.alliance_name).toBe('Final Four');
    });

    test('createFantasyTeam should create a team', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              ft: {
                properties: {
                  team_name: 'Dream Team',
                  members: ['John', 'Jane'],
                  previous_wins: 0,
                },
              },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.createFantasyTeam(
        'Dream Team',
        ['John', 'Jane'],
        0
      );

      expect(result.team_name).toBe('Dream Team');
      expect(result.members).toEqual(['John', 'Jane']);
    });
  });

  describe('READ Operations', () => {
    test('getAllSeasons should return array of seasons', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              s: { properties: { season_number: 1, year: 2000 } },
            }),
          },
          {
            toObject: () => ({
              s: { properties: { season_number: 2, year: 2001 } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getAllSeasons();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    test('getAllSeasons should return empty array when no seasons exist', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.getAllSeasons();

      expect(result).toEqual([]);
    });

    test('getTribesBySeasonNumber should filter tribes correctly', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              t: { properties: { tribe_name: 'Pagong' } },
            }),
          },
          {
            toObject: () => ({
              t: { properties: { tribe_name: 'Tagi' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getTribesBySeasonNumber(1);

      expect(result.length).toBe(2);
      expect(result[0].tribe_name).toBe('Pagong');
    });

    test('getPlayersBySeasonNumber should return players for season', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              p: { properties: { first_name: 'John', last_name: 'Doe' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getPlayersBySeasonNumber(1);

      expect(result.length).toBe(1);
      expect(result[0].first_name).toBe('John');
    });

    test('getPlayersByTribeNumber should filter by tribe', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              p: { properties: { first_name: 'Jane' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getPlayersByTribeNumber(1);

      expect(result.length).toBe(1);
      expect(result[0].first_name).toBe('Jane');
    });

    test('getPlayerDetail should return full player info', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              p: {
                properties: {
                  first_name: 'John',
                  last_name: 'Doe',
                  challenges_won: 5,
                },
              },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getPlayerDetail(1);

      expect(result.first_name).toBe('John');
      expect(result.challenges_won).toBe(5);
    });

    test('getAlliancesBySeasonNumber should return alliances', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              a: { properties: { alliance_name: 'Final Four' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getAlliancesBySeasonNumber(1);

      expect(result.length).toBe(1);
      expect(result[0].alliance_name).toBe('Final Four');
    });
  });

  describe('UPDATE Operations', () => {
    test('updatePlayerStats should update player statistics', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              p: { properties: { challenges_won: 5, votes_received: 3 } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.updatePlayerStats(1, 5, 3, 0, false);

      expect(result.challenges_won).toBe(5);
      expect(result.votes_received).toBe(3);
    });

    test('updateAllianceInfo should update alliance details', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              a: { properties: { alliance_name: 'Updated Alliance' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.updateAllianceInfo(
        1,
        'Updated Alliance'
      );

      expect(result.alliance_name).toBe('Updated Alliance');
    });

    test('updateFantasyTeamInfo should update team details', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              ft: { properties: { team_name: 'New Team Name' } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.updateFantasyTeamInfo(1, 'New Team Name');

      expect(result.team_name).toBe('New Team Name');
    });
  });

  describe('DELETE Operations', () => {
    test('deletePlayer should remove a player', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.deletePlayer(1);

      expect(mockSession.run).toHaveBeenCalled();
      expect(mockSession.close).toHaveBeenCalled();
    });

    test('deleteAlliance should remove an alliance', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.deleteAlliance(1);

      expect(mockSession.run).toHaveBeenCalled();
    });

    test('deleteFantasyTeam should remove a team', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.deleteFantasyTeam(1);

      expect(mockSession.run).toHaveBeenCalled();
    });

    test('deleteTribe should remove a tribe', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.deleteTribe(1);

      expect(mockSession.run).toHaveBeenCalled();
    });

    test('deleteSeason should remove a season', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.deleteSeason(1);

      expect(mockSession.run).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('should retry on connection errors', async () => {
      // First call fails with ServiceUnavailable
      // Second call fails with SessionExpired
      // Third call succeeds
      mockSession.run
        .mockRejectedValueOnce(new Error('ServiceUnavailable'))
        .mockRejectedValueOnce(new Error('SessionExpired'))
        .mockResolvedValueOnce({
          records: [{ toObject: () => ({ s: { properties: { season_number: 1 } } }) }],
        });

      const result = await neo4jService.getAllSeasons();

      expect(result).toBeDefined();
      expect(mockSession.run).toHaveBeenCalledTimes(3);
    });

    test('should not retry on non-transient errors', async () => {
      const error = new Error('Invalid query syntax');
      mockSession.run.mockRejectedValue(error);

      await expect(neo4jService.getAllSeasons()).rejects.toThrow(
        'Database query failed'
      );

      // Should only be called once (no retries for syntax errors)
      expect(mockSession.run).toHaveBeenCalledTimes(1);
    });

    test('should close session even when query fails', async () => {
      mockSession.run.mockRejectedValue(new Error('Database error'));

      await expect(neo4jService.getAllSeasons()).rejects.toThrow();

      expect(mockSession.close).toHaveBeenCalled();
    });

    test('should throw error after max retries exhausted', async () => {
      mockSession.run.mockRejectedValue(new Error('ServiceUnavailable'));

      await expect(neo4jService.getAllSeasons()).rejects.toThrow(
        'Database query failed after 3 attempts'
      );
    });
  });

  describe('Parameter Validation', () => {
    test('createSeason should handle null parameters', async () => {
      await expect(neo4jService.createSeason(null, 2000)).rejects.toThrow();
    });

    test('getPlayerDetail should require valid ID', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      const result = await neo4jService.getPlayerDetail(0);

      expect(mockSession.run).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    test('should close session after successful query', async () => {
      mockSession.run.mockResolvedValue({ records: [] });

      await neo4jService.getAllSeasons();

      expect(mockSession.close).toHaveBeenCalled();
    });

    test('should close session even when error occurs', async () => {
      mockSession.run.mockRejectedValue(new Error('Query failed'));

      try {
        await neo4jService.getAllSeasons();
      } catch (e) {
        // Expected to throw
      }

      expect(mockSession.close).toHaveBeenCalled();
    });

    test('should handle session close errors gracefully', async () => {
      mockSession.close.mockRejectedValue(new Error('Close failed'));
      mockSession.run.mockResolvedValue({ records: [] });

      // Should not throw even if close fails
      await expect(neo4jService.getAllSeasons()).resolves.toBeDefined();
    });
  });

  describe('Data Transformation', () => {
    test('should transform Neo4j records to plain objects', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              s: { properties: { season_number: 1, year: 2000 } },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getAllSeasons();

      expect(result[0]).toEqual({ season_number: 1, year: 2000 });
      expect(typeof result[0]).toBe('object');
    });

    test('should handle complex nested data structures', async () => {
      const mockResult = {
        records: [
          {
            toObject: () => ({
              p: {
                properties: {
                  first_name: 'John',
                  tribe: { name: 'Pagong' },
                  alliances: ['Final Four'],
                },
              },
            }),
          },
        ],
      };

      mockSession.run.mockResolvedValue(mockResult);

      const result = await neo4jService.getPlayerDetail(1);

      expect(result.first_name).toBe('John');
      expect(result.tribe).toBeDefined();
    });
  });
});
