/**
 * Neo4j Service Layer
 * 
 * This service provides a centralized interface for all database operations.
 * It encapsulates all Neo4j queries from the queries.cyp file and provides
 * helper methods to execute them with parameters.
 * 
 * All methods return promises with the query results.
 */

import { getDriver } from '../config/neo4jConfig';

/**
 * Execute a Cypher query with parameters
 * Includes retry logic for transient connection failures
 * @param {string} query - The Cypher query to execute
 * @param {object} params - Parameters to pass to the query
 * @param {number} retries - Number of times to retry on failure
 * @returns {Promise<Array>} - Array of results
 */
const executeQuery = async (query, params = {}, retries = 3) => {
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    let session = null;
    try {
      const driver = await getDriver();
      
      // Use READ_WRITE mode explicitly to ensure proper transaction handling
      session = driver.session({
        defaultAccessMode: 'WRITE',
        maxTransactionRetryTime: 30000, // 30 seconds
      });

      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } catch (error) {
      lastError = error;
      console.warn(`Query execution attempt ${attempt + 1}/${retries} failed:`, error.message);

      // Only retry on specific transient errors
      if (
        error.code === 'ServiceUnavailable' ||
        error.code === 'SessionExpired' ||
        error.message.includes('Pool is closed') ||
        error.message.includes('Connection refused') ||
        error.message.includes('ECONNREFUSED')
      ) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 100; // 100ms, 200ms, 400ms
        console.log(`Retrying after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else {
        // Non-transient error, throw immediately
        throw new Error(`Database query failed: ${error.message}`);
      }
    } finally {
      if (session) {
        try {
          await session.close();
        } catch (closeErr) {
          console.warn('Error closing session:', closeErr.message);
        }
      }
    }
  }

  // All retries exhausted
  throw new Error(`Database query failed after ${retries} attempts: ${lastError.message}`);
};

// ============================================
// CREATE OPERATIONS (Queries 1-7)
// ============================================

/**
 * Create a new Season
 * @param {number} season_number - The season number
 * @param {number} year - The year the season aired
 * @returns {Promise<Object>} - The created season
 */
export const createSeason = async (season_number, year) => {
  const query = `
    CREATE (s:Season {
      season_number: $season_number,
      year: $year
    })
    RETURN s
  `;
  const results = await executeQuery(query, { season_number, year });
  return results[0]?.s?.properties || null;
};

/**
 * Create a new Tribe and link to Season
 * @param {number} season_number - The season number to link to
 * @param {string} tribe_name - Name of the tribe
 * @param {string} tribe_color - Color of the tribe (hex or color name)
 * @returns {Promise<Object>} - The created tribe
 */
export const createTribe = async (season_number, tribe_name, tribe_color) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    CREATE (t:Tribe {
      tribe_name: $tribe_name,
      tribe_color: $tribe_color
    })
    CREATE (s)-[:HAS_TRIBE]->(t)
    RETURN t
  `;
  const results = await executeQuery(query, { season_number, tribe_name, tribe_color });
  return results[0]?.t?.properties || null;
};

/**
 * Create a new Player and link to Tribe and Season
 * @param {number} season_number - The season number
 * @param {string} tribe_name - The tribe name
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} occupation - Player's occupation
 * @param {string} hometown - Player's hometown
 * @param {string} archetype - Player's archetype/strategy type
 * @param {string} notes - Additional notes about the player
 * @returns {Promise<Object>} - The created player
 */
export const createPlayer = async (
  season_number,
  tribe_name,
  first_name,
  last_name,
  occupation,
  hometown,
  archetype,
  notes
) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:Tribe {tribe_name: $tribe_name})
    WHERE (s)-[:HAS_TRIBE]->(t)
    CREATE (p:Player {
      first_name: $first_name,
      last_name: $last_name,
      occupation: $occupation,
      hometown: $hometown,
      archetype: $archetype,
      challenges_won: 0,
      has_idol: false,
      idols_played: 0,
      votes_received: 0,
      notes: $notes
    })
    CREATE (p)-[:BELONGS_TO]->(t)
    CREATE (p)-[:COMPETES_IN]->(s)
    RETURN p
  `;
  const results = await executeQuery(query, {
    season_number,
    tribe_name,
    first_name,
    last_name,
    occupation,
    hometown,
    archetype,
    notes,
  });
  return results[0]?.p?.properties || null;
};

/**
 * Create a new Alliance and link to Season
 * @param {number} season_number - The season number
 * @param {string} alliance_name - Name of the alliance
 * @param {number} formation_episode - Episode when alliance formed
 * @param {number} dissolved_episode - Episode when alliance dissolved
 * @param {number} size - Size of the alliance
 * @param {string} notes - Additional notes
 * @returns {Promise<Object>} - The created alliance
 */
export const createAlliance = async (
  season_number,
  alliance_name,
  formation_episode,
  dissolved_episode,
  size,
  notes
) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    CREATE (a:Alliance {
      alliance_name: $alliance_name,
      formation_episode: $formation_episode,
      dissolved_episode: $dissolved_episode,
      size: $size,
      notes: $notes
    })
    CREATE (a)-[:FORMED_IN]->(s)
    RETURN a
  `;
  const results = await executeQuery(query, {
    season_number,
    alliance_name,
    formation_episode,
    dissolved_episode,
    size,
    notes,
  });
  return results[0]?.a?.properties || null;
};

