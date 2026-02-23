const { getDriver } = require('./neo4jConfig');

/**
 * Execute a Cypher query with retry logic
 */
const executeQuery = async (query, params = {}, retries = 3) => {
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    let session = null;
    try {
      const driver = await getDriver();
      session = driver.session({ defaultAccessMode: 'WRITE', maxTransactionRetryTime: 30000 });
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } catch (error) {
      lastError = error;
      console.warn(`Query attempt ${attempt + 1}/${retries} failed:`, error.message);
      if (
        error.code === 'ServiceUnavailable' ||
        error.code === 'SessionExpired' ||
        error.message.includes('Pool is closed') ||
        error.message.includes('Connection refused')
      ) {
        const waitTime = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw new Error(`Database query failed: ${error.message}`);
    } finally {
      if (session) {
        try { await session.close(); } catch (e) { /* ignore */ }
      }
    }
  }
  throw new Error(`Database query failed after ${retries} attempts: ${lastError.message}`);
};

// ============================================
// CREATE OPERATIONS
// ============================================

const createSeason = async (season_number, year) => {
  const query = `
    CREATE (s:Season { season_number: $season_number, year: $year })
    RETURN s
  `;
  const results = await executeQuery(query, { season_number, year });
  return results[0]?.s?.properties || null;
};

const createTribe = async (season_number, tribe_name, tribe_color) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    CREATE (t:Tribe { tribe_name: $tribe_name, tribe_color: $tribe_color })
    CREATE (s)-[:HAS_TRIBE]->(t)
    RETURN t
  `;
  const results = await executeQuery(query, { season_number, tribe_name, tribe_color });
  return results[0]?.t?.properties || null;
};

const createPlayer = async (season_number, tribe_name, first_name, last_name, occupation, hometown, archetype, notes, age) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:Tribe {tribe_name: $tribe_name})
    WHERE (s)-[:HAS_TRIBE]->(t)
    CREATE (p:Player {
      first_name: $first_name, last_name: $last_name,
      occupation: $occupation, hometown: $hometown, archetype: $archetype,
      age: $age,
      challenges_won: 0, has_idol: false, idols_played: 0, votes_received: 0,
      notes: $notes, status: 'active'
    })
    CREATE (p)-[:BELONGS_TO]->(t)
    CREATE (p)-[:COMPETES_IN]->(s)
    RETURN p
  `;
  const results = await executeQuery(query, { season_number, tribe_name, first_name, last_name, occupation, hometown, archetype, notes, age: age || null });
  return results[0]?.p?.properties || null;
};

const createAlliance = async (season_number, alliance_name, formation_episode, dissolved_episode, size, notes) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    CREATE (a:Alliance {
      alliance_name: $alliance_name, formation_episode: $formation_episode,
      dissolved_episode: $dissolved_episode, size: $size, notes: $notes
    })
    CREATE (a)-[:FORMED_IN]->(s)
    RETURN a
  `;
  const results = await executeQuery(query, { season_number, alliance_name, formation_episode, dissolved_episode, size, notes });
  return results[0]?.a?.properties || null;
};

const addPlayerToAlliance = async (first_name, last_name, alliance_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    MATCH (a:Alliance {alliance_name: $alliance_name})
    CREATE (p)-[:MEMBER_OF]->(a)
    RETURN p, a
  `;
  const results = await executeQuery(query, { first_name, last_name, alliance_name });
  return { player: results[0]?.p?.properties || null, alliance: results[0]?.a?.properties || null };
};

