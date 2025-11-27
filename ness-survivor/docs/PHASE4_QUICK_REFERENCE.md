# Phase 4 Quick Reference Guide

## Shared Components

### Import All Components
```javascript
import {
  LoadingSpinner,
  ErrorBoundary,
  ConfirmModal,
  SearchBar,
  FilterPanel,
  Breadcrumb,
  EmptyState
} from './components/common';
```

### Component Usage Examples

#### LoadingSpinner
```javascript
<LoadingSpinner message="Loading..." size="medium" overlay={false} />
```

#### ErrorBoundary
```javascript
<ErrorBoundary onError={(err) => console.log(err)}>
  <MyComponent />
</ErrorBoundary>
```

#### ConfirmModal
```javascript
<ConfirmModal
  title="Delete?"
  message="Are you sure?"
  type="danger"
  confirmText="Delete"
  isOpen={open}
  onConfirm={handleDelete}
  onCancel={() => setOpen(false)}
/>
```

#### SearchBar
```javascript
<SearchBar
  onSearch={(query) => setQuery(query)}
  suggestions={suggestions}
  searchType="player"
  debounceMs={300}
/>
```

#### FilterPanel
```javascript
<FilterPanel
  filters={[
    { id: 'season', label: 'Season', type: 'select', options: [...] },
    { id: 'tribe', label: 'Tribe', type: 'checkbox', options: [...] }
  ]}
  onFilterChange={(filters) => applyFilters(filters)}
/>
```

#### Breadcrumb
```javascript
<Breadcrumb items={[
  { label: 'Players', path: '/players', icon: '👤' },
  { label: 'John Doe', path: null }
]} />
```

#### EmptyState
```javascript
<EmptyState
  icon="📭"
  title="No Players Found"
  message="Try adjusting your filters"
  action={{ label: 'Create Player', onClick: handleCreate }}
/>
```

## Utility Functions

### Formatters
```javascript
import {
  formatDate,
  formatNumber,
  formatPlayerName,
  formatChallengeWins,
  formatIdolStatus,
  formatPlacement,
  formatCompactNumber,
  truncateString
} from './utils/formatters';

formatDate(new Date());           // "Jan 15, 2025"
formatNumber(1234.5, 2);           // "1,234.50"
formatPlayerName('john', 'doe');  // "John Doe"
formatChallengeWins(5);            // "5 wins"
formatIdolStatus(true, 0);         // "🔥 Has Idol"
formatPlacement(3);                // "3rd"
formatCompactNumber(1234);         // "1.2K"
```

### Constants
```javascript
import {
  COLORS,
  ICONS,
  ROUTES,
  LIMITS,
  PAGINATION,
  BREAKPOINTS,
  MESSAGES,
  FEATURES
} from './utils/constants';

// Colors
COLORS.PRIMARY        // "#667eea"
COLORS.SUCCESS        // "#10b981"
COLORS.DANGER         // "#ef4444"

// Navigation
ROUTES.HOME           // "/"
ROUTES.ADMIN          // "/admin"
ROUTES.LEADERBOARD    // "/leaderboard"

// Limits
LIMITS.SEASON_MIN     // 1
LIMITS.SEASON_MAX     // 100
LIMITS.STRING_MAX     // 100

// Pagination
PAGINATION.DEFAULT_PAGE_SIZE  // 25
PAGINATION.PAGE_SIZES         // [10, 25, 50, 100]
```

### Validation
```javascript
import {
  validateForm,
  hasErrors,
  sanitizeInput,
  validateEmail,
  validateURL,
  validateUnique,
  getValidationRules
} from './utils/validation';

const errors = validateForm(
  { first_name: 'John', age: 25 },
  getValidationRules('player')
);

if (hasErrors(errors)) {
  console.log('Form has errors:', errors);
}
```

## Data Export

### Export Functions
```javascript
import { exportData, exportAsJSON, exportReport } from './utils/dataExport';

// Export to CSV (auto-download)
exportData('players', playerArray, 'csv');
// Downloads: survivors-players-01-15-2025.csv

// Export to JSON
exportAsJSON('teams', teamsArray);
// Downloads: survivors-teams-01-15-2025.json

// Export Report
exportReport({
  totalPlayers: 100,
  topPlayers: [...],
  topTeams: [...]
});
// Downloads: survivors-report-01-15-2025.txt
```

