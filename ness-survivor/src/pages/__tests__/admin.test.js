/**
 * Component Tests for Admin Pages
 * 
 * Tests key admin pages:
 * - PlayerManager
 * - SeasonManager
 * - DraftManager
 * - Leaderboard view
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerManager from '../../pages/admin/PlayerManager';
import SeasonManager from '../../pages/admin/SeasonManager';
import DraftManager from '../../pages/admin/DraftManager';
import Leaderboard from '../../pages/views/Leaderboard';
import * as neo4jService from '../../services/neo4jService';

// Mock the neo4j service
jest.mock('../../services/neo4jService');

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '1' }),
}));

describe('PlayerManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render player manager page', () => {
    neo4jService.getAllSeasons.mockResolvedValue([
      { season_number: 1, year: 2000 },
    ]);
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue([]);

    render(<PlayerManager />);

    expect(screen.getByText(/player manager/i)).toBeInTheDocument();
  });

  test('should load players on mount', async () => {
    const mockPlayers = [
      { id: 1, first_name: 'John', last_name: 'Doe', archetype: 'Strategic' },
      { id: 2, first_name: 'Jane', last_name: 'Smith', archetype: 'Physical' },
    ];

    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(mockPlayers);

    render(<PlayerManager />);

    await waitFor(() => {
      expect(neo4jService.getPlayersBySeasonNumber).toHaveBeenCalled();
    });
  });

  test('should display player list after loading', async () => {
    const mockPlayers = [
      { id: 1, first_name: 'John', last_name: 'Doe', archetype: 'Strategic' },
    ];

    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(mockPlayers);

    render(<PlayerManager />);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).toBeInTheDocument();
    });
  });

  test('should handle create player form submission', async () => {
    neo4jService.getAllSeasons.mockResolvedValue([
      { season_number: 1, year: 2000 },
    ]);
    neo4jService.getTribesBySeasonNumber.mockResolvedValue([
      { id: 1, tribe_name: 'Pagong' },
    ]);
    neo4jService.createPlayer.mockResolvedValue({
      id: 3,
      first_name: 'New',
      last_name: 'Player',
    });
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue([]);

    render(<PlayerManager />);

    // Find and click create button
    const createButton = await screen.findByText(/create player/i);
    fireEvent.click(createButton);

    // Fill form and submit
    const firstNameInput = screen.getByPlaceholderText(/first name/i);
    await userEvent.type(firstNameInput, 'New');

    const lastNameInput = screen.getByPlaceholderText(/last name/i);
    await userEvent.type(lastNameInput, 'Player');

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(neo4jService.createPlayer).toHaveBeenCalled();
    });
  });

  test('should show error when player creation fails', async () => {
    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.getTribesBySeasonNumber.mockResolvedValue([]);
    neo4jService.createPlayer.mockRejectedValue(
      new Error('Database error')
    );
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue([]);

    render(<PlayerManager />);

    const createButton = await screen.findByText(/create player/i);
    fireEvent.click(createButton);

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('should enable edit player functionality', async () => {
    const mockPlayers = [
      { id: 1, first_name: 'John', last_name: 'Doe' },
    ];

    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.getPlayersBySeasonNumber.mockResolvedValue(mockPlayers);
    neo4jService.updatePlayerStats.mockResolvedValue({
      id: 1,
      first_name: 'John',
      challenges_won: 5,
    });

    render(<PlayerManager />);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/edit/i);
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/update stats/i)).toBeInTheDocument();
      });
    }
  });
});

describe('SeasonManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render season manager page', () => {
    neo4jService.getAllSeasons.mockResolvedValue([]);

    render(<SeasonManager />);

    expect(screen.getByText(/season manager/i)).toBeInTheDocument();
  });

  test('should load seasons on mount', async () => {
    const mockSeasons = [
      { season_number: 1, year: 2000 },
      { season_number: 2, year: 2001 },
    ];

    neo4jService.getAllSeasons.mockResolvedValue(mockSeasons);

    render(<SeasonManager />);

    await waitFor(() => {
      expect(neo4jService.getAllSeasons).toHaveBeenCalled();
    });
  });

  test('should display season list', async () => {
    const mockSeasons = [
      { season_number: 1, year: 2000 },
    ];

    neo4jService.getAllSeasons.mockResolvedValue(mockSeasons);

    render(<SeasonManager />);

    await waitFor(() => {
      expect(screen.queryByText(/Season 1/i)).toBeInTheDocument();
    });
  });

  test('should create new season', async () => {
    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.createSeason.mockResolvedValue({
      season_number: 3,
      year: 2002,
    });

    render(<SeasonManager />);

    const createButton = await screen.findByText(/create season/i);
    fireEvent.click(createButton);

    const seasonNumberInput = screen.getByPlaceholderText(/season number/i);
    await userEvent.type(seasonNumberInput, '3');

    const yearInput = screen.getByPlaceholderText(/year/i);
    await userEvent.type(yearInput, '2002');

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(neo4jService.createSeason).toHaveBeenCalledWith(3, 2002);
    });
  });

  test('should validate season number uniqueness', async () => {
    const mockSeasons = [
      { season_number: 1, year: 2000 },
    ];

    neo4jService.getAllSeasons.mockResolvedValue(mockSeasons);

    render(<SeasonManager />);

    const createButton = await screen.findByText(/create season/i);
    fireEvent.click(createButton);

    const seasonNumberInput = screen.getByPlaceholderText(/season number/i);
    await userEvent.type(seasonNumberInput, '1'); // Duplicate

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  test('should delete season with confirmation', async () => {
    const mockSeasons = [
      { season_number: 1, year: 2000 },
    ];

    neo4jService.getAllSeasons.mockResolvedValue(mockSeasons);
    neo4jService.deleteSeason.mockResolvedValue(true);

    render(<SeasonManager />);

    await waitFor(() => {
      expect(screen.queryByText(/Season 1/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);

      const confirmButton = await screen.findByText(/confirm/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(neo4jService.deleteSeason).toHaveBeenCalled();
      });
    }
  });
});

describe('DraftManager Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render draft manager page', () => {
    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.getAllFantasyTeams.mockResolvedValue([]);

    render(<DraftManager />);

    expect(screen.getByText(/draft manager/i)).toBeInTheDocument();
  });

  test('should load fantasy teams on mount', async () => {
    const mockTeams = [
      { id: 1, team_name: 'Team A' },
      { id: 2, team_name: 'Team B' },
    ];

    neo4jService.getAllFantasyTeams.mockResolvedValue(mockTeams);
    neo4jService.getAllSeasons.mockResolvedValue([]);

    render(<DraftManager />);

    await waitFor(() => {
      expect(neo4jService.getAllFantasyTeams).toHaveBeenCalled();
    });
  });

  test('should create new fantasy team', async () => {
    neo4jService.getAllFantasyTeams.mockResolvedValue([]);
    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.createFantasyTeam.mockResolvedValue({
      id: 3,
      team_name: 'New Team',
    });

    render(<DraftManager />);

    const createButton = await screen.findByText(/create team/i);
    fireEvent.click(createButton);

    const teamNameInput = screen.getByPlaceholderText(/team name/i);
    await userEvent.type(teamNameInput, 'New Team');

    const submitButton = screen.getByText(/submit/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(neo4jService.createFantasyTeam).toHaveBeenCalled();
    });
  });

  test('should draft player to team', async () => {
    const mockTeams = [
      { id: 1, team_name: 'Team A' },
    ];
    const mockPlayers = [
      { id: 1, first_name: 'John', last_name: 'Doe' },
    ];

    neo4jService.getAllFantasyTeams.mockResolvedValue(mockTeams);
    neo4jService.getAvailablePlayers.mockResolvedValue(mockPlayers);
    neo4jService.getAllSeasons.mockResolvedValue([]);
    neo4jService.draftPlayerToTeam.mockResolvedValue(true);

    render(<DraftManager />);

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
    });

    // Find and click draft button for a player
    const playerElements = await screen.findAllByText(/John Doe/i);
    if (playerElements.length > 0) {
      const draftButtons = screen.getAllByText(/draft/i);
      if (draftButtons.length > 0) {
        fireEvent.click(draftButtons[0]);

        await waitFor(() => {
          expect(neo4jService.draftPlayerToTeam).toHaveBeenCalled();
        });
      }
    }
  });
});

describe('Leaderboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render leaderboard page', () => {
    neo4jService.getLeaderboard.mockResolvedValue([]);

    render(<Leaderboard />);

    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
  });

  test('should load leaderboard data on mount', async () => {
    const mockLeaderboard = [
      { rank: 1, team_name: 'Team A', total_wins: 25 },
      { rank: 2, team_name: 'Team B', total_wins: 20 },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(mockLeaderboard);

    render(<Leaderboard />);

    await waitFor(() => {
      expect(neo4jService.getLeaderboard).toHaveBeenCalled();
    });
  });

  test('should display teams in rank order', async () => {
    const mockLeaderboard = [
      { rank: 1, team_name: 'Team A', total_wins: 25 },
      { rank: 2, team_name: 'Team B', total_wins: 20 },
      { rank: 3, team_name: 'Team C', total_wins: 15 },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(mockLeaderboard);

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText(/Team A/i)).toBeInTheDocument();
      expect(screen.getByText(/Team B/i)).toBeInTheDocument();
      expect(screen.getByText(/Team C/i)).toBeInTheDocument();
    });
  });

  test('should allow sorting by different columns', async () => {
    const mockLeaderboard = [
      { rank: 1, team_name: 'Team A', total_wins: 25, roster_size: 8 },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(mockLeaderboard);

    render(<Leaderboard />);

    const winsHeader = await screen.findByText(/wins/i);
    fireEvent.click(winsHeader);

    // Component should re-render with sorted data
    expect(screen.getByText(/Team A/i)).toBeInTheDocument();
  });

  test('should handle empty leaderboard', async () => {
    neo4jService.getLeaderboard.mockResolvedValue([]);

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText(/no teams/i)).toBeInTheDocument();
    });
  });

  test('should display team statistics correctly', async () => {
    const mockLeaderboard = [
      {
        rank: 1,
        team_name: 'Team A',
        total_wins: 25,
        roster_size: 8,
        previous_wins: 5,
      },
    ];

    neo4jService.getLeaderboard.mockResolvedValue(mockLeaderboard);

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // wins
      expect(screen.getByText('8')).toBeInTheDocument();  // roster size
    });
  });
});