const draftPlayerToTeam = async (first_name, last_name, team_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    MATCH (ft:FantasyTeam {team_name: $team_name})
    CREATE (p)-[:ON_TEAM]->(ft)
    RETURN p, ft
  `;
  const results = await executeQuery(query, { first_name, last_name, team_name });
  return { player: results[0]?.p?.properties || null, team: results[0]?.ft?.properties || null };
};

// ============================================
// READ OPERATIONS
// ============================================

const getAllSeasons = async () => {
  const query = `MATCH (s:Season) RETURN s ORDER BY s.season_number`;
  const results = await executeQuery(query);
  return results.map(r => r.s?.properties || {});
};

const getTribesInSeason = async (season_number) => {
  const query = `MATCH (s:Season {season_number: $season_number})-[:HAS_TRIBE]->(t:Tribe) RETURN t`;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.t?.properties || {});
};

const getPlayersInSeason = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (p)-[:BELONGS_TO]->(t:Tribe)
    OPTIONAL MATCH (p)-[:ON_TEAM]->(ft:FantasyTeam)
    RETURN p, t.tribe_name as tribe_name, t.tribe_color as tribe_color,
           ft.team_name as fantasy_team_name, ft.owners as fantasy_team_owners
    ORDER BY p.last_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({
    ...r.p?.properties || {},
    tribe_name: r.tribe_name || null,
    tribe_color: r.tribe_color || null,
    fantasy_team_name: r.fantasy_team_name || null,
    fantasy_team_owners: r.fantasy_team_owners || null,
  }));
};

const getPlayersOnTribe = async (tribe_name) => {
  const query = `MATCH (p:Player)-[:BELONGS_TO]->(t:Tribe {tribe_name: $tribe_name}) RETURN p`;
  const results = await executeQuery(query, { tribe_name });
  return results.map(r => r.p?.properties || {});
};

const getPlayerDetails = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    OPTIONAL MATCH (p)-[:BELONGS_TO]->(t:Tribe)
    OPTIONAL MATCH (p)-[:COMPETES_IN]->(s:Season)
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(a:Alliance)
    OPTIONAL MATCH (p)-[:ON_TEAM]->(ft:FantasyTeam)
    RETURN p, t, s, collect(a) as alliances, ft
  `;
  const results = await executeQuery(query, { first_name, last_name });
  if (results.length === 0) return null;
  const result = results[0];
  return {
    player: result.p?.properties || null,
    tribe: result.t?.properties || null,
    season: result.s?.properties || null,
    alliances: (result.alliances || []).map(a => a?.properties || {}),
    fantasyTeam: result.ft?.properties || null,
  };
};

const getPlayersInAlliance = async (alliance_name) => {
  const query = `MATCH (p:Player)-[:MEMBER_OF]->(a:Alliance {alliance_name: $alliance_name}) RETURN p`;
  const results = await executeQuery(query, { alliance_name });
  return results.map(r => r.p?.properties || {});
};

const getFantasyTeamWithPlayers = async (team_name) => {
  const query = `
    MATCH (ft:FantasyTeam {team_name: $team_name})
    OPTIONAL MATCH (p:Player)-[:ON_TEAM]->(ft)
    RETURN ft, collect(p) as drafted_players
  `;
  const results = await executeQuery(query, { team_name });
  if (results.length === 0) return null;
  const result = results[0];
  return {
    team: result.ft?.properties || null,
    players: (result.drafted_players || []).map(p => p?.properties || {}),
  };
};

const getAllFantasyTeams = async () => {
  const query = `MATCH (ft:FantasyTeam) RETURN ft ORDER BY ft.team_name`;
  const results = await executeQuery(query);
  return results.map(r => r.ft?.properties || {});
};

const getSeasonOverview = async (season_number) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})-[:HAS_TRIBE]->(t:Tribe)
    OPTIONAL MATCH (p:Player)-[:BELONGS_TO]->(t)
    RETURN s, t, count(p) as player_count
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({
    season: r.s?.properties || null,
    tribe: r.t?.properties || null,
    playerCount: r.player_count || 0,
  }));
};

// ============================================
// UPDATE OPERATIONS
// ============================================

const updateSeason = async (season_number, updates) => {
  let setClause = [];
  let params = { season_number };
  if (updates.year !== undefined) { setClause.push('s.year = $year'); params.year = updates.year; }
  if (setClause.length === 0) throw new Error('No fields provided for update');
  const query = `MATCH (s:Season {season_number: $season_number}) SET ${setClause.join(', ')} RETURN s`;
  const results = await executeQuery(query, params);
  return results[0]?.s?.properties || null;
};