### Specific Export Formats
```javascript
import {
  exportPlayersToCSV,
  exportSeasonsToCSV,
  exportTeamsToCSV,
  exportLeaderboardToCSV,
  downloadFile,
  copyToClipboard
} from './utils/dataExport';

// Get CSV string
const csv = exportPlayersToCSV(players);

// Custom download
downloadFile(csv, 'my-players.csv', 'text/csv');

// Copy to clipboard
await copyToClipboard(csv);
```

## Data Import

### Import Functions
```javascript
import {
  importPlayers,
  importSeasons,
  importTeams
} from './utils/dataImport';

// Import from file
const result = await importPlayers(fileInput.files[0]);

if (result.success) {
  console.log('Imported:', result.data);
} else {
  console.log('Errors:', result.errors);
  console.log('Summary:', result.summary);
  // { total: 20, valid: 19, invalid: 1 }
}
```

### CSV Format Requirements

**Players CSV:**
```
First Name,Last Name,Season,Tribe,Placement,Occupation,Age,Challenges Won,Votes Received,Has Idol,Idols Played
John,Doe,39,Yara,8,Teacher,32,3,2,Yes,0
```

**Seasons CSV:**
```
Season Number,Year,Winner,Runner Up
39,2019,Tony,Natalie
```

**Teams CSV:**
```
Team Name,Owner,Season,Roster Size,Previous Wins
Champions,Bob,39,8,5
```

## Analytics Dashboard

### Basic Usage
```javascript
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';

<AnalyticsDashboard
  draftData={{
    players: [...],
    teams: [...],
    seasons: [...],
    alliances: [...]
  }}
  onExport={() => console.log('Export clicked')}
/>
```

### Metrics Available
- Overview: Players, Teams, Seasons, Alliances
- Players: Total, Avg Wins, With Idols, Top 10
- Teams: Total, Avg Roster Size, Top 10
- Alliances: Total, Avg Size

## File Structure

```
src/
├── components/common/
│   ├── LoadingSpinner.js
│   ├── ErrorBoundary.js
│   ├── ConfirmModal.js
│   ├── SearchBar.js
│   ├── FilterPanel.js
│   ├── Breadcrumb.js
│   ├── EmptyState.js
│   └── index.js
├── utils/
│   ├── formatters.js       (19 functions)
│   ├── constants.js        (100+ constants)
│   ├── validation.js       (enhanced)
│   ├── dataExport.js       (15+ functions)
│   ├── dataImport.js       (12+ functions)
│   └── queryExecutor.js
├── styles/
│   ├── LoadingSpinner.css
│   ├── ErrorBoundary.css
│   ├── ConfirmModal.css
│   ├── SearchBar.css
│   ├── FilterPanel.css
│   ├── Breadcrumb.css
│   ├── EmptyState.css
│   └── AnalyticsDashboard.css
└── pages/admin/
    └── AnalyticsDashboard.js
```

## Best Practices

### Use ErrorBoundary for sections
```javascript
<ErrorBoundary onError={(err) => logError(err)}>
  <AdminSection />
</ErrorBoundary>
```

### Use LoadingSpinner during async operations
```javascript
{isLoading ? (
  <LoadingSpinner message="Loading players..." />
) : (
  <PlayerList players={players} />
)}
```

### Use SearchBar with debounce
```javascript
// Debouncing is automatic (300ms default)
<SearchBar onSearch={(query) => performSearch(query)} />
```

### Format data consistently
```javascript
// Always use formatters for display
<div>
  {formatPlayerName(player.first_name, player.last_name)}
  {formatChallengeWins(player.challenges_won)}
</div>
```

### Export data for reporting
```javascript
<button onClick={() => exportData('players', allPlayers, 'csv')}>
  📊 Export Players
</button>
```

## Performance Tips

1. **Lazy load AnalyticsDashboard** - Only load when needed
2. **Use ErrorBoundary** - Prevents entire app crash
3. **Debounce SearchBar** - Reduces API calls
4. **Cache formatters** - Formatters are pure functions
5. **Batch exports** - Export only needed data

## Troubleshooting

### Component not rendering
- Check if ErrorBoundary catches the error
- Verify props are passed correctly
- Check console for JSX errors

### Export not working
- Check file permissions
- Verify data format
- Use browser console to debug

### Import failing
- Verify CSV/JSON format
- Check file size
- Review error messages in result.errors

---

**Phase 4 is 100% complete!** All shared components, utilities, and advanced features are ready to use in your application.