/**
 * Add a Player to an Alliance
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} alliance_name - Alliance name
 * @returns {Promise<Object>} - Player and alliance data
 */
export const addPlayerToAlliance = async (first_name, last_name, alliance_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    MATCH (a:Alliance {alliance_name: $alliance_name})
    CREATE (p)-[:MEMBER_OF]->(a)
    RETURN p, a
  `;
  const results = await executeQuery(query, { first_name, last_name, alliance_name });
  return {
    player: results[0]?.p?.properties || null,
    alliance: results[0]?.a?.properties || null,
  };
};

/**
 * Create a new Fantasy Team
 * @param {string} team_name - Name of the fantasy team
 * @param {string} members - Owner/members of the team
 * @param {number} previous_wins - Number of previous wins
 * @returns {Promise<Object>} - The created fantasy team
 */
/**
 * Draft a Player to a Fantasy Team
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} team_name - Fantasy team name
 * @returns {Promise<Object>} - Player and team data
 */
export const draftPlayerToTeam = async (first_name, last_name, team_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    MATCH (ft:FantasyTeam {team_name: $team_name})
    CREATE (p)-[:DRAFTED_BY]->(ft)
    RETURN p, ft
  `;
  const results = await executeQuery(query, { first_name, last_name, team_name });
  return {
    player: results[0]?.p?.properties || null,
    team: results[0]?.ft?.properties || null,
  };
};

// ============================================
// READ OPERATIONS (Queries 8-16)
// ============================================

/**
 * Get all Seasons
 * @returns {Promise<Array>} - Array of all seasons
 */
export const getAllSeasons = async () => {
  const query = `
    MATCH (s:Season)
    RETURN s
    ORDER BY s.season_number
  `;
  const results = await executeQuery(query);
  return results.map(r => r.s?.properties || {});
};

/**
 * Get all Tribes in a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of tribes in the season
 */
export const getTribesInSeason = async (season_number) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})-[:HAS_TRIBE]->(t:Tribe)
    RETURN t
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.t?.properties || {});
};

/**
 * Get all Players in a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of players in the season
 */
export const getPlayersInSeason = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    RETURN p
    ORDER BY p.last_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.p?.properties || {});
};

/**
 * Get all Players on a Tribe
 * @param {string} tribe_name - The tribe name
 * @returns {Promise<Array>} - Array of players on the tribe
 */
export const getPlayersOnTribe = async (tribe_name) => {
  const query = `
    MATCH (p:Player)-[:BELONGS_TO]->(t:Tribe {tribe_name: $tribe_name})
    RETURN p
  `;
  const results = await executeQuery(query, { tribe_name });
  return results.map(r => r.p?.properties || {});
};

/**
 * Get Player with all relationships
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<Object>} - Complete player data with relationships
 */
export const getPlayerDetails = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    OPTIONAL MATCH (p)-[:BELONGS_TO]->(t:Tribe)
    OPTIONAL MATCH (p)-[:COMPETES_IN]->(s:Season)
    OPTIONAL MATCH (p)-[:MEMBER_OF]->(a:Alliance)
    OPTIONAL MATCH (p)-[:DRAFTED_BY]->(ft:FantasyTeam)
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

/**
 * Get all Players in an Alliance
 * @param {string} alliance_name - The alliance name
 * @returns {Promise<Array>} - Array of players in the alliance
 */