const updateTribe = async (tribe_name, season_number, updates) => {
  let setClause = [];
  let params = { tribe_name, season_number };
  if (updates.tribe_name !== undefined && updates.tribe_name !== tribe_name) {
    setClause.push('t.tribe_name = $new_tribe_name'); params.new_tribe_name = updates.tribe_name;
  }
  if (updates.tribe_color !== undefined) { setClause.push('t.tribe_color = $tribe_color'); params.tribe_color = updates.tribe_color; }
  if (setClause.length === 0) return { tribe_name, season_number };
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:Tribe {tribe_name: $tribe_name})-[:IN_SEASON]->(s)
    SET ${setClause.join(', ')}
    RETURN t
  `;
  const results = await executeQuery(query, params);
  return results[0]?.t?.properties || null;
};

const updatePlayerStats = async (first_name, last_name, challenges_won, has_idol, idols_played, votes_received) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.challenges_won = $challenges_won, p.has_idol = $has_idol,
        p.idols_played = $idols_played, p.votes_received = $votes_received
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name, challenges_won, has_idol, idols_played, votes_received });
  return results[0]?.p?.properties || null;
};

const updatePlayerNotes = async (first_name, last_name, notes) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.notes = $notes RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name, notes });
  return results[0]?.p?.properties || null;
};

const updatePlayerBasicInfo = async (first_name, last_name, occupation, hometown, archetype) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.occupation = $occupation, p.hometown = $hometown, p.archetype = $archetype
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name, occupation, hometown, archetype });
  return results[0]?.p?.properties || null;
};

const updatePlayer = async (first_name, last_name, updates) => {
  const setClause = Object.keys(updates).map(key => `p.${key} = $${key}`).join(', ');
  const query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) SET ${setClause} RETURN p`;
  const results = await executeQuery(query, { first_name, last_name, ...updates });
  return results[0]?.p?.properties || null;
};

const movePlayerToTribe = async (first_name, last_name, new_tribe_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:BELONGS_TO]->(old_tribe:Tribe)
    MATCH (new_tribe:Tribe {tribe_name: $new_tribe_name})
    DELETE r
    CREATE (p)-[:BELONGS_TO]->(new_tribe)
    RETURN p, new_tribe
  `;
  const results = await executeQuery(query, { first_name, last_name, new_tribe_name });
  return { player: results[0]?.p?.properties || null, newTribe: results[0]?.new_tribe?.properties || null };
};

const updateAlliance = async (alliance_name, dissolved_episode, notes) => {
  const query = `
    MATCH (a:Alliance {alliance_name: $alliance_name})
    SET a.dissolved_episode = $dissolved_episode, a.notes = $notes
    RETURN a
  `;
  const results = await executeQuery(query, { alliance_name, dissolved_episode, notes });
  return results[0]?.a?.properties || null;
};

const incrementPlayerChallengeWins = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.challenges_won = p.challenges_won + 1 RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

const incrementPlayerVotesReceived = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.votes_received = p.votes_received + 1 RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

const togglePlayerIdolStatus = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.has_idol = NOT p.has_idol RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

// ============================================
// DELETE OPERATIONS
// ============================================

const removePlayerFromAlliance = async (first_name, last_name, alliance_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:MEMBER_OF]->(a:Alliance {alliance_name: $alliance_name})
    DELETE r RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name, alliance_name });
  return results[0]?.p?.properties || null;
};

const removePlayerFromFantasyTeam = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:ON_TEAM]->(ft:FantasyTeam)
    DELETE r RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

const deletePlayer = async (first_name, last_name) => {
  const query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) DETACH DELETE p`;
  await executeQuery(query, { first_name, last_name });
  return true;
};

const deleteAlliance = async (alliance_name) => {
  const query = `MATCH (a:Alliance {alliance_name: $alliance_name}) DETACH DELETE a`;
  await executeQuery(query, { alliance_name });
  return true;
};

