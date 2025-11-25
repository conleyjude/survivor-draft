# Survivor Fantasy Draft - UI Implementation Plan

## Overview
This document outlines the comprehensive plan to build out the functional user interface for the Survivor Fantasy Draft app. The app will use Neo4j as the database and React for the frontend, organized into separate data management pages (Create/Edit) and view pages to prevent accidental database modifications.

---

## Phase 1: Foundation & Infrastructure

### 1.1 API Service Layer
**Objective**: Create reusable API service to interact with Neo4j queries

**Tasks**:
- [ ] Create `src/services/neo4jService.js` to handle all database operations
  - Execute CREATE queries (queries 1-7)
  - Execute READ queries (queries 8-16)
  - Execute UPDATE queries (queries 17-25)
  - Execute DELETE queries (queries 26-32)
  - Execute UTILITY queries (queries 33-36)
- [ ] Create `src/utils/queryExecutor.js` for parameterized query execution
- [ ] Implement error handling and response formatting
- [ ] Add loading states and caching where appropriate

### 1.2 State Management
**Objective**: Centralize app state

**Tasks**:
- [ ] Set up Context API or Redux for global state management
- [ ] Create data models/types for:
  - Season
  - Tribe
  - Player
  - Alliance
  - FantasyTeam
- [ ] Implement state hooks for common operations

### 1.3 Routing Structure
**Objective**: Set up page structure with protected routes

**Tasks**:
- [ ] Install React Router (`react-router-dom`)
- [ ] Create route structure:
  ```
  / - Dashboard/Home
  /seasons - View all seasons
  /seasons/:id - Season detail view
  /admin/seasons - Season creation/edit
  /admin/tribes - Tribe creation/edit
  /admin/players - Player creation/edit
  /admin/alliances - Alliance creation/edit
  /admin/fantasy-teams - Fantasy team creation/edit
  /admin/draft - Draft management
  ```

---

## Phase 2: Data Creation/Management (Admin Pages)

### 2.1 Season Management
**File**: `src/pages/admin/SeasonManager.js`