export const getPlayersInAlliance = async (alliance_name) => {
  const query = `
    MATCH (p:Player)-[:MEMBER_OF]->(a:Alliance {alliance_name: $alliance_name})
    RETURN p
  `;
  const results = await executeQuery(query, { alliance_name });
  return results.map(r => r.p?.properties || {});
};

/**
 * Get Fantasy Team with all drafted Players
 * @param {string} team_name - The fantasy team name
 * @returns {Promise<Object>} - Team data with drafted players
 */
export const getFantasyTeamWithPlayers = async (team_name) => {
  const query = `
    MATCH (ft:FantasyTeam {team_name: $team_name})
    OPTIONAL MATCH (p:Player)-[:DRAFTED_BY]->(ft)
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

/**
 * Get all Fantasy Teams
 * @returns {Promise<Array>} - Array of all fantasy teams
 */
export const getAllFantasyTeams = async () => {
  const query = `
    MATCH (ft:FantasyTeam)
    RETURN ft
    ORDER BY ft.team_name
  `;
  const results = await executeQuery(query);
  return results.map(r => r.ft?.properties || {});
};

/**
 * Get Season Overview (all tribes and player counts)
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Season with tribes and player counts
 */
export const getSeasonOverview = async (season_number) => {
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
// UPDATE OPERATIONS (Queries 17-25)
// ============================================

/**
 * Update Season (year)
 * @param {number} season_number - The season number to update
 * @param {object} updates - Object with fields to update { year }
 * @returns {Promise<Object>} - Updated season
 */
export const updateSeason = async (season_number, updates) => {
  let setClause = [];
  let params = { season_number };

  if (updates.year !== undefined) {
    setClause.push('s.year = $year');
    params.year = updates.year;
  }

  if (setClause.length === 0) {
    throw new Error('No fields provided for update');
  }

  const query = `
    MATCH (s:Season {season_number: $season_number})
    SET ${setClause.join(', ')}
    RETURN s
  `;
  const results = await executeQuery(query, params);
  return results[0]?.s?.properties || null;
};

/**
 * Update Tribe (name, color)
 * @param {string} tribe_name - The tribe name to update
 * @param {number} season_number - The season the tribe belongs to
 * @param {object} updates - Object with fields to update { tribe_name, tribe_color }
 * @returns {Promise<Object>} - Updated tribe
 */
export const updateTribe = async (tribe_name, season_number, updates) => {
  let setClause = [];
  let params = { tribe_name, season_number };

  if (updates.tribe_name !== undefined && updates.tribe_name !== tribe_name) {
    setClause.push('t.tribe_name = $new_tribe_name');
    params.new_tribe_name = updates.tribe_name;
  }

  if (updates.tribe_color !== undefined) {
    setClause.push('t.tribe_color = $tribe_color');
    params.tribe_color = updates.tribe_color;
  }

  if (setClause.length === 0) {
    return { tribe_name, season_number };
  }

  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:Tribe {tribe_name: $tribe_name})-[:IN_SEASON]->(s)
    SET ${setClause.join(', ')}
    RETURN t
  `;
  const results = await executeQuery(query, params);
  return results[0]?.t?.properties || null;
};

/**
 * Update Player Stats (challenges won, idol status, etc.)
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {number} challenges_won - Number of challenges won
 * @param {boolean} has_idol - Whether player currently has idol
 * @param {number} idols_played - Number of idols played
 * @param {number} votes_received - Number of votes received
 * @returns {Promise<Object>} - Updated player
 */
export const updatePlayerStats = async (
  first_name,
  last_name,
  challenges_won,
  has_idol,
  idols_played,
  votes_received
) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.challenges_won = $challenges_won,
        p.has_idol = $has_idol,
        p.idols_played = $idols_played,
        p.votes_received = $votes_received
    RETURN p
  `;
  const results = await executeQuery(query, {
    first_name,
    last_name,
    challenges_won,
    has_idol,
    idols_played,
    votes_received,
  });
  return results[0]?.p?.properties || null;
};

/**
 * Update Player Notes
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} notes - Updated notes
 * @returns {Promise<Object>} - Updated player
 */
export const updatePlayerNotes = async (first_name, last_name, notes) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.notes = $notes
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name, notes });
  return results[0]?.p?.properties || null;
};

/**
 * Update Player Basic Info
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} occupation - Updated occupation
 * @param {string} hometown - Updated hometown
 * @param {string} archetype - Updated archetype
 * @returns {Promise<Object>} - Updated player
 */
export const updatePlayerBasicInfo = async (
  first_name,
  last_name,
  occupation,
  hometown,
  archetype
) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.occupation = $occupation,
        p.hometown = $hometown,
        p.archetype = $archetype
    RETURN p
  `;
  const results = await executeQuery(query, {
    first_name,
    last_name,
    occupation,
    hometown,
    archetype,
  });
  return results[0]?.p?.properties || null;
};