const deleteTribe = async (tribe_name, season_number) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:Tribe {tribe_name: $tribe_name})-[:IN_SEASON]->(s)
    DETACH DELETE t
  `;
  await executeQuery(query, { tribe_name, season_number });
  return true;
};

const deleteSeason = async (season_number) => {
  const query = `MATCH (s:Season {season_number: $season_number}) DETACH DELETE s`;
  await executeQuery(query, { season_number });
  return true;
};

// ============================================
// UTILITY / STATS OPERATIONS
// ============================================

const getPlayerStatsSummary = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    RETURN p.first_name + ' ' + p.last_name as player_name,
           p.challenges_won, p.idols_played, p.votes_received, p.has_idol
    ORDER BY p.challenges_won DESC
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({
    playerName: r.player_name, challengesWon: r.challenges_won,
    idolsPlayed: r.idols_played, votesReceived: r.votes_received, hasIdol: r.has_idol,
  }));
};

const getFantasyTeamLeaderboard = async () => {
  const query = `
    MATCH (ft:FantasyTeam)
    OPTIONAL MATCH (ft)-[:DRAFTED_FOR]->(s:Season)
    OPTIONAL MATCH (p:Player)-[:ON_TEAM]->(ft)
    RETURN ft.team_name, ft.previous_wins, ft.owners,
           s.season_number as season_number,
           sum(p.challenges_won) as total_challenge_wins, count(p) as roster_size
    ORDER BY season_number DESC, total_challenge_wins DESC
  `;
  const results = await executeQuery(query);
  return results.map(r => ({
    teamName: r.team_name, previousWins: r.previous_wins || 0,
    totalChallengeWins: r.total_challenge_wins || 0, rosterSize: r.roster_size || 0,
    seasonNumber: r.season_number || null, owners: r.owners || [],
  }));
};

const playerExists = async (first_name, last_name) => {
  const query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) RETURN count(p) > 0 as exists`;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.exists || false;
};

const getAvailablePlayersInSeason = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    WHERE NOT (p)-[:ON_TEAM]->(:FantasyTeam)
    RETURN p ORDER BY p.last_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.p?.properties || {});
};

const getAlliancesInSeason = async (season_number) => {
  const query = `
    MATCH (a:Alliance)-[:FORMED_IN]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (a)-[:INCLUDES]->(p:Player)
    RETURN a, collect(p) as members ORDER BY a.alliance_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({ ...r.a?.properties, roster: r.members?.map(m => m?.properties) || [] }));
};

// ============================================
// FANTASY TEAM OPERATIONS
// ============================================

const createFantasyTeam = async (team_name, owners, season_number) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    CREATE (t:FantasyTeam { team_name: $team_name, owners: $owners })
    CREATE (t)-[:DRAFTED_FOR]->(s)
    RETURN t
  `;
  const results = await executeQuery(query, { team_name, owners, season_number });
  return results[0]?.t?.properties || null;
};

const updateFantasyTeam = async (team_name, owners) => {
  const query = `MATCH (t:FantasyTeam {team_name: $team_name}) SET t.owners = $owners RETURN t`;
  const results = await executeQuery(query, { team_name, owners });
  return results[0]?.t?.properties || null;
};

const deleteFantasyTeam = async (team_name) => {
  const query = `MATCH (t:FantasyTeam {team_name: $team_name}) DETACH DELETE t RETURN true as success`;
  const results = await executeQuery(query, { team_name });
  return results[0]?.success || false;
};

const getFantasyTeamsInSeason = async (season_number) => {
  const query = `
    MATCH (t:FantasyTeam)-[:DRAFTED_FOR]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (t)-[:INCLUDES]->(p:Player)
    RETURN t, collect(p) as roster ORDER BY t.team_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({ ...r.t?.properties, roster: r.roster?.map(p => p?.properties) || [] }));
};

// ============================================
// DRAFT OPERATIONS
// ============================================

const createDraftPick = async (season_number, round, pick_number, player_name, team_name) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:FantasyTeam {team_name: $team_name})
    MATCH (p:Player) WHERE (p.first_name + ' ' + p.last_name) = $player_name
    CREATE (dp:DraftPick { round: $round, pick_number: $pick_number, player_name: $player_name })-[:PICKED_IN]->(s)
    CREATE (t)-[:MADE_PICK]->(dp)
    CREATE (p)-[:ON_TEAM]->(t)
    RETURN dp
  `;
  const results = await executeQuery(query, { season_number, round, pick_number, player_name, team_name });
  return results[0]?.dp?.properties || null;
};

const deleteDraftPick = async (season_number, round, pick_number) => {
  const query = `
    MATCH (dp:DraftPick {round: $round, pick_number: $pick_number})-[:PICKED_IN]->(s:Season {season_number: $season_number})
    DETACH DELETE dp RETURN true as success
  `;
  const results = await executeQuery(query, { season_number, round, pick_number });
  return results[0]?.success || false;
};