**Features**:
- [ ] Form to create new season (Query #1)
  - Input: season_number, year
  - Submit to database
  - Validation: Unique season number
- [ ] List all seasons (Query #8)
- [ ] Edit season information
- [ ] Delete season with confirmation modal (Query #32)

**Components**:
- `SeasonForm.js` - Create/Edit form
- `SeasonList.js` - Display list of seasons
- `SeasonDeleteConfirm.js` - Confirmation dialog

---

### 2.2 Tribe Management
**File**: `src/pages/admin/TribeManager.js`

**Features**:
- [ ] Form to create new tribe (Query #2)
  - Dropdown to select Season
  - Input: tribe_name, tribe_color
  - Link to season automatically
- [ ] List tribes by season (Query #9)
- [ ] Edit tribe information
- [ ] Delete tribe with warning (Query #30)

**Components**:
- `TribeForm.js` - Create/Edit form with season selector
- `TribeList.js` - Display tribes by season
- `ColorPicker.js` - For tribe_color selection

---

### 2.3 Player Management
**File**: `src/pages/admin/PlayerManager.js`

**Features**:
- [ ] Form to create new player (Query #3)
  - Season dropdown
  - Tribe dropdown (filtered by season)
  - Inputs: first_name, last_name, occupation, hometown, archetype, notes
  - Auto-initialize: challenges_won=0, has_idol=false, idols_played=0, votes_received=0
- [ ] List players by season or tribe (Query #10, #11)
- [ ] Edit player basic info (Query #19)
- [ ] Edit player stats (Query #17)
- [ ] Move player to different tribe (Query #20)
- [ ] Toggle player idol status (Query #25)
- [ ] Delete player (Query #28)

**Components**:
- `PlayerForm.js` - Create/Edit form with cascading dropdowns
- `PlayerList.js` - Searchable, filterable list
- `PlayerStats.js` - Stats update interface
- `TribeSwapModal.js` - Tribe reassignment

---

### 2.4 Alliance Management
**File**: `src/pages/admin/AllianceManager.js`

**Features**:
- [ ] Form to create new alliance (Query #4)
  - Season dropdown
  - Inputs: alliance_name, formation_episode, dissolved_episode, size, notes
- [ ] List alliances by season (Custom query)
- [ ] Add players to alliance (Query #5)
  - Multi-select of players
- [ ] Edit alliance info (Query #21)
- [ ] Remove players from alliance (Query #26)
- [ ] Delete alliance (Query #29)

**Components**:
- `AllianceForm.js` - Create/Edit form
- `AllianceList.js` - List alliances
- `AllianceMemberSelector.js` - Multi-select player picker

---

### 2.5 Fantasy Team & Draft Management
**File**: `src/pages/admin/DraftManager.js`

**Features**:
- [ ] Form to create fantasy team (Query #6)
  - Inputs: team_name, members, previous_wins
- [ ] List all fantasy teams (Query #15)
- [ ] Draft player to team interface (Query #7)
  - Show available players (Query #36)
  - Drag-and-drop or click-to-draft
  - Update draft order
- [ ] Remove player from draft (Query #27)
- [ ] Edit team info (Query #22)
- [ ] Delete team (Query #31)
- [ ] View draft leaderboard (Query #34)

**Components**:
- `FantasyTeamForm.js` - Create/Edit team
- `DraftBoard.js` - Main draft interface
- `AvailablePlayersList.js` - Undrafted players
- `DraftedRoster.js` - Team roster view

---

## Phase 3: View Pages

### 3.1 Season Overview
**File**: `src/pages/views/SeasonView.js`

**Features**:
- [ ] Display season details
- [ ] Show all tribes and player counts (Query #16)
- [ ] List all players in season (Query #10)
- [ ] List all alliances in season
- [ ] Season statistics dashboard

**Components**:
- `SeasonHeader.js` - Season info
- `TribesOverview.js` - Tribes and player counts
- `PlayersGrid.js` - Display all players
- `AlliancesPanel.js` - All alliances in season

---

### 3.2 Player Detail View
**File**: `src/pages/views/PlayerDetail.js`

**Features**:
- [ ] Complete player profile (Query #12)
  - Basic info
  - Tribe assignment
  - Season
  - Alliances
  - Fantasy team (if drafted)
- [ ] Player statistics
  - Challenges won
  - Votes received
  - Idols played
  - Current idol status
- [ ] Links to related data

**Components**:
- `PlayerCard.js` - Detailed player info
- `PlayerStats.js` - Statistics display
- `RelatedData.js` - Links to tribe, alliances, fantasy team

---

### 3.3 Tribe View
**File**: `src/pages/views/TribeView.js`

**Features**:
- [ ] Tribe details (color, season, name)
- [ ] All players on tribe (Query #11)
- [ ] Tribe statistics (member count, challenges won, etc.)
- [ ] Alliance composition

**Components**:
- `TribeHeader.js` - Tribe info with color display
- `TribeRoster.js` - List of tribe members
- `TribeStats.js` - Aggregated statistics

---

### 3.4 Alliance View
**File**: `src/pages/views/AllianceView.js`

**Features**:
- [ ] Alliance details
- [ ] All members (Query #13)
- [ ] Alliance timeline (formation to dissolution)
- [ ] Member statistics

**Components**:
- `AllianceHeader.js` - Alliance info and timeline
- `AllianceMembers.js` - List of members

---

### 3.5 Fantasy Team View
**File**: `src/pages/views/FantasyTeamView.js`

**Features**:
- [ ] Team details
- [ ] Complete roster (Query #14)
- [ ] Team statistics
  - Total challenges won
  - Roster size
  - Scores vs other teams

**Components**:
- `TeamHeader.js` - Team name and info
- `RosterGrid.js` - Players on team
- `TeamStats.js` - Performance metrics

---

### 3.6 Leaderboard View
**File**: `src/pages/views/Leaderboard.js`

**Features**:
- [ ] Fantasy team leaderboard (Query #34)
- [ ] Sortable columns
  - Team name
  - Total challenge wins
  - Roster size
  - Previous wins
- [ ] Real-time scoring updates

**Components**:
- `LeaderboardTable.js` - Sortable table
- `TeamRow.js` - Individual team row

---

## Phase 4: Shared Components & Utilities

### 4.1 Common Components
- [ ] `LoadingSpinner.js` - Loading state display
- [ ] `ErrorBoundary.js` - Error handling
- [ ] `ConfirmModal.js` - Generic confirmation dialog
- [ ] `SearchBar.js` - Filterable search
- [ ] `FilterPanel.js` - Multi-filter interface
- [ ] `Breadcrumb.js` - Navigation helper
- [ ] `EmptyState.js` - Empty data display

### 4.2 Utilities
- [ ] `validation.js` - Form validation rules
- [ ] `formatters.js` - Data formatting functions
- [ ] `constants.js` - App constants and enums
- [ ] `hooks/useNeo4j.js` - Custom hook for database operations

### 4.3 Styling
- [ ] Create responsive layout system
- [ ] Color scheme for tribes
- [ ] Consistent spacing and typography
- [ ] Mobile-friendly design

---

## Phase 5: Integration & Testing

### 5.1 Integration
- [ ] Connect all pages to API service
- [ ] Test all CRUD operations
- [ ] Verify relationships are maintained
- [ ] Test data validation

### 5.2 Testing
- [ ] Unit tests for services
- [ ] Component tests for key pages
- [ ] Integration tests for workflows
- [ ] E2E tests for critical paths

### 5.3 Error Handling
- [ ] Graceful error messages
- [ ] Retry mechanisms
- [ ] Data validation before submission
- [ ] User feedback on success/failure

---

## Phase 6: Admin Features

### 6.1 Administrative Pages
**File**: `src/pages/admin/AdminDashboard.js`

**Features**:
- [ ] Quick access to all admin functions
- [ ] Recent activity log
- [ ] Data statistics
- [ ] Bulk import option (future)

---

## File Structure Summary

```
src/
├── pages/
│   ├── admin/
│   │   ├── SeasonManager.js
│   │   ├── TribeManager.js
│   │   ├── PlayerManager.js
│   │   ├── AllianceManager.js
│   │   ├── DraftManager.js
│   │   └── AdminDashboard.js
│   └── views/
│       ├── SeasonView.js
│       ├── PlayerDetail.js
│       ├── TribeView.js
│       ├── AllianceView.js
│       ├── FantasyTeamView.js
│       └── Leaderboard.js
├── components/
│   ├── forms/
│   │   ├── SeasonForm.js
│   │   ├── TribeForm.js
│   │   ├── PlayerForm.js
│   │   ├── AllianceForm.js
│   │   └── FantasyTeamForm.js
│   ├── common/
│   │   ├── LoadingSpinner.js
│   │   ├── ConfirmModal.js
│   │   ├── SearchBar.js
│   │   └── Breadcrumb.js
│   └── display/
│       ├── PlayerCard.js
│       ├── TribeRoster.js
│       └── LeaderboardTable.js
├── services/
│   └── neo4jService.js
├── hooks/
│   └── useNeo4j.js
├── utils/
│   ├── validation.js
│   ├── formatters.js
│   ├── constants.js
│   └── queryExecutor.js
└── styles/
    └── [component styles]
```

---

## Implementation Priority

### Priority 1 (MVP)
1. API service layer & Neo4j connection
2. Season and Tribe management
3. Player creation and basic view
4. Fantasy Team creation
5. Basic leaderboard

### Priority 2
1. Alliance management
2. Detailed player view
3. Player editing and stats
4. Tribe and alliance views

### Priority 3
1. Advanced filtering and search
2. Bulk operations
3. Data export
4. Admin dashboard

---

## Security Considerations

- [ ] Separate admin routes with authentication
- [ ] Validate all inputs server-side
- [ ] Prevent direct database access from frontend
- [ ] Use parameterized queries (already in place)
- [ ] Rate limiting on API calls
- [ ] User session management

---

## Dependencies to Install

```json
{
  "react-router-dom": "^6.x",
  "neo4j-driver": "^5.x",
  "axios": "^1.x",
  "react-hook-form": "^7.x",
  "classnames": "^2.x"
}
```

---

## Next Steps

1. **Week 1**: Phase 1 (Foundation & Infrastructure)
2. **Week 2-3**: Phase 2 (Admin pages)
3. **Week 4**: Phase 3 (View pages)
4. **Week 5**: Phase 4-5 (Components, testing, integration)
5. **Week 6**: Phase 6 & Polish