/**
 * Update all Player fields
 * @param {string} first_name - Player's first name (used to identify player)
 * @param {string} last_name - Player's last name (used to identify player)
 * @param {object} updates - Object with fields to update
 * @returns {Promise<Object>} - Updated player
 */
export const updatePlayer = async (first_name, last_name, updates) => {
  const setClause = Object.keys(updates)
    .map(key => `p.${key} = $${key}`)
    .join(', ');
  
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET ${setClause}
    RETURN p
  `;
  
  const params = {
    first_name,
    last_name,
    ...updates,
  };
  
  const results = await executeQuery(query, params);
  return results[0]?.p?.properties || null;
};

/**
 * Move Player to Different Tribe (tribe swap)
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} new_tribe_name - New tribe name
 * @returns {Promise<Object>} - Updated player with new tribe
 */
export const movePlayerToTribe = async (first_name, last_name, new_tribe_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:BELONGS_TO]->(old_tribe:Tribe)
    MATCH (new_tribe:Tribe {tribe_name: $new_tribe_name})
    DELETE r
    CREATE (p)-[:BELONGS_TO]->(new_tribe)
    RETURN p, new_tribe
  `;
  const results = await executeQuery(query, { first_name, last_name, new_tribe_name });
  return {
    player: results[0]?.p?.properties || null,
    newTribe: results[0]?.new_tribe?.properties || null,
  };
};

/**
 * Update Alliance (mark as dissolved or update notes)
 * @param {string} alliance_name - Alliance name
 * @param {number} dissolved_episode - Episode dissolved
 * @param {string} notes - Updated notes
 * @returns {Promise<Object>} - Updated alliance
 */
export const updateAlliance = async (alliance_name, dissolved_episode, notes) => {
  const query = `
    MATCH (a:Alliance {alliance_name: $alliance_name})
    SET a.dissolved_episode = $dissolved_episode,
        a.notes = $notes
    RETURN a
  `;
  const results = await executeQuery(query, { alliance_name, dissolved_episode, notes });
  return results[0]?.a?.properties || null;
};

/**
 * Update Fantasy Team
 * @param {string} team_name - Team name
 * @param {string} members - Updated members
 * @param {number} previous_wins - Updated previous wins
 * @returns {Promise<Object>} - Updated team
 */
/**
 * Increment Player Challenge Wins
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<Object>} - Updated player
 */
export const incrementPlayerChallengeWins = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.challenges_won = p.challenges_won + 1
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

/**
 * Increment Player Votes Received
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<Object>} - Updated player
 */
export const incrementPlayerVotesReceived = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.votes_received = p.votes_received + 1
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

/**
 * Toggle Player Idol Status
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<Object>} - Updated player
 */
export const togglePlayerIdolStatus = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    SET p.has_idol = NOT p.has_idol
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

// ============================================
// DELETE OPERATIONS (Queries 26-32)
// ============================================

/**
 * Remove Player from Alliance
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @param {string} alliance_name - Alliance name
 * @returns {Promise<Object>} - Player that was removed
 */
export const removePlayerFromAlliance = async (first_name, last_name, alliance_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:MEMBER_OF]->(a:Alliance {alliance_name: $alliance_name})
    DELETE r
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name, alliance_name });
  return results[0]?.p?.properties || null;
};

/**
 * Remove Player from Fantasy Team (undraft player)
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<Object>} - Player that was removed
 */
export const removePlayerFromFantasyTeam = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:DRAFTED_BY]->(ft:FantasyTeam)
    DELETE r
    RETURN p
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.p?.properties || null;
};

/**
 * Delete a Player and all relationships
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<boolean>} - Success indicator
 */