const getDraftPicksForSeason = async (season_number) => {
  const query = `
    MATCH (dp:DraftPick)-[:PICKED_IN]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (t:FantasyTeam)-[:MADE_PICK]->(dp)
    RETURN dp, t.team_name as team_name ORDER BY dp.round, dp.pick_number
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({ ...r.dp?.properties || {}, team_name: r.team_name || null }));
};

// ============================================
// ELIMINATION / RESERVE OPERATIONS
// ============================================

const finalizeReserves = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    WHERE NOT (p)-[:ON_TEAM]->(:FantasyTeam)
    SET p.status = 'reserve'
    WITH count(p) as reserve_count
    MATCH (p2:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    WHERE (p2)-[:ON_TEAM]->(:FantasyTeam)
    WITH reserve_count, count(p2) as drafted_count
    RETURN drafted_count, reserve_count
  `;
  const results = await executeQuery(query, { season_number });
  return results[0] || { drafted_count: 0, reserve_count: 0 };
};

const getReservePlayers = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    WHERE p.status = 'reserve' RETURN p ORDER BY p.last_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.p?.properties || {});
};

const eliminatePlayer = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    OPTIONAL MATCH (p)-[:ON_TEAM]->(t:FantasyTeam)
    SET p.status = 'eliminated' RETURN p, t
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return { player: results[0]?.p?.properties || null, team: results[0]?.t?.properties || null };
};

const replaceWithReserve = async (reserve_first_name, reserve_last_name, team_name) => {
  const query = `
    MATCH (p:Player {first_name: $reserve_first_name, last_name: $reserve_last_name})
    WHERE p.status = 'reserve'
    MATCH (t:FantasyTeam {team_name: $team_name})
    CREATE (p)-[:ON_TEAM]->(t)
    SET p.status = 'drafted' RETURN p, t
  `;
  const results = await executeQuery(query, { reserve_first_name, reserve_last_name, team_name });
  return { player: results[0]?.p?.properties || null, team: results[0]?.t?.properties || null };
};

const getTeamsEligibleForReserves = async (season_number) => {
  const query = `
    MATCH (t:FantasyTeam)-[:DRAFTED_FOR]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (p:Player)-[:ON_TEAM]->(t) WHERE p.status = 'eliminated'
    WITH t, count(p) as eliminated_count WHERE eliminated_count > 0
    RETURN t.team_name as team_name, eliminated_count ORDER BY t.team_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({ team_name: r.team_name, eliminated_count: r.eliminated_count || 0 }));
};

// ============================================
// EVENT TRACKING OPERATIONS
// ============================================

const syncPlayerStatsFromEvent = async (first_name, last_name, event_type, operation = 'increment') => {
  const increment = operation === 'increment';
  let query = '';
  switch (event_type) {
    case 'challenge_win':
      query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) SET p.challenges_won = COALESCE(p.challenges_won, 0) ${increment ? '+ 1' : '- 1'} RETURN p`;
      break;
    case 'immunity_win':
      query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) SET p.immunity_challenge_wins = COALESCE(p.immunity_challenge_wins, 0) ${increment ? '+ 1' : '- 1'} RETURN p`;
      break;
    case 'idol_found':
      query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) SET p.has_idol = ${increment ? 'true' : 'false'} RETURN p`;
      break;
    case 'idol_played':
      query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) SET p.idols_played = COALESCE(p.idols_played, 0) ${increment ? '+ 1' : '- 1'}, p.has_idol = false RETURN p`;
      break;
    case 'voted_out':
      query = `MATCH (p:Player {first_name: $first_name, last_name: $last_name}) SET p.status = ${increment ? "'eliminated'" : "'active'"} RETURN p`;
      break;
    case 'tribal_council':
      return null;
    default:
      return null;
  }
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

const createEvent = async (first_name, last_name, event_type, episode_number, season_number, notes = '') => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    MATCH (s:Season {season_number: $season_number})
    CREATE (e:Event {
      event_id: randomUUID(), event_type: $event_type,
      episode_number: $episode_number, timestamp: datetime(), notes: $notes
    })
    CREATE (p)-[:PARTICIPATED_IN]->(e)
    CREATE (e)-[:OCCURRED_IN]->(s)
    RETURN e, p
  `;
  const results = await executeQuery(query, { first_name, last_name, event_type, episode_number, season_number, notes });
  await syncPlayerStatsFromEvent(first_name, last_name, event_type, 'increment');
  return { event: results[0]?.e?.properties || null, player: results[0]?.p?.properties || null };
};

