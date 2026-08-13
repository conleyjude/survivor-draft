const express = require('express');
const router = express.Router();
const db = require('./neo4jService');

// Helper: wrap async route handlers
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ============================================
// SEASONS
// ============================================

router.get('/seasons', wrap(async (req, res) => {
  res.json(await db.getAllSeasons());
}));

router.post('/seasons', wrap(async (req, res) => {
  const { season_number, year } = req.body;
  res.json(await db.createSeason(season_number, year));
}));

router.patch('/seasons/:seasonNumber', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.updateSeason(season_number, req.body));
}));

router.delete('/seasons/:seasonNumber', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json({ success: await db.deleteSeason(season_number) });
}));

router.get('/seasons/:seasonNumber/overview', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getSeasonOverview(season_number));
}));

router.get('/seasons/:seasonNumber/stats', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getPlayerStatsSummary(season_number));
}));

// ============================================
// TRIBES
// ============================================

router.get('/seasons/:seasonNumber/tribes', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getTribesInSeason(season_number));
}));

router.post('/seasons/:seasonNumber/tribes', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { tribe_name, tribe_color } = req.body;
  res.json(await db.createTribe(season_number, tribe_name, tribe_color));
}));

router.patch('/seasons/:seasonNumber/tribes/:tribeName', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const tribe_name = req.params.tribeName;
  res.json(await db.updateTribe(tribe_name, season_number, req.body));
}));

router.delete('/seasons/:seasonNumber/tribes/:tribeName', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const tribe_name = req.params.tribeName;
  res.json({ success: await db.deleteTribe(tribe_name, season_number) });
}));

router.get('/tribes/:tribeName/players', wrap(async (req, res) => {
  res.json(await db.getPlayersOnTribe(req.params.tribeName));
}));

// ============================================
// PLAYERS
// ============================================

router.get('/seasons/:seasonNumber/players', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getPlayersInSeason(season_number));
}));

router.get('/seasons/:seasonNumber/players/available', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getAvailablePlayersInSeason(season_number));
}));

router.post('/seasons/:seasonNumber/players', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { tribe_name, first_name, last_name, occupation, hometown, archetype, notes, age, photo_url } = req.body;
  res.json(await db.createPlayer(season_number, tribe_name, first_name, last_name, occupation, hometown, archetype, notes, age, photo_url));
}));

router.get('/players/:firstName/:lastName', wrap(async (req, res) => {
  res.json(await db.getPlayerDetails(req.params.firstName, req.params.lastName));
}));

router.put('/players/:firstName/:lastName/stats', wrap(async (req, res) => {
  const { firstName, lastName } = req.params;
  const { challenges_won, has_idol, idols_played, votes_received } = req.body;
  res.json(await db.updatePlayerStats(firstName, lastName, challenges_won, has_idol, idols_played, votes_received));
}));

router.patch('/players/:firstName/:lastName/notes', wrap(async (req, res) => {
  const { firstName, lastName } = req.params;
  res.json(await db.updatePlayerNotes(firstName, lastName, req.body.notes));
}));

router.patch('/players/:firstName/:lastName/info', wrap(async (req, res) => {
  const { firstName, lastName } = req.params;
  const { occupation, hometown, archetype } = req.body;
  res.json(await db.updatePlayerBasicInfo(firstName, lastName, occupation, hometown, archetype));
}));

router.patch('/players/:firstName/:lastName', wrap(async (req, res) => {
  const { firstName, lastName } = req.params;
  res.json(await db.updatePlayer(firstName, lastName, req.body));
}));

router.post('/players/:firstName/:lastName/move-tribe', wrap(async (req, res) => {
  const { firstName, lastName } = req.params;
  res.json(await db.movePlayerToTribe(firstName, lastName, req.body.new_tribe_name));
}));

router.post('/players/:firstName/:lastName/challenge-win', wrap(async (req, res) => {
  res.json(await db.incrementPlayerChallengeWins(req.params.firstName, req.params.lastName));
}));

router.post('/players/:firstName/:lastName/vote-received', wrap(async (req, res) => {
  res.json(await db.incrementPlayerVotesReceived(req.params.firstName, req.params.lastName));
}));

router.post('/players/:firstName/:lastName/toggle-idol', wrap(async (req, res) => {
  res.json(await db.togglePlayerIdolStatus(req.params.firstName, req.params.lastName));
}));

router.delete('/players/:firstName/:lastName', wrap(async (req, res) => {
  res.json({ success: await db.deletePlayer(req.params.firstName, req.params.lastName) });
}));

router.get('/players/:firstName/:lastName/exists', wrap(async (req, res) => {
  res.json({ exists: await db.playerExists(req.params.firstName, req.params.lastName) });
}));

// ============================================
// ALLIANCES
// ============================================

router.get('/seasons/:seasonNumber/alliances', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getAlliancesInSeason(season_number));
}));

router.post('/seasons/:seasonNumber/alliances', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { alliance_name, formation_episode, dissolved_episode, size, notes } = req.body;
  res.json(await db.createAlliance(season_number, alliance_name, formation_episode, dissolved_episode, size, notes));
}));

router.patch('/alliances/:allianceName', wrap(async (req, res) => {
  const { dissolved_episode, notes } = req.body;
  res.json(await db.updateAlliance(req.params.allianceName, dissolved_episode, notes));
}));