export const deletePlayer = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    DETACH DELETE p
  `;
  await executeQuery(query, { first_name, last_name });
  return true;
};

/**
 * Delete an Alliance and all relationships
 * @param {string} alliance_name - Alliance name
 * @returns {Promise<boolean>} - Success indicator
 */
export const deleteAlliance = async (alliance_name) => {
  const query = `
    MATCH (a:Alliance {alliance_name: $alliance_name})
    DETACH DELETE a
  `;
  await executeQuery(query, { alliance_name });
  return true;
};

/**
 * Delete a Tribe and all relationships
 * WARNING: Should remove player relationships first
 * @param {string} tribe_name - Tribe name
 * @returns {Promise<boolean>} - Success indicator
 */
export const deleteTribe = async (tribe_name, season_number) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:Tribe {tribe_name: $tribe_name})-[:IN_SEASON]->(s)
    DETACH DELETE t
  `;
  await executeQuery(query, { tribe_name, season_number });
  return true;
};

/**
 * Delete a Fantasy Team and all draft relationships
 * @param {string} team_name - Team name
 * @returns {Promise<boolean>} - Success indicator
 */
/**
 * Delete a Season and all related data
 * WARNING: Cascades to all related data!
 * @param {number} season_number - Season number
 * @returns {Promise<boolean>} - Success indicator
 */
export const deleteSeason = async (season_number) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    DETACH DELETE s
  `;
  await executeQuery(query, { season_number });
  return true;
};

// ============================================
// UTILITY OPERATIONS (Queries 33-36)
// ============================================

/**
 * Get Player Stats Summary for a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of players with stats, sorted by challenges won
 */
export const getPlayerStatsSummary = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    RETURN p.first_name + ' ' + p.last_name as player_name,
           p.challenges_won,
           p.idols_played,
           p.votes_received,
           p.has_idol
    ORDER BY p.challenges_won DESC
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({
    playerName: r.player_name,
    challengesWon: r.challenges_won,
    idolsPlayed: r.idols_played,
    votesReceived: r.votes_received,
    hasIdol: r.has_idol,
  }));
};

/**
 * Get Fantasy Team Leaderboard (by total challenge wins)
 * @returns {Promise<Array>} - Teams sorted by total challenge wins
 */
export const getFantasyTeamLeaderboard = async () => {
  const query = `
    MATCH (ft:FantasyTeam)
    OPTIONAL MATCH (p:Player)-[:DRAFTED_BY]->(ft)
    RETURN ft.team_name,
           ft.previous_wins,
           sum(p.challenges_won) as total_challenge_wins,
           count(p) as roster_size
    ORDER BY total_challenge_wins DESC
  `;
  const results = await executeQuery(query);
  return results.map(r => ({
    teamName: r.team_name,
    previousWins: r.previous_wins || 0,
    totalChallengeWins: r.total_challenge_wins || 0,
    rosterSize: r.roster_size || 0,
  }));
};

/**
 * Check if Player exists
 * @param {string} first_name - Player's first name
 * @param {string} last_name - Player's last name
 * @returns {Promise<boolean>} - True if player exists
 */
export const playerExists = async (first_name, last_name) => {
  const query = `
    MATCH (p:Player {first_name: $first_name, last_name: $last_name})
    RETURN count(p) > 0 as exists
  `;
  const results = await executeQuery(query, { first_name, last_name });
  return results[0]?.exists || false;
};

/**
 * Get all available Players (not yet drafted) in a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of undrafted players
 */
export const getAvailablePlayersInSeason = async (season_number) => {
  const query = `
    MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
    WHERE NOT (p)-[:DRAFTED_BY]->(:FantasyTeam)
    RETURN p
    ORDER BY p.last_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.p?.properties || {});
};

/**
 * Get all Alliances in a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of alliances with members
 */
