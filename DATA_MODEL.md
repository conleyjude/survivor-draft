# Survivor Draft Data Model

## Entity Relationship Diagram

```mermaid
erDiagram
    SEASON ||--o{ TRIBE : "HAS_TRIBE"
    SEASON ||--o{ PLAYER : "via tribes"
    SEASON ||--o{ ALLIANCE : "FORMED_IN"
    SEASON ||--o{ FANTASY_TEAM : "season_number"
    SEASON ||--o{ DRAFT_PICK : "PICKED_IN"
    
    TRIBE ||--o{ PLAYER : "BELONGS_TO"
    
    PLAYER ||--o{ TRIBE : "BELONGS_TO"
    PLAYER ||--o{ SEASON : "COMPETES_IN"
    PLAYER ||--o{ ALLIANCE : "MEMBER_OF"
    PLAYER ||--o{ FANTASY_TEAM : "ON_TEAM"
    
    ALLIANCE ||--o{ SEASON : "FORMED_IN"
    ALLIANCE ||--o{ PLAYER : "MEMBER_OF"
    
    FANTASY_TEAM ||--o{ PLAYER : "ON_TEAM"
    FANTASY_TEAM ||--o{ DRAFT_PICK : "MADE_PICK"
    
    DRAFT_PICK ||--o{ SEASON : "PICKED_IN"
    DRAFT_PICK ||--o{ FANTASY_TEAM : "MADE_PICK"

    SEASON {
        int season_number PK
        int year
    }
    
    TRIBE {
        string tribe_name
        string tribe_color
    }
    
    PLAYER {
        string first_name
        string last_name
        string occupation
        string hometown
        string archetype
        int challenges_won
        boolean has_idol
        int idols_played
        int votes_received
        string notes
    }
    
    ALLIANCE {
        string alliance_name
        int formation_episode
        int dissolved_episode
        int size
        string notes
    }
    
    FANTASY_TEAM {
        string team_name
        string owner_names
        int season_number FK
    }
    
    DRAFT_PICK {
        int round
        int pick_number
        string player_name
    }
```

## Relationship Matrix

| From | To | Relationship | Purpose |
|------|----|----|---------|
| Season | Tribe | `HAS_TRIBE` | Groups tribes within a season |
| Tribe | Player | `BELONGS_TO` | Assigns players to their starting tribe |
| Player | Season | `COMPETES_IN` | Links players to seasons they appeared in |
| Season | Alliance | `FORMED_IN` | Groups alliances within a season |
| Alliance | Player | `MEMBER_OF` | Links players to alliances they joined |
| FantasyTeam | Player | `ON_TEAM` | **Draft roster** - tracks which players are on which fantasy team |
| FantasyTeam | DraftPick | `MADE_PICK` | Links fantasy team to its draft selections |
| DraftPick | Season | `PICKED_IN` | Links draft picks to the season they occurred in |

## Node Types & Properties

### Season
- **Properties:** `season_number` (int), `year` (int)
- **Primary Key:** `season_number`
- **Role:** Root node grouping all content for a specific Survivor season

### Tribe
- **Properties:** `tribe_name` (string), `tribe_color` (string/hex)
- **Primary Key:** `tribe_name` (unique within season via `HAS_TRIBE`)
- **Role:** Survivor starting tribes (e.g., "Mamanuca", "Naviti")

### Player
- **Properties:**
  - Basic: `first_name`, `last_name`, `occupation`, `hometown`, `archetype`, `notes`
  - Game stats: `challenges_won`, `has_idol`, `idols_played`, `votes_received`
- **Primary Key:** `(first_name, last_name)` compound key
- **Role:** Individual Survivor contestants

### Alliance
- **Properties:** `alliance_name`, `formation_episode`, `dissolved_episode`, `size`, `notes`
- **Primary Key:** `alliance_name` (unique within season via `FORMED_IN`)
- **Role:** In-game alliances formed during the season

### FantasyTeam
- **Properties:** `team_name`, `owner_names` (comma-separated), `season_number` (FK)
- **Primary Key:** `team_name` (unique within season via `season_number`)
- **Role:** Fantasy draft team tracking player selections

### DraftPick
- **Properties:** `round` (int), `pick_number` (int), `player_name` (string)
- **Purpose:** History tracking of draft selections
- **Role:** Immutable record of draft decisions

## Key Design Decisions

### 1. ON_TEAM Relationship (instead of DRAFTED_BY)
- Tracks current roster state
- Future-ready for trade functionality (trades would update `ON_TEAM` edges)
- Enables quick queries: "Which fantasy team has this player?"

### 2. DraftPick Node (History Tracking)
- Separate node for immutable draft history
- Stores `round` and `pick_number` for draft order tracking
- Allows future analytics: draft value tracking, reaching trades, etc.
- Combined with `ON_TEAM`, provides complete draft narrative

### 3. Compound Primary Keys
- **Player:** `(first_name, last_name)` - allows same name reuse across seasons
- **Tribe:** `tribe_name` with uniqueness constraint per season via `HAS_TRIBE`
- **FantasyTeam:** `team_name` with uniqueness per season via `season_number` property

### 4. Alliance Model
- Separate `MEMBER_OF` relationship from season participation
- Tracks multiple alliances per player per season
- Includes episode-level timeline data

### 5. Type Coercion Patterns
- Season numbers: Always pass as `Number()` to ensure integer matching
- Player names: Full name concatenation `(first_name + ' ' + last_name)` for uniqueness
- Comma-separated strings: `owner_names` parsed in validation layer

## Frozen Version
**Date:** December 10, 2025
**Status:** Production-ready, no further changes planned

This data model supports:
- ✅ Multi-season player tracking
- ✅ Fantasy team management with draft history
- ✅ Alliance analytics
- ✅ Player statistics and metadata
- ✅ Future trade system (via ON_TEAM edge updates)
- ✅ Complete draft audit trail (via DraftPick nodes)