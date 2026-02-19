/**
 * Neo4j Service Layer - HTTP Client
 * 
 * Thin wrapper that calls the Express API on the server.
 * All function signatures match the original so no component changes are needed.
 */

const API_BASE = '/api';

const request = async (method, path, body = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API request failed: ${res.status}`);
  }
  return res.json();
};

// ============================================
// CREATE OPERATIONS
// ============================================

export const createSeason = (season_number, year) =>
  request('POST', '/seasons', { season_number, year });

export const createTribe = (season_number, tribe_name, tribe_color) =>
  request('POST', `/seasons/${season_number}/tribes`, { tribe_name, tribe_color });

export const createPlayer = (season_number, tribe_name, first_name, last_name, occupation, hometown, archetype, notes) =>
  request('POST', `/seasons/${season_number}/players`, { tribe_name, first_name, last_name, occupation, hometown, archetype, notes });

export const createAlliance = (season_number, alliance_name, formation_episode, dissolved_episode, size, notes) =>
  request('POST', `/seasons/${season_number}/alliances`, { alliance_name, formation_episode, dissolved_episode, size, notes });

export const addPlayerToAlliance = (first_name, last_name, alliance_name) =>
  request('POST', `/alliances/${encodeURIComponent(alliance_name)}/players`, { first_name, last_name });

export const draftPlayerToTeam = (first_name, last_name, team_name) =>
  request('POST', `/fantasy-teams/${encodeURIComponent(team_name)}/draft`, { first_name, last_name });

// ============================================
// READ OPERATIONS
// ============================================

export const getAllSeasons = () =>
  request('GET', '/seasons');

export const getTribesInSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/tribes`);

export const getPlayersInSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/players`);

export const getPlayersOnTribe = (tribe_name) =>
  request('GET', `/tribes/${encodeURIComponent(tribe_name)}/players`);

export const getPlayerDetails = (first_name, last_name) =>
  request('GET', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}`);

export const getPlayersInAlliance = (alliance_name) =>
  request('GET', `/alliances/${encodeURIComponent(alliance_name)}/players`);

export const getFantasyTeamWithPlayers = (team_name) =>
  request('GET', `/fantasy-teams/${encodeURIComponent(team_name)}`);

export const getAllFantasyTeams = () =>
  request('GET', '/fantasy-teams');

export const getSeasonOverview = (season_number) =>
  request('GET', `/seasons/${season_number}/overview`);

// ============================================
// UPDATE OPERATIONS
// ============================================

export const updateSeason = (season_number, updates) =>
  request('PATCH', `/seasons/${season_number}`, updates);

export const updateTribe = (tribe_name, season_number, updates) =>
  request('PATCH', `/seasons/${season_number}/tribes/${encodeURIComponent(tribe_name)}`, updates);

export const updatePlayerStats = (first_name, last_name, challenges_won, has_idol, idols_played, votes_received) =>
  request('PUT', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/stats`, { challenges_won, has_idol, idols_played, votes_received });

export const updatePlayerNotes = (first_name, last_name, notes) =>
  request('PATCH', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/notes`, { notes });

export const updatePlayerBasicInfo = (first_name, last_name, occupation, hometown, archetype) =>
  request('PATCH', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/info`, { occupation, hometown, archetype });

export const updatePlayer = (first_name, last_name, updates) =>
  request('PATCH', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}`, updates);

export const movePlayerToTribe = (first_name, last_name, new_tribe_name) =>
  request('POST', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/move-tribe`, { new_tribe_name });

export const updateAlliance = (alliance_name, dissolved_episode, notes) =>
  request('PATCH', `/alliances/${encodeURIComponent(alliance_name)}`, { dissolved_episode, notes });

export const incrementPlayerChallengeWins = (first_name, last_name) =>
  request('POST', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/challenge-win`);

export const incrementPlayerVotesReceived = (first_name, last_name) =>
  request('POST', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/vote-received`);

export const togglePlayerIdolStatus = (first_name, last_name) =>
  request('POST', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/toggle-idol`);

// ============================================
// DELETE OPERATIONS
// ============================================