router.delete('/alliances/:allianceName', wrap(async (req, res) => {
  res.json({ success: await db.deleteAlliance(req.params.allianceName) });
}));

router.get('/alliances/:allianceName/players', wrap(async (req, res) => {
  res.json(await db.getPlayersInAlliance(req.params.allianceName));
}));

router.post('/alliances/:allianceName/players', wrap(async (req, res) => {
  const { first_name, last_name } = req.body;
  res.json(await db.addPlayerToAlliance(first_name, last_name, req.params.allianceName));
}));

router.delete('/alliances/:allianceName/players/:firstName/:lastName', wrap(async (req, res) => {
  res.json(await db.removePlayerFromAlliance(req.params.firstName, req.params.lastName, req.params.allianceName));
}));

// ============================================
// FANTASY TEAMS
// ============================================

router.get('/fantasy-teams', wrap(async (req, res) => {
  res.json(await db.getAllFantasyTeams());
}));

router.get('/seasons/:seasonNumber/fantasy-teams', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getFantasyTeamsInSeason(season_number));
}));

router.post('/seasons/:seasonNumber/fantasy-teams', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { team_name, owners } = req.body;
  res.json(await db.createFantasyTeam(team_name, owners, season_number));
}));

router.get('/fantasy-teams/leaderboard', wrap(async (req, res) => {
  res.json(await db.getFantasyTeamLeaderboard());
}));

router.get('/fantasy-teams/:teamName', wrap(async (req, res) => {
  res.json(await db.getFantasyTeamWithPlayers(req.params.teamName));
}));

router.patch('/seasons/:seasonNumber/fantasy-teams/:teamName', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.updateFantasyTeam(req.params.teamName, req.body.owners, season_number));
}));

router.delete('/seasons/:seasonNumber/fantasy-teams/:teamName', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json({ success: await db.deleteFantasyTeam(req.params.teamName, season_number) });
}));

router.post('/fantasy-teams/:teamName/draft', wrap(async (req, res) => {
  const { first_name, last_name, season_number } = req.body;
  res.json(await db.draftPlayerToTeam(first_name, last_name, req.params.teamName, Number(season_number)));
}));

router.delete('/fantasy-teams/players/:firstName/:lastName', wrap(async (req, res) => {
  res.json(await db.removePlayerFromFantasyTeam(req.params.firstName, req.params.lastName));
}));

// ============================================
// DRAFT PICKS
// ============================================

router.get('/seasons/:seasonNumber/draft-picks', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getDraftPicksForSeason(season_number));
}));

router.post('/seasons/:seasonNumber/draft-picks', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { round, pick_number, player_name, team_name } = req.body;
  res.json(await db.createDraftPick(season_number, round, pick_number, player_name, team_name));
}));

router.delete('/seasons/:seasonNumber/draft-picks/:round/:pickNumber', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const round = Number(req.params.round);
  const pick_number = Number(req.params.pickNumber);
  res.json({ success: await db.deleteDraftPick(season_number, round, pick_number) });
}));

// ============================================
// ELIMINATIONS / RESERVES
// ============================================

router.post('/seasons/:seasonNumber/finalize-reserves', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.finalizeReserves(season_number));
}));

router.get('/seasons/:seasonNumber/players/reserves', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getReservePlayers(season_number));
}));

router.post('/players/:firstName/:lastName/eliminate', wrap(async (req, res) => {
  res.json(await db.eliminatePlayer(req.params.firstName, req.params.lastName));
}));

router.post('/fantasy-teams/:teamName/replace-reserve', wrap(async (req, res) => {
  const { reserve_first_name, reserve_last_name } = req.body;
  res.json(await db.replaceWithReserve(reserve_first_name, reserve_last_name, req.params.teamName));
}));

router.get('/seasons/:seasonNumber/teams/eligible-for-reserves', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getTeamsEligibleForReserves(season_number));
}));

// ============================================
// EVENTS
// ============================================

router.post('/seasons/:seasonNumber/events', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { first_name, last_name, event_type, episode_number, notes } = req.body;
  res.json(await db.createEvent(first_name, last_name, event_type, episode_number, season_number, notes));
}));

router.get('/seasons/:seasonNumber/events', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  res.json(await db.getEventsForSeason(season_number));
}));

router.get('/players/:firstName/:lastName/events', wrap(async (req, res) => {
  res.json(await db.getEventsForPlayer(req.params.firstName, req.params.lastName));
}));

router.get('/players/:firstName/:lastName/event-counts', wrap(async (req, res) => {
  res.json(await db.getEventCountsForPlayer(req.params.firstName, req.params.lastName));
}));

router.delete('/events/:eventId', wrap(async (req, res) => {
  res.json(await db.deleteEvent(req.params.eventId));
}));

router.post('/seasons/:seasonNumber/events/bulk', wrap(async (req, res) => {
  const season_number = Number(req.params.seasonNumber);
  const { players, event_type, episode_number, notes } = req.body;
  res.json(await db.createBulkEvents(players, event_type, episode_number, season_number, notes));
}));

// ============================================
// ERROR HANDLER
// ============================================

router.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ error: err.message });
});

module.exports = router;