const getEventsForPlayer = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[:PARTICIPATED_IN]->(e:Event)
    RETURN e ORDER BY e.episode_number DESC, e.timestamp DESC
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results.map(r => r.e?.properties || {});
};

const getEventsForSeason = async (season_number) => {
  const query = `
    MATCH (e:Event)-[:OCCURRED_IN]->(s:Season {season_number: $season_number})
    MATCH (p:Player)-[:PARTICIPATED_IN]->(e)
    RETURN e, p ORDER BY e.episode_number DESC, e.timestamp DESC
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({ event: r.e?.properties || {}, player: r.p?.properties || {} }));
};

const deleteEvent = async (event_id) => {
  const getEventQuery = `MATCH (p:Player)-[:PARTICIPATED_IN]->(e:Event {event_id: $event_id}) RETURN e, p`;
  const eventResults = await executeQuery(getEventQuery, { event_id });
  if (eventResults.length === 0) throw new Error('Event not found');
  const event = eventResults[0]?.e?.properties;
  const player = eventResults[0]?.p?.properties;
  await executeQuery(`MATCH (e:Event {event_id: $event_id}) DETACH DELETE e`, { event_id });
  if (player && event) {
    await syncPlayerStatsFromEvent(player.first_name, player.last_name, event.event_type, 'decrement');
  }
  return event;
};

const getEventCountsForPlayer = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[:PARTICIPATED_IN]->(e:Event)
    RETURN e.event_type as event_type, count(e) as count
  `;
  const results = await executeQuery(query, { first_name, last_name });
  const counts = {};
  results.forEach(r => { counts[r.event_type] = r.count || 0; });
  return counts;
};

const createBulkEvents = async (players, event_type, episode_number, season_number, notes = '') => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    UNWIND $players as playerData
    MATCH (p:Player {first_name: playerData.first_name, last_name: playerData.last_name})
    WHERE p.status <> 'eliminated'
    CREATE (e:Event {
      event_id: randomUUID(), event_type: $event_type,
      episode_number: $episode_number, timestamp: datetime(), notes: $notes
    })
    CREATE (p)-[:PARTICIPATED_IN]->(e)
    CREATE (e)-[:OCCURRED_IN]->(s)
    RETURN e, p
  `;
  const playerData = players.map(p => ({ first_name: p.first_name, last_name: p.last_name }));
  const results = await executeQuery(query, { players: playerData, event_type, episode_number, season_number, notes });
  await Promise.all(results.map(r => {
    const player = r.p?.properties;
    if (player) return syncPlayerStatsFromEvent(player.first_name, player.last_name, event_type, 'increment');
    return Promise.resolve(null);
  }));
  return results.map(r => ({ event: r.e?.properties || null, player: r.p?.properties || null }));
};

module.exports = {
  // Create
  createSeason, createTribe, createPlayer, createAlliance, addPlayerToAlliance, draftPlayerToTeam,
  // Read
  getAllSeasons, getTribesInSeason, getPlayersInSeason, getPlayersOnTribe, getPlayerDetails,
  getPlayersInAlliance, getFantasyTeamWithPlayers, getAllFantasyTeams, getSeasonOverview,
  // Update
  updateSeason, updateTribe, updatePlayerStats, updatePlayerNotes, updatePlayerBasicInfo,
  updatePlayer, movePlayerToTribe, updateAlliance, incrementPlayerChallengeWins,
  incrementPlayerVotesReceived, togglePlayerIdolStatus,
  // Delete
  removePlayerFromAlliance, removePlayerFromFantasyTeam, deletePlayer, deleteAlliance,
  deleteTribe, deleteSeason,
  // Utility
  getPlayerStatsSummary, getFantasyTeamLeaderboard, playerExists, getAvailablePlayersInSeason,
  getAlliancesInSeason,
  // Fantasy Teams
  createFantasyTeam, updateFantasyTeam, deleteFantasyTeam, getFantasyTeamsInSeason,
  // Draft
  createDraftPick, deleteDraftPick, getDraftPicksForSeason,
  // Elimination / Reserves
  finalizeReserves, getReservePlayers, eliminatePlayer, replaceWithReserve, getTeamsEligibleForReserves,
  // Events
  createEvent, getEventsForPlayer, getEventsForSeason, deleteEvent, getEventCountsForPlayer, createBulkEvents,
};