export const removePlayerFromAlliance = (first_name, last_name, alliance_name) =>
  request('DELETE', `/alliances/${encodeURIComponent(alliance_name)}/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}`);

export const removePlayerFromFantasyTeam = (first_name, last_name) =>
  request('DELETE', `/fantasy-teams/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}`);

export const deletePlayer = (first_name, last_name) =>
  request('DELETE', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}`);

export const deleteAlliance = (alliance_name) =>
  request('DELETE', `/alliances/${encodeURIComponent(alliance_name)}`);

export const deleteTribe = (tribe_name, season_number) =>
  request('DELETE', `/seasons/${season_number}/tribes/${encodeURIComponent(tribe_name)}`);

export const deleteSeason = (season_number) =>
  request('DELETE', `/seasons/${season_number}`);

// ============================================
// UTILITY / STATS
// ============================================

export const getPlayerStatsSummary = (season_number) =>
  request('GET', `/seasons/${season_number}/stats`);

export const getFantasyTeamLeaderboard = () =>
  request('GET', '/fantasy-teams/leaderboard');

export const playerExists = async (first_name, last_name) => {
  const result = await request('GET', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/exists`);
  return result.exists;
};

export const getAvailablePlayersInSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/players/available`);

export const getAlliancesInSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/alliances`);

// ============================================
// FANTASY TEAMS
// ============================================

export const createFantasyTeam = (team_name, owners, season_number) =>
  request('POST', `/seasons/${season_number}/fantasy-teams`, { team_name, owners });

export const updateFantasyTeam = (team_name, owners) =>
  request('PATCH', `/fantasy-teams/${encodeURIComponent(team_name)}`, { owners });

export const deleteFantasyTeam = (team_name) =>
  request('DELETE', `/fantasy-teams/${encodeURIComponent(team_name)}`);

export const getFantasyTeamsInSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/fantasy-teams`);

// ============================================
// DRAFT PICKS
// ============================================

export const createDraftPick = (season_number, round, pick_number, player_name, team_name) =>
  request('POST', `/seasons/${season_number}/draft-picks`, { round, pick_number, player_name, team_name });

export const deleteDraftPick = (season_number, round, pick_number) =>
  request('DELETE', `/seasons/${season_number}/draft-picks/${round}/${pick_number}`);

export const getDraftPicksForSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/draft-picks`);

// ============================================
// ELIMINATIONS / RESERVES
// ============================================

export const finalizeReserves = (season_number) =>
  request('POST', `/seasons/${season_number}/finalize-reserves`);

export const getReservePlayers = (season_number) =>
  request('GET', `/seasons/${season_number}/players/reserves`);

export const eliminatePlayer = (first_name, last_name) =>
  request('POST', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/eliminate`);

export const replaceWithReserve = (reserve_first_name, reserve_last_name, team_name) =>
  request('POST', `/fantasy-teams/${encodeURIComponent(team_name)}/replace-reserve`, { reserve_first_name, reserve_last_name });

export const getTeamsEligibleForReserves = (season_number) =>
  request('GET', `/seasons/${season_number}/teams/eligible-for-reserves`);

// ============================================
// EVENTS
// ============================================

export const createEvent = (first_name, last_name, event_type, episode_number, season_number, notes = '') =>
  request('POST', `/seasons/${season_number}/events`, { first_name, last_name, event_type, episode_number, notes });

export const getEventsForPlayer = (first_name, last_name) =>
  request('GET', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/events`);

export const getEventsForSeason = (season_number) =>
  request('GET', `/seasons/${season_number}/events`);

export const deleteEvent = (event_id) =>
  request('DELETE', `/events/${encodeURIComponent(event_id)}`);

export const getEventCountsForPlayer = (first_name, last_name) =>
  request('GET', `/players/${encodeURIComponent(first_name)}/${encodeURIComponent(last_name)}/event-counts`);

export const createBulkEvents = (players, event_type, episode_number, season_number, notes = '') =>
  request('POST', `/seasons/${season_number}/events/bulk`, { players, event_type, episode_number, notes });