export const getAlliancesInSeason = async (season_number) => {
  const query = `
    MATCH (a:Alliance)-[:FORMED_IN]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (a)-[:INCLUDES]->(p:Player)
    RETURN a, collect(p) as members
    ORDER BY a.alliance_name
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => ({
    ...r.a?.properties,
    roster: r.members?.map(m => m?.properties) || [],
  }));
};

/**
 * Create a new Fantasy Team
 * @param {string} team_name - Name of the fantasy team
 * @param {Array<string>} owners - Array of owner names
 * @param {number} season_number - Season number to link to
 * @returns {Promise<Object>} - The created fantasy team
 */
export const createFantasyTeam = async (team_name, owners, season_number) => {
  console.log('createFantasyTeam called with:', { team_name, owners, season_number });
  
  const query = `
    MATCH (s:Season {season_number: $season_number})
    CREATE (t:FantasyTeam {
      team_name: $team_name,
      owners: $owners
    })
    CREATE (t)-[:DRAFTED_FOR]->(s)
    RETURN t
  `;
  
  try {
    const results = await executeQuery(query, { team_name, owners, season_number });
    console.log('createFantasyTeam results:', results);
    const team = results[0]?.t?.properties || null;
    console.log('Created team:', team);
    return team;
  } catch (err) {
    console.error('createFantasyTeam error:', err);
    throw err;
  }
};

/**
 * Update a Fantasy Team (owners)
 * @param {string} team_name - Name of the fantasy team
 * @param {Array<string>} owners - Array of owner names
 * @returns {Promise<Object>} - The updated fantasy team
 */
export const updateFantasyTeam = async (team_name, owners) => {
  const query = `
    MATCH (t:FantasyTeam {team_name: $team_name})
    SET t.owners = $owners
    RETURN t
  `;
  const results = await executeQuery(query, { team_name, owners });
  return results[0]?.t?.properties || null;
};

/**
 * Delete a Fantasy Team
 * @param {string} team_name - Name of the fantasy team to delete
 * @returns {Promise<boolean>} - True if deletion successful
 */
export const deleteFantasyTeam = async (team_name) => {
  const query = `
    MATCH (t:FantasyTeam {team_name: $team_name})
    DETACH DELETE t
    RETURN true as success
  `;
  const results = await executeQuery(query, { team_name });
  return results[0]?.success || false;
};

/**
 * Get all Fantasy Teams in a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of fantasy teams with rosters
 */
export const getFantasyTeamsInSeason = async (season_number) => {
  console.log('getFantasyTeamsInSeason called with:', { season_number, type: typeof season_number });
  
  const query = `
    MATCH (t:FantasyTeam)-[:DRAFTED_FOR]->(s:Season {season_number: $season_number})
    OPTIONAL MATCH (t)-[:INCLUDES]->(p:Player)
    RETURN t, collect(p) as roster
    ORDER BY t.team_name
  `;
  
  try {
    const results = await executeQuery(query, { season_number });
    console.log('getFantasyTeamsInSeason raw results:', results);
    const teams = results.map(r => ({
      ...r.t?.properties,
      roster: r.roster?.map(p => p?.properties) || [],
    }));
    console.log('getFantasyTeamsInSeason processed teams:', teams);
    return teams;
  } catch (err) {
    console.error('getFantasyTeamsInSeason error:', err);
    throw err;
  }
};

/**
 * Create a Draft Pick
 * @param {number} season_number - Season number
 * @param {number} round - Draft round number
 * @param {number} pick_number - Pick number within round
 * @param {string} player_name - Full name of player picked (first last)
 * @param {string} team_name - Name of fantasy team making pick
 * @returns {Promise<Object>} - The created draft pick
 */
export const createDraftPick = async (season_number, round, pick_number, player_name, team_name) => {
  const query = `
    MATCH (s:Season {season_number: $season_number})
    MATCH (t:FantasyTeam {team_name: $team_name})
    MATCH (p:Player)
    WHERE (p.first_name + ' ' + p.last_name) = $player_name
    CREATE (dp:DraftPick {
      round: $round,
      pick_number: $pick_number,
      player_name: $player_name
    })-[:PICKED_IN]->(s)
    CREATE (t)-[:MADE_PICK]->(dp)
    RETURN dp
  `;
  const results = await executeQuery(query, { season_number, round, pick_number, player_name, team_name });
  return results[0]?.dp?.properties || null;
};

/**
 * Delete a Draft Pick
 * @param {number} season_number - Season number
 * @param {number} round - Draft round number
 * @param {number} pick_number - Pick number within round
 * @returns {Promise<boolean>} - True if deletion successful
 */
export const deleteDraftPick = async (season_number, round, pick_number) => {
  const query = `
    MATCH (dp:DraftPick {round: $round, pick_number: $pick_number})-[:PICKED_IN]->(s:Season {season_number: $season_number})
    DETACH DELETE dp
    RETURN true as success
  `;
  const results = await executeQuery(query, { season_number, round, pick_number });
  return results[0]?.success || false;
};

/**
 * Get all Draft Picks for a Season
 * @param {number} season_number - The season number
 * @returns {Promise<Array>} - Array of draft picks
 */
export const getDraftPicksForSeason = async (season_number) => {
  const query = `
    MATCH (dp:DraftPick)-[:PICKED_IN]->(s:Season {season_number: $season_number})
    RETURN dp
    ORDER BY dp.round, dp.pick_number
  `;
  const results = await executeQuery(query, { season_number });
  return results.map(r => r.dp?.properties || {});
};
