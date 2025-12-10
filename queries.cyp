// ============================================
// CREATE QUERIES
// ============================================

// 1. Create a new Season
CREATE (s:Season {
  season_number: $season_number,
  year: $year
})
RETURN s

// 2. Create a new Tribe (and link to Season)
MATCH (s:Season {season_number: $season_number})
CREATE (t:Tribe {
  tribe_name: $tribe_name,
  tribe_color: $tribe_color
})
CREATE (s)-[:HAS_TRIBE]->(t)
RETURN t

// 3. Create a new Player (and link to Tribe + Season)
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

// 4. Create a new Alliance (and link to Season)
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

// 5. Add Player to Alliance
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
MATCH (a:Alliance {alliance_name: $alliance_name})
CREATE (p)-[:MEMBER_OF]->(a)
RETURN p, a

// 6. Create a new Fantasy Team
CREATE (ft:FantasyTeam {
  team_name: $team_name,
  members: $members,
  previous_wins: $previous_wins
})
RETURN ft

// 7. Draft a Player to Fantasy Team
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
MATCH (ft:FantasyTeam {team_name: $team_name})
CREATE (p)-[:ON_TEAM]->(ft)
RETURN p, ft


// ============================================
// READ QUERIES
// ============================================

// 8. Get all Seasons
MATCH (s:Season)
RETURN s
ORDER BY s.season_number

// 9. Get all Tribes in a Season
MATCH (s:Season {season_number: $season_number})-[:HAS_TRIBE]->(t:Tribe)
RETURN t

// 10. Get all Players in a Season
MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
RETURN p
ORDER BY p.last_name

// 11. Get all Players on a Tribe
MATCH (p:Player)-[:BELONGS_TO]->(t:Tribe {tribe_name: $tribe_name})
RETURN p

// 12. Get Player with all relationships
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
OPTIONAL MATCH (p)-[:BELONGS_TO]->(t:Tribe)
OPTIONAL MATCH (p)-[:COMPETES_IN]->(s:Season)
OPTIONAL MATCH (p)-[:MEMBER_OF]->(a:Alliance)
OPTIONAL MATCH (p)-[:ON_TEAM]->(ft:FantasyTeam)
RETURN p, t, s, collect(a) as alliances, ft

// 13. Get all Players in an Alliance
MATCH (p:Player)-[:MEMBER_OF]->(a:Alliance {alliance_name: $alliance_name})
RETURN p

// 14. Get Fantasy Team with all drafted Players
MATCH (ft:FantasyTeam {team_name: $team_name})
OPTIONAL MATCH (p:Player)-[:ON_TEAM]->(ft)
RETURN ft, collect(p) as drafted_players

// 15. Get all Fantasy Teams
MATCH (ft:FantasyTeam)
RETURN ft
ORDER BY ft.team_name

// 16. Get Season Overview (all tribes and player counts)
MATCH (s:Season {season_number: $season_number})-[:HAS_TRIBE]->(t:Tribe)
OPTIONAL MATCH (p:Player)-[:BELONGS_TO]->(t)
RETURN s, t, count(p) as player_count


// ============================================
// UPDATE QUERIES
// ============================================

// 17. Update Player Stats (after challenge/episode)
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
SET p.challenges_won = $challenges_won,
    p.has_idol = $has_idol,
    p.idols_played = $idols_played,
    p.votes_received = $votes_received
RETURN p

// 18. Update Player Notes
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
SET p.notes = $notes
RETURN p

// 19. Update Player Basic Info
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
SET p.occupation = $occupation,
    p.hometown = $hometown,
    p.archetype = $archetype
RETURN p

// 20. Move Player to Different Tribe (tribe swap)
MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:BELONGS_TO]->(old_tribe:Tribe)
MATCH (new_tribe:Tribe {tribe_name: $new_tribe_name})
DELETE r
CREATE (p)-[:BELONGS_TO]->(new_tribe)
RETURN p, new_tribe

// 21. Update Alliance (mark as dissolved)
MATCH (a:Alliance {alliance_name: $alliance_name})
SET a.dissolved_episode = $dissolved_episode,
    a.notes = $notes
RETURN a

// 22. Update Fantasy Team
MATCH (ft:FantasyTeam {team_name: $team_name})
SET ft.members = $members,
    ft.previous_wins = $previous_wins
RETURN ft

// 23. Increment Player Challenge Wins
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
SET p.challenges_won = p.challenges_won + 1
RETURN p

// 24. Increment Player Votes Received
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
SET p.votes_received = p.votes_received + 1
RETURN p

// 25. Toggle Player Idol Status
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
SET p.has_idol = NOT p.has_idol
RETURN p


// ============================================
// DELETE QUERIES
// ============================================

// 26. Remove Player from Alliance
MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:MEMBER_OF]->(a:Alliance {alliance_name: $alliance_name})
DELETE r
RETURN p

// 27. Remove Player from Fantasy Team
MATCH (p:Player {first_name: $first_name, last_name: $last_name})-[r:ON_TEAM]->(ft:FantasyTeam)
DELETE r
RETURN p

// 28. Delete a Player (and all relationships)
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
DETACH DELETE p

// 29. Delete an Alliance (and all relationships)
MATCH (a:Alliance {alliance_name: $alliance_name})
DETACH DELETE a

// 30. Delete a Tribe (WARNING: should remove player relationships first)
MATCH (t:Tribe {tribe_name: $tribe_name})
DETACH DELETE t

// 31. Delete a Fantasy Team (and all draft relationships)
MATCH (ft:FantasyTeam {team_name: $team_name})
DETACH DELETE ft

// 32. Delete a Season (WARNING: cascades to all related data)
MATCH (s:Season {season_number: $season_number})
DETACH DELETE s


// ============================================
// UTILITY QUERIES
// ============================================

// 33. Get Player Stats Summary for Season
MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
RETURN p.first_name + ' ' + p.last_name as player_name,
       p.challenges_won,
       p.idols_played,
       p.votes_received,
       p.has_idol
ORDER BY p.challenges_won DESC

// 34. Get Fantasy Team Leaderboard (by total challenge wins)
MATCH (ft:FantasyTeam)
OPTIONAL MATCH (p:Player)-[:ON_TEAM]->(ft)
RETURN ft.team_name,
       ft.previous_wins,
       sum(p.challenges_won) as total_challenge_wins,
       count(p) as roster_size
ORDER BY total_challenge_wins DESC

// 35. Check if Player exists
MATCH (p:Player {first_name: $first_name, last_name: $last_name})
RETURN count(p) > 0 as exists

// 36. Get all available Players (not yet drafted)
MATCH (p:Player)-[:COMPETES_IN]->(s:Season {season_number: $season_number})
WHERE NOT (p)-[:ON_TEAM]->(:FantasyTeam)
RETURN p
ORDER BY p.last_name